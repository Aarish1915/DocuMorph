
import os
import json
import time
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

def test_diagram_detection_in_native_extractor(tmp_path):
    import fitz
    from documorph.core.native_extractor import NativeExtractor
    
    # Create a synthetic PDF with a large vector drawing / diagram (area > 4000)
    pdf_path = str(tmp_path / "diagram_test.pdf")
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    # Draw a diagram rectangle 150x100 = 15000 px^2 in the middle of page
    shape = page.new_shape()
    shape.draw_rect(fitz.Rect(100, 200, 250, 300))
    shape.finish(color=(0, 0, 1), fill=(0.8, 0.9, 1))
    shape.commit()
    doc.save(pdf_path)
    doc.close()

    test_doc = fitz.open(pdf_path)
    extractor = NativeExtractor()
    extracted = extractor.extract_page(test_doc, 0)
    test_doc.close()

    items = extracted.get("items", [])
    diagram_items = [it for it in items if it.get("type") == "diagram"]
    assert len(diagram_items) >= 1
    bbox = diagram_items[0]["data"]
    assert bbox[2] - bbox[0] >= 100
    assert bbox[3] - bbox[1] >= 80

def test_law_clat_quantitative_math_preservation():
    from documorph.postprocessing.hindi_handler import HindiHandler
    handler = HindiHandler(mode="en")
    
    # Law question with quantitative technique formula, percentages, and bilingual heading
    input_text = "Interest: $$I = \\frac{P \\times R \\times T}{100}$$ / ब्याज"
    cleaned = handler.clean_segment(input_text)
    
    assert "$$I = \\frac{P \\times R \\times T}{100}$$" in cleaned
    assert "Interest" in cleaned

def test_diagram_extractor_unit(tmp_path):
    import fitz
    from documorph.core.diagram_extractor import DiagramExtractor
    extractor = DiagramExtractor(images_dir=tmp_path / "images")
    
    # Create test PDF with an image
    doc = fitz.open()
    page = doc.new_page(width=600, height=800)
    img_pix = fitz.Pixmap(fitz.csRGB, fitz.IRect(0, 0, 150, 150), 0)
    img_pix.clear_with(200)
    page.insert_image(fitz.Rect(100, 100, 250, 250), pixmap=img_pix)
    
    freq = extractor.compute_xref_frequency(doc)
    assert len(freq) >= 1
    
    diags = extractor.extract_page_diagrams(page, 0, freq, 1, "test_job")
    assert len(diags) == 1
    assert "images/test_job_scanned_diag" in diags[0]["rel_path"]
    doc.close()

def test_database_entities_versioning_and_spam():
    from documorph.core.database import SessionLocal, PageResultVersion, SpamCorpusEntity
    db = SessionLocal()
    
    spam_pattern = f"JOIN TELEGRAM @TEST_EXAM_{time.time()}"
    spam = SpamCorpusEntity(
        pattern_type="watermark_text",
        pattern_value=spam_pattern,
        occurrence_count=5,
        confidence_score=0.98
    )
    db.add(spam)
    
    pv1 = PageResultVersion(
        job_id="job_ver_test",
        page_number=1,
        version_number=1,
        prompt_used="standard_prompt",
        raw_markdown="# Original Question\nValue is 10.",
        diff_summary=""
    )
    pv2 = PageResultVersion(
        job_id="job_ver_test",
        page_number=1,
        version_number=2,
        prompt_used="reprocess_prompt",
        raw_markdown="# Refined Question\nValue is 10.5.",
        diff_summary="--- page_1_v_prev\n+++ page_1_v_new\n-Value is 10.\n+Value is 10.5."
    )
    db.add(pv1)
    db.add(pv2)
    db.commit()
    
    queried_spam = db.query(SpamCorpusEntity).filter_by(pattern_value=spam_pattern).first()
    assert queried_spam is not None
    assert queried_spam.occurrence_count == 5
    
    versions = db.query(PageResultVersion).filter_by(job_id="job_ver_test", page_number=1).order_by(PageResultVersion.version_number).all()
    assert len(versions) == 2
    assert versions[0].version_number == 1
    assert versions[1].version_number == 2
    assert "-Value is 10." in versions[1].diff_summary
    
    # Cleanup
    db.delete(spam)
    db.delete(pv1)
    db.delete(pv2)
    db.commit()
    db.close()

