import pytest
from fastapi.testclient import TestClient
from documorph.api.main import app
from documorph.core.auth import DEFAULT_ADMIN_USER

client = TestClient(app)

def test_admin_endpoints_require_authentication():
    # 1. Unauthenticated request to status must return 401
    resp = client.get("/api/internal/admin/status")
    assert resp.status_code == 401
    assert "Authentication required" in resp.json().get("detail", "")

    # 2. Invalid bearer token must return 401
    resp_invalid = client.get(
        "/api/internal/admin/status",
        headers={"Authorization": "Bearer invalid.fake.token"}
    )
    assert resp_invalid.status_code == 401

def test_admin_login_and_authenticated_flow():
    # 1. Failed login with wrong password
    bad_login = client.post(
        "/api/internal/admin-auth/login",
        json={"username": DEFAULT_ADMIN_USER, "password": "wrong_password_123"}
    )
    assert bad_login.status_code == 401

    # 2. Successful login with default bootstrap credentials
    good_login = client.post(
        "/api/internal/admin-auth/login",
        json={"username": DEFAULT_ADMIN_USER, "password": "documorph_admin_2026"}
    )
    assert good_login.status_code == 200
    data = good_login.json()
    assert "access_token" in data
    token = data["access_token"]
    assert data["token_type"] == "bearer"

    # 3. Access protected status with valid JWT
    status_resp = client.get(
        "/api/internal/admin/status",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["status"] == "healthy"
    assert "metrics" in status_data
    assert "ram_rss_mb" in status_data["metrics"]
    assert status_data["metrics"]["ram_rss_mb"] > 0

    # 4. Access protected jobs list
    jobs_resp = client.get(
        "/api/internal/admin/jobs",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert jobs_resp.status_code == 200
    assert isinstance(jobs_resp.json(), list)

    # 5. Trigger RAM sweep
    reclaim_resp = client.post(
        "/api/internal/admin/reclaim-ram",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert reclaim_resp.status_code == 200
    assert reclaim_resp.json()["status"] == "success"
