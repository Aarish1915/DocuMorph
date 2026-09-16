import pytest
from fastapi.testclient import TestClient
from documorph.api.main import app
from documorph.core.database import SessionLocal, Job, init_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_database():
    init_db()
    db = SessionLocal()
    # Clean up test jobs
    db.query(Job).filter(Job.id.like("test_poll_%")).delete()
    db.commit()
    db.close()
    yield
    db = SessionLocal()
    db.query(Job).filter(Job.id.like("test_poll_%")).delete()
    db.commit()
    db.close()

def test_poll_nonexistent_job():
    res = client.get("/api/progress_poll/non_existent_id")
    assert res.status_code == 404
    assert res.json()["detail"] == "Job not found"

def test_poll_queued_job():
    db = SessionLocal()
    job = Job(
        id="test_poll_queued_1",
        file_path="data/uploads/fake.pdf",
        status="QUEUED",
        progress_pct=0,
        progress_msg="Waiting in queue..."
    )
    db.add(job)
    db.commit()
    db.close()

    res = client.get("/api/progress_poll/test_poll_queued_1")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == "test_poll_queued_1"
    assert data["status"] == "QUEUED"
    assert "Waiting in queue" in data["message"]
    assert res.headers.get("cache-control") == "no-store, no-cache, must-revalidate"

def test_poll_processing_and_completed_job():
    db = SessionLocal()
    job = Job(
        id="test_poll_proc_1",
        file_path="data/uploads/fake.pdf",
        status="PROCESSING",
        progress_pct=25,
        progress_msg="Scanning & Profiling Layout: Page 5/20...",
        result_url=None
    )
    db.add(job)
    db.commit()
    db.close()

    res = client.get("/api/progress_poll/test_poll_proc_1")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "PROCESSING"
    assert data["progress"] == 25
    assert "Scanning & Profiling Layout" in data["message"]

    # Now mark completed
    db = SessionLocal()
    j = db.query(Job).filter(Job.id == "test_poll_proc_1").first()
    j.status = "COMPLETED"
    j.progress_pct = 100
    j.progress_msg = "Completed successfully"
    j.result_url = "/data/output/test.pdf"
    db.commit()
    db.close()

    res2 = client.get("/api/progress_poll/test_poll_proc_1")
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["status"] == "COMPLETED"
    assert data2["progress"] == 100
    assert data2["result_url"] == "/data/output/test.pdf"
    assert data2["download_url"] == "/api/download/test_poll_proc_1"
