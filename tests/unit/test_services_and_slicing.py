import os
import json
import fitz
import pytest
from documorph.core.database import init_db, Base, engine, SessionLocal, Job
from documorph.worker.pipeline import DocuMorphOrchestrator

@pytest.fixture(scope="module")
def setup_db():
    init_db()
    yield
    # Cleanup not strictly necessary since it's SQLite test db

@pytest.fixture
def sample_pdf(tmp_path):
    # Generate a 3-page test PDF
    pdf_path = str(tmp_path / "test_doc.pdf")
    doc = fitz.open()
    for i in range(3):
        page = doc.new_page(width=595, height=842)
        page.insert_text((50, 50), f"Page {i+1} Content: Equation x^2 + y^2 = r^2. Clean Text.", fontsize=14)
    doc.save(pdf_path)
    doc.close()
    return pdf_path

def test_job_model_fields(setup_db):
    db = SessionLocal()
    job = Job(
        id="job_test_services",
        file_path="dummy.pdf",
        status="QUEUED",
        service_type="compress",
        config_options=json.dumps({"quality": "balanced", "page_range": "custom", "page_from": 1, "page_to": 2}),
        output_format="pdf",
        original_file_size=10240,
        compressed_file_size=5120
    )
    db.add(job)
    db.commit()

    retrieved = db.query(Job).filter(Job.id == "job_test_services").first()
    assert retrieved is not None
    assert retrieved.service_type == "compress"
    assert retrieved.original_file_size == 10240
    assert retrieved.compressed_file_size == 5120
    db.delete(retrieved)
    db.commit()
    db.close()

def test_compress_service(sample_pdf):
    # Test 1: Space Compaction (Balanced A4) compacts 3 sparse pages into fewer readable pages
    cfg = {"quality": "balanced", "images": "compress", "strip_metadata": True}
    orchestrator = DocuMorphOrchestrator(
        service_type="compress",
        config_options=cfg
    )
    out_path = orchestrator.process_file(sample_pdf)
    assert os.path.exists(out_path)
    assert out_path.endswith(".pdf")
    doc = fitz.open(out_path)
    assert 1 <= len(doc) <= 3
    # Check that content was preserved during compaction
    all_text = "".join(p.get_text() for p in doc)
    assert "Equation" in all_text
    doc.close()

    # Test 2: Bytes-only mode preserves exact page count
    cfg_bytes = {"quality": "bytes_only", "images": "compress", "strip_metadata": True}
    orch_bytes = DocuMorphOrchestrator(service_type="compress", config_options=cfg_bytes)
    bytes_out = orch_bytes.process_file(sample_pdf)
    assert os.path.exists(bytes_out)
    doc_bytes = fitz.open(bytes_out)
    assert len(doc_bytes) == 3
    doc_bytes.close()

def test_page_range_slicing_on_compress(sample_pdf):
    # Test slicing from page 2 to page 3 (should result in pages 2 and 3 compacted)
    cfg = {"quality": "balanced", "page_range": "custom", "page_from": 2, "page_to": 3}
    orchestrator = DocuMorphOrchestrator(
        service_type="compress",
        config_options=cfg
    )
    out_path = orchestrator.process_file(sample_pdf)
    assert os.path.exists(out_path)
    doc = fitz.open(out_path)
    assert 1 <= len(doc) <= 2
    all_text = "".join(p.get_text() for p in doc)
    assert "Page 2" in all_text
    assert "Page 3" in all_text
    assert "Page 1 Content" not in all_text
    doc.close()

def test_extract_text_json_format(sample_pdf):
    cfg = {"output_format": "json", "page_range": "all"}
    orchestrator = DocuMorphOrchestrator(
        service_type="extract_text",
        config_options=cfg
    )
    out_path = orchestrator.process_file(sample_pdf)
    assert os.path.exists(out_path)
    assert out_path.endswith(".json")
    with open(out_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert "pages" in data
    assert len(data["pages"]) == 3

def test_translate_prompt_with_formula_shield():
    from documorph.core.batch_vision import BatchVisionEngine
    engine = BatchVisionEngine(language_mode="Marathi")
    prompt = engine._get_prompt()
    assert "MARATHI" in prompt
    assert "FORMULA & CODE SHIELD" in prompt
    assert "LaTeX" in prompt

def test_translate_tamil_formula_shield():
    from documorph.core.batch_vision import BatchVisionEngine
    engine = BatchVisionEngine(language_mode="Tamil")
    prompt = engine._get_prompt()
    assert "TAMIL" in prompt
    assert "FORMULA & CODE SHIELD" in prompt
