from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_TTL_HOURS = 12
SHARE_TOKEN_TTL_HOURS = 72

app = FastAPI(title="Twin Cities Insurance API")
api_router = APIRouter(prefix="/api")


# ---------- Models ----------
class QuoteCreate(BaseModel):
    risk_type: Literal["limousine_livery_fleet", "small_business_lines", "home_auto_bundle"]
    legal_name: str = Field(..., min_length=2, max_length=200)
    zip_code: str = Field(..., min_length=5, max_length=10)
    dot_number: Optional[str] = Field(default=None, max_length=20)
    contact_name: str = Field(..., min_length=2, max_length=120)
    phone: str = Field(..., min_length=7, max_length=30)
    email: EmailStr


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
async def create_quote(payload: QuoteCreate):
    quote = Quote(**payload.model_dump())
    doc = quote.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.quotes.insert_one(doc)
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

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


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
