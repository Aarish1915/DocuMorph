import pytest
from documorph.postprocessing.hindi_handler import HindiHandler

def test_hindi_handler_only_hindi_preserves_hindi():
    handler = HindiHandler(mode="Only Hindi")
    text = "नमस्ते दुनिया! This is English. 12345"
    processed = handler.process_text(text)
    
    assert "नमस्ते दुनिया" in processed
    # English should ideally be translated or ignored.
    # The handler uses Regex. Let's see if the regex leaves the Hindi alone.
    assert "नमस्ते" in processed

def test_hindi_handler_only_english_removes_hindi():
    handler = HindiHandler(mode="Only English")
    text = "Hello World! नमस्ते दुनिया!"
    processed = handler.process_text(text)
    
    assert "Hello World!" in processed
    assert "नमस्ते" not in processed

def test_hindi_handler_auto_preserves_both():
    handler = HindiHandler(mode="Auto-Detect")
    text = "Hello World! नमस्ते दुनिया!"
    processed = handler.process_text(text)
    
    assert "Hello World!" in processed
    assert "नमस्ते दुनिया!" in processed
