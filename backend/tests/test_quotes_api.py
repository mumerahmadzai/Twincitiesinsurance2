"""Backend API tests for Twin Cities Insurance quotes endpoints."""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://mn-limousine-quotes.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def valid_payload(risk_type="limousine_livery_fleet"):
    return {
        "risk_type": risk_type,
        "legal_name": "TEST_Acme Limo LLC",
        "zip_code": "55401",
        "dot_number": "1234567",
        "contact_name": "TEST_John Doe",
        "phone": "612-555-1234",
        "email": "test_quote@example.com",
    }


# --- Health / Root ---
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


# --- Quote creation ---
class TestCreateQuote:
    @pytest.mark.parametrize("rt", ["limousine_livery_fleet", "small_business_lines", "home_auto_bundle"])
    def test_create_valid(self, client, rt):
        r = client.post(f"{API}/quotes", json=valid_payload(rt))
        assert r.status_code == 201, r.text
        data = r.json()
        assert "id" in data and isinstance(data["id"], str)
        assert data["status"] == "received"
        assert "Muhammad Umar Ahmadzai" in data["message"]
        assert "received_at" in data

    def test_invalid_risk_type(self, client):
        p = valid_payload(); p["risk_type"] = "invalid_type"
        r = client.post(f"{API}/quotes", json=p)
        assert r.status_code == 422

    def test_invalid_email(self, client):
        p = valid_payload(); p["email"] = "not-an-email"
        r = client.post(f"{API}/quotes", json=p)
        assert r.status_code == 422

    def test_missing_required(self, client):
        p = valid_payload(); del p["legal_name"]
        r = client.post(f"{API}/quotes", json=p)
        assert r.status_code == 422

    def test_optional_dot_missing(self, client):
        p = valid_payload(); p.pop("dot_number", None)
        r = client.post(f"{API}/quotes", json=p)
        assert r.status_code == 201


# --- List & Get ---
class TestListAndGet:
    def test_list_quotes(self, client):
        # Ensure at least 2 quotes
        client.post(f"{API}/quotes", json=valid_payload())
        client.post(f"{API}/quotes", json=valid_payload("home_auto_bundle"))
        r = client.get(f"{API}/quotes")
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list) and len(items) >= 2
        for it in items:
            assert "_id" not in it
            assert "created_at" in it and "id" in it
        # sorted desc by created_at
        dates = [it["created_at"] for it in items]
        assert dates == sorted(dates, reverse=True)

    def test_get_by_id(self, client):
        r = client.post(f"{API}/quotes", json=valid_payload())
        qid = r.json()["id"]
        g = client.get(f"{API}/quotes/{qid}")
        assert g.status_code == 200
        assert g.json()["id"] == qid
        assert "_id" not in g.json()

    def test_get_invalid_id(self, client):
        r = client.get(f"{API}/quotes/nonexistent-id-xyz")
        assert r.status_code == 404
