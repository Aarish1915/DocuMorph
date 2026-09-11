import requests
import json
import time
import sys
import fitz

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
    
    url = "http://localhost:8000/api/process"
    config = {"to_language": to_language, "page_range": "all"}
    
    with open(pdf_path, "rb") as f:
        files = {"file": ("physics_test.pdf", f, "application/pdf")}
        data = {
            "service_type": service_type,
            "config_options": json.dumps(config),
            "language_mode": to_language
        }
        res = requests.post(url, files=files, data=data, timeout=10)
        
    print(f"Status Code: {res.status_code}")
    if res.status_code != 200:
        print("Failed:", res.text)
        return False
        
    res_data = res.json()
    job_id = res_data.get("job_id")
    print(f"Received job_id: {job_id}, status: {res_data.get('status')}")
    
    # Poll progress
    start_t = time.time()
    while time.time() - start_t < 90:
        stat_res = requests.get(f"http://localhost:8000/api/jobs", timeout=5)
        if stat_res.ok:
            jobs = stat_res.json()
            curr = next((j for j in jobs if j["id"] == job_id), None)
            if curr:
                status = curr.get("status")
                progress = curr.get("progress")
                msg = curr.get("message")
                print(f"  [{progress}%] Status: {status} - {msg}")
                if status in ("COMPLETED", "Completed"):
                    print(f"SUCCESS: Job {job_id} completed!")
                    print(f"Download URL: {curr.get('download_url')}")
                    return True
                elif status in ("FAILED", "ERROR", "CANCELLED"):
                    print(f"FAILED: Job {job_id} encountered {status}: {msg}")
                    return False
        time.sleep(2)
        
    print("Timeout waiting for job completion.")
    return False

if __name__ == "__main__":
    success = test_api_upload("translate", "Hindi")
    if not success:
        sys.exit(1)
    print("\nALL BACKEND API AND WORKER PIPELINES VERIFIED SUCCESSFULLY!")
