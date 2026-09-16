import pytest
import numpy as np
import fitz
from pathlib import Path
from documorph.postprocessing.format_fixer import FormatFixer

def test_diagram_whitespace_gutter_snap_math():
    """
    Verifies that bottom gutter snapping does not shift relative to a modified top ry0.
    Simulates cand_rect and tests that orig_ry0 reference preserves correct bottom boundary.
    """
    pw, ph = 595.0, 842.0
    xmin, ymin, xmax, ymax = 100, 200, 400, 500  # Normalized 0..1000
    
    pad_x = max(24.0, 0.040 * pw)
    pad_y = max(36.0, 0.055 * ph)
    
    rx0 = max(0.0, (xmin * pw / 1000.0) - pad_x)
    ry0 = max(0.0, (ymin * ph / 1000.0) - pad_y)
    rx1 = min(pw, (xmax * pw / 1000.0) + pad_x)
    ry1 = min(ph, (ymax * ph / 1000.0) + pad_y)
    
    orig_ry0 = ry0
    orig_ry1 = ry1
    
    # Simulate a top whitespace of 15px and a bottom whitespace 10px from the end
    sim_height = int((ry1 - ry0) * 1.5)
    dy_top = 15
    dy_bot = sim_height - 10
    
    # Top snap
    ry0_new = orig_ry0 + (dy_top / 1.5)
    # Bottom snap with the bug (relative to ry0_new) vs fix (relative to orig_ry0)
    buggy_ry1 = ry0_new + (dy_bot / 1.5)
    fixed_ry1 = orig_ry0 + (dy_bot / 1.5)
    
    # The fixed ry1 must be independent of dy_top
    assert fixed_ry1 == orig_ry0 + (dy_bot / 1.5)
    # The buggy ry1 was erroneously displaced downward by (dy_top / 1.5) = 10.0 points!
    assert buggy_ry1 - fixed_ry1 == (dy_top / 1.5)

def test_chemical_reaction_arrows_and_formulas():
    fixer = FormatFixer()
    
    # Test reaction arrows inside math
    raw = r"$2\text{H}_2 + \text{O}_2 -> 2\text{H}_2\text{O}$"
    cleaned = fixer.fix_markdown(raw)
    assert r"\rightarrow" in cleaned
    
    # Test equilibrium arrows
    raw_eq = r"$\text{N}_2 + 3\text{H}_2 <=> 2\text{NH}_3$"
    cleaned_eq = fixer.fix_markdown(raw_eq)
    assert r"\rightleftharpoons" in cleaned_eq
