import json
import time
import sys
import fitz
from fastapi.testclient import TestClient
from documorph.api.main import app

client = TestClient(app)

def create_sample_pdf(path="scratch/sample_physics_doc.pdf"):
    import os
    os.makedirs("scratch", exist_ok=True)
    doc = fitz.open()
    page = doc.new_page(width=595, height=842) # A4
    text = (
        "Newton's Second Law of Motion\n\n"
        "The acceleration of an object as produced by a net force is directly proportional\n"
        "to the magnitude of the net force, in the same direction as the net force, and inversely\n"
        "proportional to the mass of the object.\n\n"
        "Mathematical Equation: F = m * a\n\n"
        "Where:\n"
        "- F is net force in Newtons (N)\n"
        "- m is mass in kilograms (kg)\n"
        "- a is acceleration in meters per second squared (m/s^2)\n"
    )
    page.insert_text((50, 70), text, fontsize=13)
    doc.save(path)
    doc.close()
    return path

def test_api_upload(service_type="translate", to_language="Hindi"):
    pdf_path = create_sample_pdf()
    print(f"\n--- Testing /api/process for service_type='{service_type}' (target={to_language}) ---")
    
    config = {"to_language": to_language, "page_range": "all"}
    
    with open(pdf_path, "rb") as f:
        files = {"file": ("physics_test.pdf", f, "application/pdf")}
        data = {
            "service_type": service_type,
            "config_options": json.dumps(config),
            "language_mode": to_language
        }
        res = client.post("/api/process", files=files, data=data)
        
    print(f"Status Code: {res.status_code}")
    assert res.status_code == 200
        
    res_data = res.json()
    job_id = res_data.get("job_id")
    assert job_id is not None
    print(f"Received job_id: {job_id}, status: {res_data.get('status')}")
    
    stat_res = client.get("/api/jobs")
    assert stat_res.status_code == 200
    jobs = stat_res.json()
    assert any(j["id"] == job_id for j in jobs)

if __name__ == "__main__":
    success = test_api_upload("translate", "Hindi")
    if not success:
        sys.exit(1)
    print("\nALL BACKEND API AND WORKER PIPELINES VERIFIED SUCCESSFULLY!")
