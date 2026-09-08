import os
import pytest
from unittest.mock import patch, MagicMock
from documorph.worker.pipeline import DocuMorphOrchestrator

@pytest.fixture
def dummy_pdf(tmp_path):
    import fitz
    doc = fitz.open()
    # Create a 2-page PDF
    page1 = doc.new_page()
    page1.insert_text((50, 50), "Hello World", fontsize=11)
    
    page2 = doc.new_page()
    page2.insert_text((50, 50), "This is page 2", fontsize=11)
    
    pdf_path = tmp_path / "dummy.pdf"
    doc.save(str(pdf_path))
    doc.close()
    return str(pdf_path)

@patch("documorph.core.crop_sweeper.LightningSweeper.sweep")
@patch("documorph.core.batch_vision.BatchVisionEngine.process_images_batch")
def test_pipeline_e2e(mock_process_images, mock_sweep, dummy_pdf):
    # Mock sweeper to classify both as complex (forces AI processing)
    mock_sweep.return_value = {0: "complex", 1: "complex"}
    
    # Mock AI vision engine to return fake markdown
    async def fake_vision(image_paths, batch_index=1):
        return {i: f"MOCK_AI_OUTPUT_FOR_IMAGE_{i}" for i in range(len(image_paths))}
    mock_process_images.side_effect = fake_vision
    
    # Run the orchestrator
    orchestrator = DocuMorphOrchestrator(language_mode="English + Maths")
    output_pdf_path = orchestrator.process_file(dummy_pdf)
    
    assert os.path.exists(output_pdf_path)
    
    # Verify the output PDF contains the mock output
    import fitz
    doc = fitz.open(output_pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    
    assert "MOCK_AI_OUTPUT" in text
    
    # Cleanup
    os.remove(output_pdf_path)
