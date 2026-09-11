import os
import json
import time
import fitz
import pytest
from concurrent.futures import ThreadPoolExecutor, as_completed
from fastapi.testclient import TestClient
from documorph.api.main import app
from documorph.core.database import init_db, SessionLocal, Job

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    init_db()

@pytest.fixture
def dummy_pdf_bytes():
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 50), "Concurrency Queue Test Document", fontsize=12)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes

def test_concurrent_uploads_zero_rejection(dummy_pdf_bytes):
    """
    Simulates 10 concurrent students uploading documents simultaneously.
    Asserts:
    1. Zero 429 Too Many Requests errors.
    2. Zero 409 Conflict errors.
    3. 100% HTTP 200 responses.
    4. Each response returns a valid 'queue_position' >= 1 and status == 'QUEUED'.
    5. Database safely persists all 10 jobs without 'database is locked' errors under WAL mode.
    """
    num_concurrent_users = 10
    
    # 6 Language & Formulas modes distributed across concurrent users
    test_scenarios = [
        {"service": "clean_format", "lang": "auto", "desc": "Dual + Math"},
        {"service": "clean_format", "lang": "en+math", "desc": "En + Math"},
        {"service": "clean_format", "lang": "math+hindi", "desc": "Hi + Math"},
        {"service": "clean_format", "lang": "only_english", "desc": "English Only"},
        {"service": "clean_format", "lang": "only_hindi", "desc": "Hindi Only"},
        {"service": "clean_format", "lang": "only_math", "desc": "Math Only"},
        {"service": "compress", "lang": "auto", "desc": "Resizer / Compactor"},
        {"service": "extract_text", "lang": "only_english", "desc": "Table Data Extraction"},
        {"service": "translate", "lang": "hi", "desc": "Multi-Language Translation"},
        {"service": "clean_format", "lang": "auto", "desc": "Dual + Math 2"},
    ]

    def upload_job(idx):
        scenario = test_scenarios[idx % len(test_scenarios)]
        files = {"file": (f"student_{idx}_upload.pdf", dummy_pdf_bytes, "application/pdf")}
        data = {
            "service_type": scenario["service"],
            "language_mode": scenario["lang"],
            "config_options": json.dumps({"scenario": scenario["desc"]}),
        }
        res = client.post("/api/process", files=files, data=data)
        return {
            "index": idx,
            "status_code": res.status_code,
            "json": res.json() if res.status_code == 200 else res.text,
            "scenario": scenario
        }

    results = []
    with ThreadPoolExecutor(max_workers=num_concurrent_users) as executor:
        futures = [executor.submit(upload_job, i) for i in range(num_concurrent_users)]
        for f in as_completed(futures):
            results.append(f.result())

    # 1. Assert zero 429/409 errors & 100% 200 success
    for r in results:
        assert r["status_code"] == 200, f"User {r['index']} was rejected with status {r['status_code']}: {r['json']}"
        res_data = r["json"]
        assert "job_id" in res_data
        assert res_data.get("status") == "QUEUED"
        assert "queue_position" in res_data
        assert isinstance(res_data["queue_position"], int)
        assert res_data["queue_position"] >= 1

    # 2. Assert all job IDs are distinct
    job_ids = [r["json"]["job_id"] for r in results]
    assert len(set(job_ids)) == num_concurrent_users

    # 3. Verify SQLite DB consistency and WAL mode concurrency
    db = SessionLocal()
    try:
        queued_jobs = db.query(Job).filter(Job.id.in_(job_ids)).all()
        assert len(queued_jobs) == num_concurrent_users
        for j in queued_jobs:
            assert j.status == "QUEUED"
            assert j.original_file_size == len(dummy_pdf_bytes)
    finally:
        db.close()

def test_six_language_formula_modes_contract(dummy_pdf_bytes):
    """
    Directly asserts that all 6 language & formula modes are accepted by the gateway,
    persisted cleanly to the SQLite database, and mapped to the expected Job parameters.
    """
    modes = [
        ("auto", "clean_format", "Dual + Math"),
        ("en+math", "clean_format", "En + Math"),
        ("math+hindi", "clean_format", "Hi + Math"),
        ("only_english", "clean_format", "English Only"),
        ("only_hindi", "clean_format", "Hindi Only"),
        ("only_math", "clean_format", "Math Only"),
    ]
    
    for lang_mode, service, label in modes:
        files = {"file": (f"test_{lang_mode}.pdf", dummy_pdf_bytes, "application/pdf")}
        data = {
            "service_type": service,
            "language_mode": lang_mode,
            "config_options": json.dumps({"mode_label": label}),
        }
        res = client.post("/api/process", files=files, data=data)
        assert res.status_code == 200
        payload = res.json()
        assert payload.get("status") == "QUEUED"
        assert payload.get("queue_position") >= 1
        
        db = SessionLocal()
        try:
            job = db.query(Job).filter(Job.id == payload["job_id"]).first()
            assert job is not None
            assert job.language_mode == lang_mode
            assert job.service_type == service
        finally:
            db.close()
