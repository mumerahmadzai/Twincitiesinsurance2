"""Backend API tests for Twin Cities Insurance.

Covers: health, quote creation (incl. honeypot + rate limit), admin auth, 
authenticated quote listing/get, share link generation, and public share view.
"""
import os
import uuid
import time
import pytest
import requests

BASE_URL = os.environ['REACT_APP_BACKEND_URL'].rstrip('/')
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "mumerahmadzai@gmail.com"
ADMIN_PASSWORD = "Gpy*5sVXJUY*ix0ZrZTg"


# ---------- Fixtures ----------
@pytest.fixture
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture
def admin_token(client):
    r = client.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f"Admin login failed ({r.status_code}): {r.text}")
    return r.json()["token"]


@pytest.fixture
def auth_client(client, admin_token):
    client.headers.update({"Authorization": f"Bearer {admin_token}"})
    return client


def valid_payload(risk_type="limousine_livery_fleet", **overrides):
    p = {
        "risk_type": risk_type,
        "legal_name": "TEST_Acme Limo LLC",
        "zip_code": "55401",
        "dot_number": "1234567",
        "contact_name": "TEST_John Doe",
        "phone": "612-555-1234",
        "email": "test_quote@example.com",
    }
    p.update(overrides)
    return p


def unique_ip():
    """Generate a unique IPv4 to isolate rate-limit buckets between tests."""
    return f"203.0.113.{uuid.uuid4().int % 254 + 1}"


# ---------- Health / Root ----------
class TestHealth:
    def test_root(self, client):
        r = client.get(f"{API}/")
        assert r.status_code == 200
        data = r.json()
        assert data.get("service") == "Twin Cities Insurance API"
        assert data.get("status") == "online"

    def test_health(self, client):
        r = client.get(f"{API}/health")
        assert r.status_code == 200
        assert r.json().get("ok") is True


# ---------- Auth ----------
class TestAuth:
    def test_login_success(self, client):
        r = client.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "token" in data and isinstance(data["token"], str) and len(data["token"]) > 20
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["role"] == "admin"

    def test_login_wrong_password(self, client):
        r = client.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong-password-x"})
        assert r.status_code == 401

    def test_login_unknown_email(self, client):
        r = client.post(f"{API}/auth/login", json={"email": "nobody@example.com", "password": "whatever"})
        assert r.status_code == 401

    def test_me_requires_auth(self, client):
        r = client.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_me_with_token(self, auth_client):
        r = auth_client.get(f"{API}/auth/me")
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL


# ---------- Quote creation ----------
class TestCreateQuote:
    @pytest.mark.parametrize("rt", ["limousine_livery_fleet", "small_business_lines", "home_auto_bundle"])
    def test_create_valid(self, client, rt):
        headers = {"X-Forwarded-For": unique_ip()}
        r = client.post(f"{API}/quotes", json=valid_payload(rt), headers=headers)
        assert r.status_code == 201, r.text
        data = r.json()
        assert "id" in data and isinstance(data["id"], str)
        assert data["status"] == "received"
        assert "Muhammad Umar Ahmadzai" in data["message"]

    def test_invalid_risk_type(self, client):
        p = valid_payload(); p["risk_type"] = "invalid_type"
        r = client.post(f"{API}/quotes", json=p, headers={"X-Forwarded-For": unique_ip()})
        assert r.status_code == 422

    def test_invalid_email(self, client):
        p = valid_payload(); p["email"] = "not-an-email"
        r = client.post(f"{API}/quotes", json=p, headers={"X-Forwarded-For": unique_ip()})
        assert r.status_code == 422

    def test_missing_required(self, client):
        p = valid_payload(); del p["legal_name"]
        r = client.post(f"{API}/quotes", json=p, headers={"X-Forwarded-For": unique_ip()})
        assert r.status_code == 422

    def test_optional_dot_missing(self, client):
        p = valid_payload(); p.pop("dot_number", None)
        r = client.post(f"{API}/quotes", json=p, headers={"X-Forwarded-For": unique_ip()})
        assert r.status_code == 201


# ---------- Honeypot ----------
class TestHoneypot:
    def test_honeypot_returns_201_but_not_persisted(self, auth_client):
        # Count before
        r0 = auth_client.get(f"{API}/quotes?limit=500")
        assert r0.status_code == 200
        before = len(r0.json())

        # Submit honeypot-triggered quote (bot fills `website`)
        bot_payload = valid_payload(legal_name="TEST_HONEYPOT_BOT_LLC", website="http://evil-spam.example")
        # NOTE: must call as anonymous client (no auth header) to mimic public POST
        sess = requests.Session()
        sess.headers.update({"Content-Type": "application/json", "X-Forwarded-For": unique_ip()})
        r = sess.post(f"{API}/quotes", json=bot_payload)
        assert r.status_code == 201, r.text
        body = r.json()
        assert body["status"] == "received"

        # Count after — must NOT increase, and the bot legal_name must NOT be present
        r1 = auth_client.get(f"{API}/quotes?limit=500")
        assert r1.status_code == 200
        after = r1.json()
        assert len(after) == before, (
            f"Honeypot quote was persisted: before={before}, after={len(after)}"
        )
        assert not any(q.get("legal_name") == "TEST_HONEYPOT_BOT_LLC" for q in after)


# ---------- Rate limiting ----------
class TestRateLimit:
    def test_21st_submission_returns_429(self, client):
        """20/hr allowed, 21st blocked. Use a unique X-Forwarded-For so we don't
        collide with other tests; ingress preserves first XFF entry."""
        ip = unique_ip()
        headers = {"X-Forwarded-For": ip, "Content-Type": "application/json"}
        last_status = None
        for i in range(21):
            r = client.post(f"{API}/quotes", json=valid_payload(legal_name=f"TEST_RL_{i}"), headers=headers)
            last_status = r.status_code
            if i < 20:
                # Some may already be rate-limited if XFF is not respected — surface that explicitly
                if r.status_code == 429:
                    pytest.skip(
                        f"X-Forwarded-For not honored as client IP (got 429 at i={i}); "
                        "rate limit cannot be tested in isolation from this network."
                    )
                assert r.status_code == 201, f"Submission {i} failed: {r.status_code} {r.text}"
        assert last_status == 429, f"Expected 429 on 21st request, got {last_status}"


# ---------- List & Get (now authenticated) ----------
class TestListAndGet:
    def test_list_requires_auth(self, client):
        r = client.get(f"{API}/quotes")
        assert r.status_code == 401

    def test_list_with_auth(self, auth_client, client):
        # Ensure at least one quote exists
        client.post(f"{API}/quotes", json=valid_payload(), headers={"X-Forwarded-For": unique_ip()})
        r = auth_client.get(f"{API}/quotes")
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list) and len(items) >= 1
        for it in items:
            assert "_id" not in it
            assert "id" in it and "created_at" in it
        # sorted desc
        dates = [it["created_at"] for it in items]
        assert dates == sorted(dates, reverse=True)

    def test_get_by_id(self, auth_client, client):
        r = client.post(f"{API}/quotes", json=valid_payload(), headers={"X-Forwarded-For": unique_ip()})
        qid = r.json()["id"]
        g = auth_client.get(f"{API}/quotes/{qid}")
        assert g.status_code == 200
        assert g.json()["id"] == qid
        assert "_id" not in g.json()

    def test_get_invalid_id_requires_auth_first(self, client):
        r = client.get(f"{API}/quotes/nonexistent-id-xyz")
        assert r.status_code == 401

    def test_get_invalid_id_with_auth(self, auth_client):
        r = auth_client.get(f"{API}/quotes/nonexistent-id-xyz")
        assert r.status_code == 404


# ---------- Share link ----------
class TestShareLink:
    def test_share_link_requires_auth(self, client):
        r = client.post(f"{API}/quotes/some-id/share-link")
        assert r.status_code == 401

    def test_share_link_flow(self, auth_client, client):
        # Create a quote
        r = client.post(f"{API}/quotes", json=valid_payload(), headers={"X-Forwarded-For": unique_ip()})
        assert r.status_code == 201
        qid = r.json()["id"]

        # Generate share link
        s = auth_client.post(f"{API}/quotes/{qid}/share-link")
        assert s.status_code == 200, s.text
        data = s.json()
        assert "token" in data and "expires_at" in data
        assert data["quote_id"] == qid
        token = data["token"]

        # Public access via share token (no auth)
        pub = requests.get(f"{API}/share/{token}")
        assert pub.status_code == 200, pub.text
        body = pub.json()
        # CarrierQuote projection has no `id`
        assert "id" not in body
        assert body["legal_name"] == "TEST_Acme Limo LLC"
        assert body["zip_code"] == "55401"

    def test_share_link_invalid_token(self):
        r = requests.get(f"{API}/share/not.a.real.token")
        assert r.status_code == 400

    def test_share_link_nonexistent_quote(self, auth_client):
        r = auth_client.post(f"{API}/quotes/does-not-exist-uuid/share-link")
        assert r.status_code == 404
