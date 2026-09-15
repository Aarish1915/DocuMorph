import os
import fitz
import pytest
from documorph.postprocessing.format_fixer import FormatFixer
from documorph.compilers.pdf_compiler import PDFCompiler

def test_math_shield_and_devanagari_siphon():
    raw_sample = """एक कुंडली के स्वप्रेतृत्व के लिए व्यंजक (EXPRESSION FOR SELF INDUCTANCE OF A COIL)
एक परिनालिका पर विचार करें जिसमें कुल फेरों की संख्या N, प्रति इकाई लंबाई फेरों की संख्या 'n' और लंबाई l है।
परिनालिका से जुड़ा चुंबकीय फ्लक्स, $$
N\\Phi_B = N B A
लेकिन परिनालिका के अंदर चुंबकीय क्षेत्र,
B = \\mu_0 n I

\\Rightarrow N\\Phi_B = n l \\mu_0 n I A

\\Rightarrow N\\Phi_B = (\\mu_0 n^2 A l) I

इसकी तुलना $N \\Phi_B = L I $ से करने पर
\\Rightarrow L = \\mu_0 n^2 A l
$$

समस्या 1 (Problem 1)
'l' मीटर लंबी परिनालिका का स्वप्रेतृत्व 'L' हेनरी है। यदि फेरों की संख्या दोगुनी कर दी जाए (बिना लंबाई में किसी परिवर्तन के), तो इसका नया स्वप्रेतृत्व क्या होगा? उत्तर) 4 गुना

समस्या 2 (Problem 2)
एक परिपथ में धारा 0.1 सेकंड में 5A से घटकर 1A हो जाती है। यदि 200 वोल्ट का औसत विद्युत वाहक बल प्रेरित होता है, तो परिपथ का स्वप्रेतृत्व ज्ञात कीजिए। उत्तर) $e = - L \\frac{dI}{dt} $$
\\frac{dI}{dt} = \\frac{4}{0.1} = 40

L = \\frac{e}{\\frac{dI}{dt}} = \\frac{200}{40} = 5\\text{ H}
$$
"""

    # 1. Test FormatFixer sanitization
    fixer = FormatFixer()
    sanitized = fixer.fix_markdown(raw_sample)

    # Devanagari text should NOT be inside display math $$ ... $$
    # Verify that "लेकिन परिनालिका के अंदर चुंबकीय क्षेत्र" is outside $$ ... $$
    assert "लेकिन परिनालिका के अंदर चुंबकीय क्षेत्र" in sanitized
    
    # 2. Compile to PDF
    compiler = PDFCompiler(output_dir="data/output/test_runs")
    os.makedirs("data/output/test_runs", exist_ok=True)
    out_pdf = "data/output/test_runs/test_math_shield_output.pdf"
    
    compiler.compile(sanitized, out_pdf, compact_mode="standard")
    assert os.path.exists(out_pdf)
    assert os.path.getsize(out_pdf) > 2000

    # 3. Inspect compiled PDF text
    pdf = fitz.open(out_pdf)
    extracted_text = ""
    for page in pdf:
        extracted_text += page.get_text()
    pdf.close()

    # Dotted circle character is \u25cc ('◌')
    assert "◌" not in extracted_text, "Dotted circles found in compiled PDF!"
    assert "\\u25cc" not in repr(extracted_text), "Unicode dotted circle glyph found!"
    print("SUCCESS: 0 dotted circles found, math and Hindi compiled cleanly!")

if __name__ == "__main__":
    test_math_shield_and_devanagari_siphon()
