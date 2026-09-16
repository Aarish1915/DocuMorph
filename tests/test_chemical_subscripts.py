import pytest
from documorph.postprocessing.format_fixer import FormatFixer

def test_chemical_subscripts_and_parentheses():
    fixer = FormatFixer()
    
    # Test case 1: Raw Gemini output from user's bug report
    raw = r"(\text{C}6\text{H}{12}\text{O}6$ सूत्र"
    cleaned = fixer.fix_markdown(raw)
    
    # Assert formula has proper subscripts with braces
    assert r"\text{C}_{6}" in cleaned
    assert r"\text{H}_{12}" in cleaned
    assert r"\text{O}_{6}" in cleaned
    # Assert balanced math parentheses
    assert r"($\text{C}_{6}\text{H}_{12}\text{O}_{6}$)" in cleaned
    assert "सूत्र" in cleaned

def test_element_with_bare_digits():
    fixer = FormatFixer()
    raw = r"$\text{H}2\text{O} + \text{C}\text{O}2$"
    cleaned = fixer.fix_markdown(raw)
    assert r"\text{H}_{2}\text{O}" in cleaned
    assert r"\text{O}_{2}" in cleaned
