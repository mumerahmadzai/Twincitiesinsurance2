from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Literal
from collections import defaultdict, deque
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import resend


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_TTL_HOURS = 12
SHARE_TOKEN_TTL_HOURS = 72

RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
RESEND_FROM = os.environ.get("RESEND_FROM", "onboarding@resend.dev")
ADMIN_NOTIFICATION_EMAIL = os.environ.get("ADMIN_NOTIFICATION_EMAIL", "")
SEND_CUSTOMER_CONFIRMATION = os.environ.get("SEND_CUSTOMER_CONFIRMATION", "false").lower() == "true"
QUOTE_RATE_LIMIT_PER_HOUR = int(os.environ.get("QUOTE_RATE_LIMIT_PER_HOUR", "20"))

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

# Bound concurrent Resend calls (free tier = 5 req/sec). 3 keeps us safely under.
_resend_semaphore = asyncio.Semaphore(3)

app = FastAPI(title="Twin Cities Insurance API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ---------- Rate limiting (per-IP, in-memory sliding window) ----------
_quote_hits: dict[str, deque] = defaultdict(deque)


def _client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for", "")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _rate_limit_quote(request: Request) -> None:
    ip = _client_ip(request)
    now = datetime.now(timezone.utc)
    window_start = now - timedelta(hours=1)
    bucket = _quote_hits[ip]
    while bucket and bucket[0] < window_start:
        bucket.popleft()
    if len(bucket) >= QUOTE_RATE_LIMIT_PER_HOUR:
        raise HTTPException(
            status_code=429,
            detail="Too many submissions from this network. Please try again later or call 612-222-1749.",
        )
    bucket.append(now)


# ---------- Models ----------
class QuoteCreate(BaseModel):
    risk_type: Literal["limousine_livery_fleet", "small_business_lines", "home_auto_bundle"]
    legal_name: str = Field(..., min_length=2, max_length=200)
    zip_code: str = Field(..., min_length=5, max_length=10)
    dot_number: Optional[str] = Field(default=None, max_length=20)
    contact_name: str = Field(..., min_length=2, max_length=120)
    phone: str = Field(..., min_length=7, max_length=30)
    email: EmailStr
    # Honeypot: real users never fill this (it's hidden). Bots auto-fill it → silently reject.
    website: Optional[str] = Field(default="", max_length=200)


class Quote(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    risk_type: str
    legal_name: str
    zip_code: str
    dot_number: Optional[str] = None
    contact_name: str
    phone: str
    email: str
    status: str = "received"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class QuoteResponse(BaseModel):
    id: str
    status: str
    message: str
    received_at: datetime


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=4, max_length=200)


class LoginResponse(BaseModel):
    token: str
    user: dict


class ShareLinkResponse(BaseModel):
    token: str
    expires_at: datetime
    quote_id: str


class CarrierQuote(BaseModel):
    """Public-safe projection of a Quote for carrier shopping (no internal id)."""
    risk_type: str
    legal_name: str
    zip_code: str
    dot_number: Optional[str] = None
    contact_name: str
    phone: str
    email: str
    status: str
    created_at: datetime


# ---------- Auth helpers ----------
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_TTL_HOURS),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_admin(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth[7:]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    if payload.get("type") != "access" or payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ---------- Email helpers ----------
RISK_LABELS = {
    "limousine_livery_fleet": "Limousine / Livery Fleet",
    "small_business_lines": "Small Business Lines (BOP / WC / Inland Marine)",
    "home_auto_bundle": "Home & Auto Bundle",
}


def _admin_notification_html(q: Quote) -> str:
    risk = RISK_LABELS.get(q.risk_type, q.risk_type)
    submitted = q.created_at.strftime("%b %d, %Y · %I:%M %p UTC")
    dot_row = (
        f'<tr><td style="padding:8px 0;color:#666;">DOT #</td>'
        f'<td style="padding:8px 0;color:#111;font-weight:600;">{q.dot_number}</td></tr>'
        if q.dot_number
        else ""
    )
    return f"""
    <html><body style="font-family:Arial,Helvetica,sans-serif;background:#f6f7f9;padding:24px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e6e6ea;">
        <tr><td style="background:#0B0F19;padding:24px;color:#D4AF37;font-size:18px;font-weight:600;letter-spacing:0.5px;">
          Twin Cities Insurance &nbsp;&middot;&nbsp; <span style="color:#fff;font-weight:400;">New Quote Submitted</span>
        </td></tr>
        <tr><td style="padding:28px;">
          <p style="margin:0 0 18px;color:#111;font-size:16px;">A new application just landed in the pipeline.</p>
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size:14px;">
            <tr><td style="padding:8px 0;color:#666;width:35%;">Risk Type</td><td style="padding:8px 0;color:#111;font-weight:600;">{risk}</td></tr>
            <tr><td style="padding:8px 0;color:#666;">Legal Name</td><td style="padding:8px 0;color:#111;font-weight:600;">{q.legal_name}</td></tr>
            <tr><td style="padding:8px 0;color:#666;">ZIP</td><td style="padding:8px 0;color:#111;font-weight:600;">{q.zip_code}</td></tr>
            {dot_row}
            <tr><td style="padding:8px 0;color:#666;">Contact</td><td style="padding:8px 0;color:#111;font-weight:600;">{q.contact_name}</td></tr>
            <tr><td style="padding:8px 0;color:#666;">Phone</td><td style="padding:8px 0;color:#111;font-weight:600;"><a href="tel:{q.phone}" style="color:#111;text-decoration:none;">{q.phone}</a></td></tr>
            <tr><td style="padding:8px 0;color:#666;">Email</td><td style="padding:8px 0;color:#111;font-weight:600;"><a href="mailto:{q.email}" style="color:#111;text-decoration:none;">{q.email}</a></td></tr>
            <tr><td style="padding:8px 0;color:#666;">Submitted</td><td style="padding:8px 0;color:#111;">{submitted}</td></tr>
            <tr><td style="padding:8px 0;color:#666;">Reference</td><td style="padding:8px 0;color:#111;font-family:monospace;">{q.id[:8].upper()}</td></tr>
          </table>
          <p style="margin:24px 0 0;color:#666;font-size:13px;">Open the <strong>Agent Portal</strong> to view full details, generate carrier share links, or export the pipeline.</p>
        </td></tr>
        <tr><td style="background:#fafbfc;padding:16px 28px;border-top:1px solid #eee;color:#888;font-size:12px;">
          Sent by Twin Cities Insurance &middot; Principal Agent Muhammad Umar Ahmadzai &middot; 612-222-1749
        </td></tr>
      </table>
    </body></html>
    """


def _customer_confirmation_html(q: Quote) -> str:
    risk = RISK_LABELS.get(q.risk_type, q.risk_type)
    return f"""
    <html><body style="font-family:Arial,Helvetica,sans-serif;background:#f6f7f9;padding:24px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e6e6ea;">
        <tr><td style="background:#0B0F19;padding:24px;color:#D4AF37;font-size:18px;font-weight:600;letter-spacing:0.5px;">
          Twin Cities Insurance
        </td></tr>
        <tr><td style="padding:28px;">
          <h2 style="margin:0 0 14px;color:#111;font-size:22px;">Application received, {q.contact_name.split()[0]}.</h2>
          <p style="margin:0 0 18px;color:#333;font-size:15px;line-height:1.55;">
            Thank you for choosing Twin Cities Insurance for your <strong>{risk}</strong> coverage.
            Principal Agent <strong>Muhammad Umar Ahmadzai</strong> is personally reviewing your placement and will return with market options shortly.
          </p>
          <p style="margin:0 0 18px;color:#333;font-size:15px;line-height:1.55;">
            <strong>Your reference number:</strong>
            <span style="font-family:monospace;background:#f3f3f5;padding:4px 8px;border-radius:4px;">{q.id[:8].upper()}</span>
          </p>
          <p style="margin:0 0 6px;color:#666;font-size:13px;">Need to reach us immediately?</p>
          <p style="margin:0;color:#111;font-size:14px;">
            <a href="tel:6122221749" style="color:#0B0F19;text-decoration:none;font-weight:600;">612-222-1749</a>
            &nbsp;&middot;&nbsp;
            <a href="mailto:mumerahmadzai@gmail.com" style="color:#0B0F19;text-decoration:none;font-weight:600;">mumerahmadzai@gmail.com</a>
          </p>
        </td></tr>
        <tr><td style="background:#fafbfc;padding:16px 28px;border-top:1px solid #eee;color:#888;font-size:12px;">
          Twin Cities Insurance is an independent P&amp;C brokerage operating in full compliance with the Minnesota Department of Commerce.<br>
          Minneapolis &middot; Saint Paul, MN
        </td></tr>
      </table>
    </body></html>
    """


async def _send_email_safe(to: str, subject: str, html: str) -> None:
    if not RESEND_API_KEY:
        logger.info("RESEND_API_KEY not configured — skipping email to %s", to)
        return
    # Throttle to stay under Resend's 5 req/sec limit, with retry on 429
    async with _resend_semaphore:
        params = {"from": RESEND_FROM, "to": [to], "subject": subject, "html": html}
        for attempt in range(3):
            try:
                result = await asyncio.to_thread(resend.Emails.send, params)
                logger.info("Email sent to %s (id=%s)", to, result.get("id") if isinstance(result, dict) else result)
                return
            except Exception as e:
                msg = str(e).lower()
                is_rate = "429" in msg or "too many" in msg or "rate" in msg
                if is_rate and attempt < 2:
                    backoff = 0.6 * (attempt + 1)
                    logger.info("Resend 429 to %s — retrying in %.1fs (attempt %d/3)", to, backoff, attempt + 1)
                    await asyncio.sleep(backoff)
                    continue
                logger.warning("Resend send failed for %s: %s", to, e)
                return


async def _fire_quote_emails(q: Quote) -> None:
    risk = RISK_LABELS.get(q.risk_type, q.risk_type)
    # 1. Admin notification (always on if RESEND_API_KEY + ADMIN_NOTIFICATION_EMAIL)
    if ADMIN_NOTIFICATION_EMAIL:
        await _send_email_safe(
            to=ADMIN_NOTIFICATION_EMAIL,
            subject=f"[TCI Pipeline] New {risk} quote — {q.legal_name}",
            html=_admin_notification_html(q),
        )
    # 2. Customer confirmation (only when domain is verified — gated by SEND_CUSTOMER_CONFIRMATION)
    if SEND_CUSTOMER_CONFIRMATION:
        await _send_email_safe(
            to=q.email,
            subject="Twin Cities Insurance — Application Received",
            html=_customer_confirmation_html(q),
        )


# ---------- Auth routes ----------
@api_router.post("/auth/login", response_model=LoginResponse)
async def auth_login(payload: LoginRequest):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["id"], user["email"], user.get("role", "admin"))
    return LoginResponse(
        token=token,
        user={
            "id": user["id"],
            "email": user["email"],
            "name": user.get("name", "Admin"),
            "role": user.get("role", "admin"),
        },
    )


@api_router.get("/auth/me")
async def auth_me(user: dict = Depends(get_current_admin)):
    return user


# ---------- Quote routes ----------
@api_router.get("/")
async def root():
    return {"service": "Twin Cities Insurance API", "status": "online"}


@api_router.get("/health")
async def health():
    try:
        await db.command("ping")
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"DB unavailable: {e}")


@api_router.post("/quotes", response_model=QuoteResponse, status_code=201)
async def create_quote(payload: QuoteCreate, request: Request):
    # Honeypot: silently accept (return a believable response) but DO NOT store / notify
    if payload.website:
        logger.info("Honeypot tripped from %s — silently discarding", _client_ip(request))
        return QuoteResponse(
            id=str(uuid.uuid4()),
            status="received",
            message="Application Received Securely.",
            received_at=datetime.now(timezone.utc),
        )

    _rate_limit_quote(request)

    quote_data = payload.model_dump()
    quote_data.pop("website", None)  # never persist the honeypot field
    quote = Quote(**quote_data)
    doc = quote.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.quotes.insert_one(doc)

    # Fire emails in background — never block / never raise back to the user
    asyncio.create_task(_fire_quote_emails(quote))

    return QuoteResponse(
        id=quote.id,
        status=quote.status,
        message=(
            "Application Received Securely. Principal Agent Muhammad Umar Ahmadzai "
            "is reviewing the placement."
        ),
        received_at=quote.created_at,
    )


@api_router.get("/quotes", response_model=List[Quote])
async def list_quotes(limit: int = 200, _admin: dict = Depends(get_current_admin)):
    docs = await db.quotes.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    for d in docs:
        if isinstance(d.get('created_at'), str):
            d['created_at'] = datetime.fromisoformat(d['created_at'])
    return docs


@api_router.get("/quotes/{quote_id}", response_model=Quote)
async def get_quote(quote_id: str, _admin: dict = Depends(get_current_admin)):
    doc = await db.quotes.find_one({"id": quote_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Quote not found")
    if isinstance(doc.get('created_at'), str):
        doc['created_at'] = datetime.fromisoformat(doc['created_at'])
    return doc


@api_router.post("/quotes/{quote_id}/share-link", response_model=ShareLinkResponse)
async def create_share_link(quote_id: str, _admin: dict = Depends(get_current_admin)):
    """Generate a time-limited tokenized URL for a single quote."""
    doc = await db.quotes.find_one({"id": quote_id}, {"_id": 0, "id": 1})
    if not doc:
        raise HTTPException(status_code=404, detail="Quote not found")
    exp = datetime.now(timezone.utc) + timedelta(hours=SHARE_TOKEN_TTL_HOURS)
    payload = {
        "quote_id": quote_id,
        "exp": exp,
        "type": "share",
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return ShareLinkResponse(token=token, expires_at=exp, quote_id=quote_id)


@api_router.get("/share/{token}", response_model=CarrierQuote)
async def view_shared_quote(token: str):
    """Public endpoint — validates a share JWT and returns the carrier-safe quote view."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=410, detail="This share link has expired.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Invalid share link.")
    if payload.get("type") != "share":
        raise HTTPException(status_code=400, detail="Invalid share link.")
    quote_id = payload.get("quote_id")
    doc = await db.quotes.find_one({"id": quote_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Quote no longer available.")
    if isinstance(doc.get('created_at'), str):
        doc['created_at'] = datetime.fromisoformat(doc['created_at'])
    return doc


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def seed_admin():
    """Idempotent admin seed. If credentials change in .env, the password hash is refreshed."""
    admin_email = os.environ.get("ADMIN_EMAIL", "").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "")
    if not admin_email or not admin_password:
        logger.warning("ADMIN_EMAIL / ADMIN_PASSWORD missing — skipping admin seed")
        return
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Muhammad Umar Ahmadzai",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Seeded admin user {admin_email}")
    elif not verify_password(admin_password, existing.get("password_hash", "")):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}},
        )
        logger.info(f"Refreshed admin password for {admin_email}")
    # Ensure unique index on email
    await db.users.create_index("email", unique=True)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
