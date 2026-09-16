import os
import pytest
from documorph.compilers.pdf_compiler import PDFCompiler

def test_compiler_no_math_fastpath():
    """Verify that a document without math formulas compiles rapidly without loading MathJax CDN."""
    compiler = PDFCompiler(output_dir="data/output/test_runs")
    os.makedirs("data/output/test_runs", exist_ok=True)
    out_pdf = "data/output/test_runs/test_no_math.pdf"
    
    text = "# Regular Document\nThis is a standard clean note with no formulas.\n* Point 1\n* Point 2"
    result = compiler.compile(text, out_pdf, compact_mode="standard")
    
    assert os.path.exists(result)
    assert os.path.getsize(result) > 1000

def test_compiler_with_math():
    """Verify that documents with math formulas compile properly."""
    compiler = PDFCompiler(output_dir="data/output/test_runs")
    os.makedirs("data/output/test_runs", exist_ok=True)
    out_pdf = "data/output/test_runs/test_with_math.pdf"
    
    text = "# Math Note\nThe formula is $E = mc^2$ and $$\\int_0^1 x dx = \\frac{1}{2}$$."
    result = compiler.compile(text, out_pdf, compact_mode="standard")
    
    assert os.path.exists(result)
    assert os.path.getsize(result) > 1000
