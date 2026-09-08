import os
from locust import HttpUser, task, between
from io import BytesIO
import fitz

class DocuMorphUser(HttpUser):
    wait_time = between(1, 5)

    def on_start(self):
        # Generate a tiny valid dummy PDF in memory to upload
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text((50, 50), "Stress Test PDF")
        
        self.dummy_pdf_bytes = doc.write()
        doc.close()

    @task(3)
    def test_get_jobs(self):
        self.client.get("/api/jobs")

    @task(1)
    def test_upload_pdf(self):
        files = {
            "file": ("dummy.pdf", self.dummy_pdf_bytes, "application/pdf")
        }
        data = {
            "language_mode": "English + Maths"
        }
        with self.client.post("/api/process", files=files, data=data, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            elif response.status_code == 429:
                response.success() # Rate limit is expected behavior under stress
            else:
                response.failure(f"Failed with {response.status_code}: {response.text}")
