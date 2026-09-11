import os
from playwright.sync_api import sync_playwright
import markdown
import fitz

class PDFCompiler:
    """
    Phase 7: Compiles the final cleaned Markdown into a pristine, A4-sized PDF.
    Supports Standard, Compact (Balanced A4), and Ultra-Dense (Print Saver) layouts.
    """
    def __init__(self, output_dir: str = "data/output"):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)

    def _generate_css(self, compact_mode: str = "standard", is_landscape: bool = False) -> str:
        if is_landscape:
            page_margin = "14mm 20mm 14mm 20mm"
            body_font_size = "15.5pt"
            body_line_height = "1.65"
            p_margin_bottom = "0.75em"
            h1_font_size = "26pt"
            h1_margin = "0 0 0.5em 0"
            h2_font_size = "20pt"
            h2_margin = "0.6em 0 0.35em 0"
            h3_font_size = "16pt"
            h3_margin = "0.5em 0 0.3em 0"
            table_font_size = "13pt"
            table_padding = "8px 12px"
            table_margin = "1em 0"
            list_margin = "0.4em 0 0.8em 0"
            li_margin = "0.45em"
            hr_margin = "1.2em 0"
            blockquote_margin = "1em 0"
            blockquote_padding = "0.8em 1.2em"
        elif compact_mode == "ultra_dense":
            page_margin = "8mm 10mm 10mm 10mm"
            body_font_size = "9pt"
            body_line_height = "1.35"
            p_margin_bottom = "0.25em"
            h1_font_size = "13pt"
            h1_margin = "0.45em 0 0.18em 0"
            h2_font_size = "11pt"
            h2_margin = "0.35em 0 0.15em 0"
            h3_font_size = "10pt"
            h3_margin = "0.3em 0 0.12em 0"
            table_font_size = "8pt"
            table_padding = "3px 5px"
            table_margin = "0.4em 0"
            list_margin = "0.1em 0 0.25em 0"
            li_margin = "0.15em"
            hr_margin = "0.4em 0"
            blockquote_margin = "0.35em 0"
            blockquote_padding = "0.3em 0.6em"
        elif compact_mode in ("compact", "balanced"):
            page_margin = "10mm 12mm 12mm 12mm"
            body_font_size = "11pt"
            body_line_height = "1.52"
            p_margin_bottom = "0.45em"
            h1_font_size = "16pt"
            h1_margin = "0.65em 0 0.25em 0"
            h2_font_size = "13.5pt"
            h2_margin = "0.5em 0 0.2em 0"
            h3_font_size = "11.5pt"
            h3_margin = "0.4em 0 0.15em 0"
            table_font_size = "9.5pt"
            table_padding = "5px 8px"
            table_margin = "0.6em 0"
            list_margin = "0.15em 0 0.4em 0"
            li_margin = "0.22em"
            hr_margin = "0.6em 0"
            blockquote_margin = "0.5em 0"
            blockquote_padding = "0.4em 0.8em"
        else: # standard
            page_margin = "12mm 14mm 14mm 14mm"
            body_font_size = "12pt"
            body_line_height = "1.62"
            p_margin_bottom = "0.65em"
            h1_font_size = "19pt"
            h1_margin = "0.9em 0 0.4em 0"
            h2_font_size = "15pt"
            h2_margin = "0.8em 0 0.3em 0"
            h3_font_size = "12.5pt"
            h3_margin = "0.6em 0 0.25em 0"
            table_font_size = "10pt"
            table_padding = "6px 10px"
            table_margin = "0.8em 0"
            list_margin = "0.2em 0 0.6em 0"
            li_margin = "0.3em"
            hr_margin = "1em 0"
            blockquote_margin = "0.8em 0"
            blockquote_padding = "0.6em 1em"

        page_size = "297mm 210mm" if is_landscape else "A4 portrait"

        return f"""
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap');
            
            :root {{
                --primary: #1e40af;
                --primary-light: #eff6ff;
                --text-main: #0f172a;
                --text-muted: #475569;
                --bg-main: #ffffff;
                --bg-alt: #f8fafc;
                --border: #cbd5e1;
                --border-light: #e2e8f0;
            }}
            
            body {{
                font-family: 'Inter', 'Noto Sans Devanagari', 'Nirmala UI', system-ui, -apple-system, sans-serif;
                font-size: {body_font_size};
                line-height: {body_line_height};
                color: #0f172a;
                background-color: #ffffff;
                margin: 0;
                padding: 0;
            }}
            
            h1, h2, h3, h4 {{
                font-family: 'Inter', 'Noto Sans Devanagari', 'Nirmala UI', system-ui, sans-serif;
                letter-spacing: -0.01em;
                break-after: avoid;
                text-align: left;
                text-align-last: left;
            }}
            
            h1 {{
                font-size: {h1_font_size};
                font-weight: 700;
                color: #1e3a8a;
                border-bottom: 2px solid #2563eb;
                padding-bottom: 4px;
                margin: {h1_margin};
            }}
            
            h2 {{
                font-size: {h2_font_size};
                font-weight: 700;
                color: #1e40af;
                border-left: 3.5px solid #2563eb;
                padding-left: 7px;
                margin: {h2_margin};
            }}
            
            h3 {{
                font-size: {h3_font_size};
                font-weight: 600;
                color: #334155;
                margin: {h3_margin};
            }}
            
            p {{
                margin-top: 0;
                margin-bottom: {p_margin_bottom};
                text-align: justify;
                text-align-last: left;
                hyphens: auto;
                -webkit-hyphens: auto;
                word-spacing: -0.01em;
            }}
            
            ul, ol {{
                margin: {list_margin};
                padding-left: 1.3em;
            }}
            
            li {{
                margin-bottom: {li_margin};
                text-align: left;
                text-align-last: left;
            }}
            
            blockquote {{
                border-left: 4px solid #2563eb;
                background-color: #f0f7ff;
                margin: {blockquote_margin};
                padding: {blockquote_padding};
                border-radius: 0 6px 6px 0;
                color: #1e3a8a;
                font-weight: 500;
                break-inside: avoid;
            }}
            
            blockquote strong {{
                color: #1e3a8a;
            }}
            
            img {{ 
                max-width: 100%; 
                height: auto; 
                display: block;
                margin: 0.8em auto;
                border-radius: 4px;
                break-inside: avoid;
            }}
            
            table {{
                width: 100%;
                border-collapse: collapse;
                margin: {table_margin};
                border: 1px solid #cbd5e1;
                table-layout: auto;
                word-wrap: break-word;
                font-size: {table_font_size};
                break-inside: avoid;
            }}
            
            th, td {{
                padding: {table_padding};
                text-align: left;
                text-align-last: left;
                border: 1px solid #cbd5e1;
                vertical-align: top;
            }}
            
            .math-raw-fallback {{
                font-family: 'Consolas', monospace;
                font-size: 0.9em;
                background: #f8fafc;
                padding: 1px 4px;
                border-radius: 3px;
                color: #0f172a;
            }}
            
            th {{ 
                background-color: #f1f5f9;
                font-weight: 700; 
                color: #0f172a;
                letter-spacing: 0.01em;
                border-bottom: 2px solid #94a3b8;
            }}
            
            tr:nth-child(even) {{ 
                background-color: #f8fafc; 
            }}
            
            hr {{
                border: 0;
                height: 1px;
                background: #e2e8f0;
                margin: {hr_margin};
            }}
            
            code {{
                font-family: 'Consolas', monospace;
                background-color: #f1f5f9;
                padding: 2px 4px;
                border-radius: 3px;
                font-size: 9pt;
                color: #0f172a;
            }}
            
            @media print {{
                @page {{
                    size: {page_size};
                    margin: {page_margin};
                }}
                body {{
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }}
                table, img, pre, h1, h2, h3, blockquote, .mermaid, .diagram-container, div:has(> img) {{
                    break-inside: avoid !important;
                    page-break-inside: avoid !important;
                }}
                img {{
                    max-height: 460px;
                    object-fit: contain;
                    break-inside: avoid !important;
                    page-break-inside: avoid !important;
                }}
                h1, h2, h3 {{
                    break-after: avoid;
                }}
                hr.page-break {{
                    page-break-after: always;
                    visibility: hidden;
                }}
            }}
        </style>
        """

    @property
    def css(self) -> str:
        return self._generate_css("standard")

    def compile(self, markdown_text: str, output_filename: str, compact_mode: str = "standard", is_landscape: bool = False) -> str:
        """
        Converts markdown to HTML, then uses Playwright to render it as a compact or standard A4 PDF.
        Supports Presentation Slide Landscape layout when is_landscape=True.
        Finally applies PyMuPDF stream deflation to minimize file size.
        """
        import re
        markdown_text = re.sub(r'([^\n])\n(\|)', r'\1\n\n\2', markdown_text)
        markdown_text = re.sub(r'\$?\\rightarrow\$?', '→', markdown_text)
        
        html_content = markdown.markdown(markdown_text, extensions=['tables', 'fenced_code'])

        # Resolve local relative image paths to Base64 Data URIs (bypasses Chromium about:blank file:// sandbox block)
        def _resolve_img_src(match):
            src = match.group(1)
            if not src.startswith("http") and not src.startswith("data:"):
                candidates = [
                    os.path.abspath(os.path.join(self.output_dir, src)),
                    os.path.abspath(os.path.join("data/output", src)),
                    os.path.abspath(src)
                ]
                for cand in candidates:
                    if os.path.exists(cand) and os.path.isfile(cand):
                        try:
                            import base64
                            with open(cand, "rb") as img_f:
                                b64 = base64.b64encode(img_f.read()).decode("utf-8")
                            ext = os.path.splitext(cand)[1].lower().replace(".", "")
                            mime = "image/png" if ext == "png" else ("image/jpeg" if ext in ("jpg", "jpeg") else "image/png")
                            return f'src="data:{mime};base64,{b64}"'
                        except Exception as e:
                            logger.warning(f"Failed to encode image {cand} to base64: {e}")
            return match.group(0)

        html_content = re.sub(r'src=["\']([^"\']+)["\']', _resolve_img_src, html_content)
        dynamic_css = self._generate_css(compact_mode, is_landscape=is_landscape)
        
        mermaid_script = ""
        if "language-mermaid" in markdown_text:
            mermaid_script = """
            <script type="module">
                import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
                
                document.querySelectorAll('pre code.language-mermaid').forEach(block => {
                    const pre = block.parentElement;
                    const div = document.createElement('div');
                    div.className = 'mermaid';
                    div.textContent = block.textContent;
                    pre.parentNode.replaceChild(div, pre);
                });
                
                mermaid.initialize({ startOnLoad: true });
            </script>
            """

        full_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            {dynamic_css}
            
            <script>
              window.MathJax = {{
                tex: {{
                  inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                  displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
                  packages: {{'[+]': ['noerrors']}},
                  formatError: (jax, err) => {{
                    const span = document.createElement('span');
                    span.className = 'math-raw-fallback';
                    span.textContent = jax.latex || '';
                    return span;
                  }}
                }},
                loader: {{
                  load: ['[tex]/noerrors']
                }},
                startup: {{
                  pageReady: () => {{
                    return MathJax.startup.defaultPageReady().then(() => {{
                      window.mathjax_is_done = true;
                    }});
                  }}
                }}
              }};
            </script>
            <script id="MathJax-script" src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
        </head>
        <body>
            {html_content}
            {mermaid_script}
        </body>
        </html>
        """
        
        if os.path.isabs(output_filename) or os.path.dirname(output_filename):
            output_path = output_filename
        else:
            output_path = os.path.join(self.output_dir, output_filename)

        if is_landscape:
            margins = {"top": "14mm", "right": "20mm", "bottom": "14mm", "left": "20mm"}
            pdf_opts = {
                "path": output_path,
                "format": "A4",
                "landscape": True,
                "margin": margins,
                "display_header_footer": True,
                "header_template": '<div></div>',
                "footer_template": '<div style="font-size:9pt;font-family:Inter,sans-serif;color:#64748b;text-align:right;width:100%;padding-right:20mm;margin-bottom:4mm;">DocuMorph Clean Slide | Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
                "print_background": True
            }
        else:
            if compact_mode == "ultra_dense":
                margins = {"top": "8mm", "right": "10mm", "bottom": "12mm", "left": "10mm"}
            elif compact_mode in ("compact", "balanced"):
                margins = {"top": "10mm", "right": "12mm", "bottom": "14mm", "left": "12mm"}
            else:
                margins = {"top": "15mm", "right": "15mm", "bottom": "18mm", "left": "15mm"}
            pdf_opts = {
                "path": output_path,
                "format": "A4",
                "landscape": False,
                "margin": margins,
                "display_header_footer": True,
                "header_template": '<div></div>',
                "footer_template": '<div style="font-size:8pt;font-family:Inter,sans-serif;color:#64748b;text-align:center;width:100%;margin-bottom:4mm;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
                "print_background": True
            }
        
        # Render to PDF via Playwright Chromium
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.set_default_timeout(20000)
            page.set_content(full_html, wait_until="domcontentloaded")
            
            try:
                page.wait_for_function("window.mathjax_is_done === true", timeout=8000)
            except Exception as e:
                pass
            
            page.pdf(**pdf_opts)
            browser.close()

        # PyMuPDF Stream Deflation: optimize byte size as well as space
        try:
            pdf_doc = fitz.open(output_path)
            temp_opt = output_path + ".opt.pdf"
            pdf_doc.save(temp_opt, deflate=True, garbage=4, clean=True)
            pdf_doc.close()
            os.replace(temp_opt, output_path)
        except Exception:
            pass
            
        return output_path

if __name__ == "__main__":
    compiler = PDFCompiler(output_dir=".")
    test_md = "# DocuMorph Compact Test\\nThis is a *test* of compact space compilation.\\n\\n- Item 1\\n- Item 2"
    path = compiler.compile(test_md, "test_output.pdf", compact_mode="compact")
    print(f"Compiled to {path}")
