import pytest
from unittest.mock import MagicMock
from documorph.core.native_extractor import NativeExtractor

def test_native_extractor_text_only():
    extractor = NativeExtractor()
    
    mock_page = MagicMock()
    blocks = [
        (0, 0, 100, 100, "Header text\n", 0, 0),
        (0, 100, 100, 200, "Paragraph text\n", 1, 0)
    ]
    dict_data = {
        "blocks": [
            {
                "type": 0,
                "lines": [
                    {
                        "spans": [
                            {"text": "Header text", "bbox": (0, 0, 100, 100), "size": 16.0, "flags": 16, "font": "Arial-Bold"}
                        ]
                    }
                ]
            },
            {
                "type": 0,
                "lines": [
                    {
                        "spans": [
                            {"text": "Paragraph text", "bbox": (0, 100, 100, 200), "size": 11.0, "flags": 0, "font": "Arial"}
                        ]
                    }
                ]
            }
        ]
    }
    def mock_get_text(opt="text"):
        if opt == "blocks":
            return blocks
        if opt == "dict":
            return dict_data
        return "Header text\nParagraph text\n"
        
    mock_page.get_text.side_effect = mock_get_text
    mock_page.get_drawings.return_value = []
    mock_page.find_tables.return_value = []
    mock_page.rect = MagicMock(width=100, height=200)
    
    doc = MagicMock()
    doc.__getitem__.return_value = mock_page
    
    result = extractor.extract_page(doc, 0)
    
    assert "items" in result
    assert len(result["items"]) == 2
    assert result["items"][0]["type"] == "text"
    assert "Header text" in result["items"][0]["data"]
    assert "Paragraph text" in result["items"][1]["data"]

def test_native_extractor_with_image():
    extractor = NativeExtractor()
    
    mock_page = MagicMock()
    blocks = [
        (0, 0, 100, 80, "Header text\n", 0, 0),
        (0, 100, 100, 200, b"image_bytes", 1, 1) # Block type 1 is image
    ]
    dict_data = {
        "blocks": [
            {
                "type": 0,
                "lines": [
                    {
                        "spans": [
                            {"text": "Header text", "bbox": (0, 0, 100, 80), "size": 16.0, "flags": 16, "font": "Arial-Bold"}
                        ]
                    }
                ]
            }
        ]
    }
    def mock_get_text(opt="text"):
        if opt == "blocks":
            return blocks
        if opt == "dict":
            return dict_data
        return "Header text\n"
        
    mock_page.get_text.side_effect = mock_get_text
    mock_page.get_drawings.return_value = []
    mock_page.find_tables.return_value = []
    mock_page.rect = MagicMock(width=100, height=500)
    
    doc = MagicMock()
    doc.__getitem__.return_value = mock_page
    
    result = extractor.extract_page(doc, 0)
    
    assert len(result["items"]) == 2
    assert result["items"][1]["type"] == "crop"
    assert result["items"][1]["data"] == [0, 100, 100, 200]

