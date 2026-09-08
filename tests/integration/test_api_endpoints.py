import os
import json
import fitz
import pytest
from fastapi.testclient import TestClient
from documorph.api.main import app
from documorph.core.database import init_db, SessionLocal, Job

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    init_db()

@pytest.fixture
def test_pdf_bytes():
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 50), "Test API PDF", fontsize=12)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes

def test_api_process_and_job_creation(test_pdf_bytes):
    cfg = {"quality": "high", "page_range": "custom", "page_from": 1, "page_to": 1}
    files = {"file": ("test_upload.pdf", test_pdf_bytes, "application/pdf")}
    data = {
        "service_type": "compress",
        "config_options": json.dumps(cfg),
    }
    response = client.post("/api/process", files=files, data=data)
    assert response.status_code == 200
    res_json = response.json()
    assert "job_id" in res_json
    job_id = res_json["job_id"]

    # Verify DB entry
    db = SessionLocal()
    job = db.query(Job).filter(Job.id == job_id).first()
    assert job is not None
    assert job.service_type == "compress"
    assert "quality" in job.config_options
    assert job.output_format == "pdf"
    assert job.original_file_size is not None
    assert job.original_file_size > 0
    db.close()

def test_api_get_jobs():
    response = client.get("/api/jobs")
    assert response.status_code == 200
    jobs = response.json()
    assert isinstance(jobs, list)
    if len(jobs) > 0:
        j = jobs[0]
        assert "id" in j
        assert "service_type" in j
        assert "output_format" in j

def test_api_download_endpoint(tmp_path):
    # Create a dummy completed job with an actual file on disk
    dummy_out = tmp_path / "OUTPUT_test.txt"
    dummy_out.write_text("Extracted text content", encoding="utf-8")
    
    db = SessionLocal()
    job = Job(
        id="job_download_test",
        file_path="dummy.pdf",
        status="COMPLETED",
        service_type="extract_text",
        output_format="txt",
        result_url=f"/{str(dummy_out).replace('\\', '/')}"
    )
    db.add(job)
    db.commit()
    db.close()

    response = client.get("/api/download/job_download_test")
    assert response.status_code == 200
    assert "Extracted text content" in response.text
    assert "text/plain" in response.headers.get("content-type", "")

    # Clean up DB
    db = SessionLocal()
    j = db.query(Job).filter(Job.id == "job_download_test").first()
    if j:
        db.delete(j)
        db.commit()
    db.close()
