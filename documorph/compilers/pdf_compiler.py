import os
import sys
import subprocess
import logging
from playwright.sync_api import sync_playwright
import markdown
import fitz

logger = logging.getLogger("documorph.pdf_compiler")

class PDFCompiler:
    """
    Phase 7: Compiles the final cleaned Markdown into a pristine, A4-sized PDF.
    Supports Standard, Compact (Balanced A4), and Ultra-Dense (Print Saver) layouts.
    """
    def __init__(self, output_dir: str = "data/output"):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)

    def _generate_css(self, compact_mode: str = "standard", is_landscape: bool = False, print_margins: bool = False) -> str:
        mode_clean = str(compact_mode).lower().strip()

        if is_landscape:
            page_margin = "14mm 20mm 14mm 20mm"
            body_font_size = "14pt"
            body_line_height = "1.55"
            p_margin_bottom = "0.65em"
            h1_font_size = "22pt"
            h1_margin = "0 0 0.4em 0"
            h2_font_size = "17pt"
            h2_margin = "0.5em 0 0.25em 0"
            h3_font_size = "14pt"
            h3_margin = "0.4em 0 0.2em 0"
            table_font_size = "11pt"
            table_padding = "6px 10px"
            table_margin = "0.8em 0"
            list_margin = "0.3em 0 0.6em 0"
            li_margin = "0.35em"
            hr_margin = "1em 0"
            blockquote_margin = "0.8em 0"
            blockquote_padding = "0.6em 1em"
            img_max_height = "260px"
        elif mode_clean in ("ultra_dense", "ultra", "print_saver", "max_compression"):
            page_margin = "6mm 8mm 8mm 8mm"
            body_font_size = "9pt"
            body_line_height = "1.28"
            p_margin_bottom = "0.22em"
            h1_font_size = "13pt"
            h1_margin = "0.35em 0 0.15em 0"
            h2_font_size = "11pt"
            h2_margin = "0.28em 0 0.12em 0"
            h3_font_size = "9.5pt"
            h3_margin = "0.22em 0 0.1em 0"
            table_font_size = "8pt"
            table_padding = "2px 5px"
            table_margin = "0.35em 0"
            list_margin = "0.1em 0 0.25em 0"
            li_margin = "0.12em"
            hr_margin = "0.35em 0"
            blockquote_margin = "0.3em 0"
            blockquote_padding = "0.25em 0.5em"
            img_max_height = "190px"
        elif mode_clean in ("smart_dense", "compact", "balanced", "compact_paper"):
            page_margin = "8mm 10mm 10mm 10mm" if not print_margins else "12mm 12mm 12mm 12mm"
            body_font_size = "10pt"
            body_line_height = "1.38"
            p_margin_bottom = "0.30em"
            h1_font_size = "14.5pt"
            h1_margin = "0.45em 0 0.18em 0"
            h2_font_size = "12pt"
            h2_margin = "0.35em 0 0.15em 0"
            h3_font_size = "10.5pt"
            h3_margin = "0.28em 0 0.12em 0"
            table_font_size = "8.5pt"
            table_padding = "3px 6px"
            table_margin = "0.45em 0"
            list_margin = "0.12em 0 0.35em 0"
            li_margin = "0.18em"
            hr_margin = "0.5em 0"
            blockquote_margin = "0.4em 0"
            blockquote_padding = "0.35em 0.7em"
            img_max_height = "220px"
        elif print_margins:
            page_margin = "16mm 16mm 16mm 16mm"
            body_font_size = "11pt"
            body_line_height = "1.50"
            p_margin_bottom = "0.45em"
            h1_font_size = "16pt"
            h1_margin = "0.6em 0 0.25em 0"
            h2_font_size = "13.5pt"
            h2_margin = "0.5em 0 0.2em 0"
            h3_font_size = "11pt"
            h3_margin = "0.35em 0 0.15em 0"
            table_font_size = "9pt"
            table_padding = "4px 7px"
            table_margin = "0.6em 0"
            list_margin = "0.15em 0 0.4em 0"
            li_margin = "0.2em"
            hr_margin = "0.6em 0"
            blockquote_margin = "0.5em 0"
            blockquote_padding = "0.4em 0.8em"
            img_max_height = "250px"
        else: # standard
            page_margin = "10mm 12mm 12mm 12mm"
            body_font_size = "11pt"
            body_line_height = "1.48"
            p_margin_bottom = "0.45em"
            h1_font_size = "16.5pt"
            h1_margin = "0.65em 0 0.25em 0"
            h2_font_size = "13.5pt"
            h2_margin = "0.5em 0 0.2em 0"
            h3_font_size = "11pt"
            h3_margin = "0.35em 0 0.15em 0"
            table_font_size = "9pt"
            table_padding = "5px 8px"
            table_margin = "0.6em 0"
            list_margin = "0.15em 0 0.4em 0"
            li_margin = "0.22em"
            hr_margin = "0.6em 0"
            blockquote_margin = "0.5em 0"
            blockquote_padding = "0.4em 0.8em"
            img_max_height = "260px"

        page_size = "297mm 210mm" if is_landscape else "A4 portrait"

        return f"""
        <style>
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
                max-width: 90% !important; 
                max-height: {img_max_height} !important; 
                object-fit: contain;
                display: block;
                margin: 0.4em auto;
                border-radius: 4px;
                break-inside: avoid;
                page-break-inside: avoid;
            }}
            
            .diagram-container {{
                margin: 6px 0 !important;
                text-align: center;
                break-inside: avoid;
                page-break-inside: avoid;
            }}
            
            .diagram-container img {{
                max-height: {img_max_height} !important;
            }}
            
            table {{
                width: 100%;
                max-width: 100%;
                border-collapse: collapse;
                margin: {table_margin};
                border: 1px solid #cbd5e1;
                table-layout: auto;
                word-wrap: break-word;
                word-break: break-word;
                overflow-wrap: break-word;
                font-size: {table_font_size};
                break-inside: avoid;
                page-break-inside: avoid;
            }}
            
            th, td {{
                padding: {table_padding};
                text-align: left;
                text-align-last: left;
                border: 1px solid #cbd5e1;
                vertical-align: top;
                word-break: break-word;
                overflow-wrap: break-word;
            }}

            td p, th p {{
                margin: 0 !important;
                padding: 0 !important;
                line-height: inherit !important;
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

    def compile(
        self, 
        markdown_text: str, 
        output_filename: str, 
        compact_mode: str = "standard", 
        is_landscape: bool = False,
        print_margins: bool = False,
        progress_callback = None,
        **kwargs
    ) -> str:
        """
        Converts markdown to HTML, then uses Playwright to render it as a compact or standard A4 PDF.
        Supports Presentation Slide Landscape layout when is_landscape=True.
        Finally applies PyMuPDF stream deflation to minimize file size.
        """
        import re
        markdown_text = markdown_text.replace('\r\n', '\n')
        markdown_text = re.sub(r'\$?\\rightarrow\$?', '→', markdown_text)
        markdown_text = re.sub(r'(?m)^([+\-])\s+(?=(?:\\|\$|[a-zA-Z0-9_]+\s*\\))', r'\\\1 ', markdown_text)

        # -------------------------------------------------------------
        # DOCUMORPH UNIVERSAL MATH SIPHON & TABLE NORMALIZER
        # Extracts English prose, headings, figures, tables, and Devanagari
        # out of math blocks to permanently eliminate 'Math input error' and
        # squashed word collisions.
        # -------------------------------------------------------------
        # 1. Reconcile mismatched delimiters like "$expr $$" -> "$$expr$$"
        markdown_text = re.sub(r'(?<!\$)\$([^$\n]+)\$\$(?!\$)', r'$$\1$$', markdown_text)

        # 2. Universal Display Math Siphon
        def _clean_math_block(match):
            block = match.group(1)
            lines = block.split('\n')
            segments = []
            curr_math = []

            def flush_math():
                nonlocal curr_math
                if curr_math:
                    m_clean = "\n".join(curr_math).strip()
                    m_clean = re.sub(r'(?<!\\)\$([^$\n]+)(?<!\\)\$', r'\1', m_clean)
                    # Extract common prose lead-ins outside math
                    lead_match = re.match(r'^(?:Comparing this with|Therefore(?: the)?|Where(?: the)?|When|If|We know|But the|According to)\s+', m_clean, re.IGNORECASE)
                    if lead_match:
                        lead_in = lead_match.group(0).strip()
                        rem = m_clean[len(lead_match.group(0)):].strip()
                        segments.append(lead_in)
                        if rem:
                            segments.append(f"$${rem}$$")
                    elif m_clean:
                        segments.append(f"$${m_clean}$$")
                    curr_math = []

            for l in lines:
                l_strip = l.strip()
                if not l_strip:
                    continue

                is_heading = bool(re.match(r'^#{1,6}\s+', l_strip))
                is_table_row = (l_strip.startswith('|') and l_strip.endswith('|') and ('|' in l_strip[1:-1] or ':---' in l_strip))
                is_figure = bool(re.match(r'^(?:\[(?:Figure|Diagram|चित्र|डायग्राम)|Figure:|चित्र:)', l_strip, re.IGNORECASE))
                is_list_item = bool(re.match(r'^(?:[*•]\s+|\d+\.\s+)', l_strip)) and not bool(re.search(r'[=\\$\^]', l_strip))
                
                deva_count = len(re.findall(r'[\u0900-\u097F]', l_strip))
                is_deva_prose = deva_count > 3

                strip_latex = re.sub(r'\\[a-zA-Z]+(?:\{[^}]*\})?', '', l_strip)
                eng_words = re.findall(r'\b[A-Za-z]{3,}\b', strip_latex)
                is_eng_prose = len(eng_words) >= 3

                if is_heading or is_table_row or is_figure or is_list_item or is_deva_prose or is_eng_prose:
                    flush_math()
                    segments.append(l_strip)
                else:
                    curr_math.append(l_strip)

            flush_math()
            return "\n\n" + "\n\n".join(segments) + "\n\n"

        markdown_text = re.sub(r'\$\$(.*?)\$\$', _clean_math_block, markdown_text, flags=re.DOTALL)

        # 3. Clean up stray / odd $$ delimiters
        if len(re.findall(r'\$\$', markdown_text)) % 2 != 0:
            markdown_text = re.sub(r'(?m)^\s*\$\$\s*$', '', markdown_text, count=1)
            if len(re.findall(r'\$\$', markdown_text)) % 2 != 0:
                markdown_text = markdown_text.replace('$$', '', 1)

        # 4. Split concatenated table rows joined on a single line
        lines = markdown_text.split('\n')
        split_lines = []
        for l in lines:
            ls = l.strip()
            if ls.startswith('|') and ls.endswith('|') and (' | | ' in ls or ' | |' in ls or '| |' in ls):
                sub_rows = re.split(r'(?<=\|)\s+(?=\|)', ls)
                if len(sub_rows) > 1 and all(r.strip().startswith('|') and r.strip().endswith('|') for r in sub_rows):
                    split_lines.extend(sub_rows)
                    continue
            split_lines.append(l)
        markdown_text = '\n'.join(split_lines)

        # 5. Automatically prepend missing table headers if table starts with separator
        t_lines = markdown_text.split('\n')
        processed_t = []
        for line in t_lines:
            ls = line.strip()
            if re.match(r'^\|(?:\s*:?-+:?\s*\|)+$', ls):
                prev_line = ""
                for p in reversed(processed_t):
                    if p.strip():
                        prev_line = p.strip()
                        break
                is_valid_header = prev_line.startswith('|') and prev_line.endswith('|') and not re.match(r'^\|(?:\s*:?-+:?\s*\|)+$', prev_line)
                if not is_valid_header:
                    col_count = len([c for c in ls.split('|') if c.strip()])
                    if col_count == 2:
                        header = "| Symbol / Item | Description / Translation |"
                    else:
                        header = "| " + " | ".join([f"Item {c+1}" for c in range(col_count)]) + " |"
                    processed_t.append(header)
            processed_t.append(line)
        markdown_text = '\n'.join(processed_t)

        # 6. Ensure blank lines before and after tables without breaking row continuity
        markdown_text = re.sub(r'([^\n|])\n(\|)', r'\1\n\n\2', markdown_text)
        markdown_text = re.sub(r'(\|\n)([^|\n])', r'\1\n\n\2', markdown_text)

        # 4. Shield all math blocks into safe token placeholders before Markdown parsing
        math_store = {}
        math_counter = 0

        def _shield_display_math(m):
            nonlocal math_counter
            token = f"@@DOCUMORPH_DISPLAY_MATH_{math_counter}@@"
            content = m.group(1).strip()
            math_store[token] = f'<div class="math-display" style="text-align: center; margin: 0.9em 0; overflow-x: auto; break-inside: avoid; page-break-inside: avoid;">$${content}$$</div>'
            math_counter += 1
            return f"\n\n{token}\n\n"

        shielded_text = re.sub(r'\$\$(.*?)\$\$', _shield_display_math, markdown_text, flags=re.DOTALL)

        def _shield_inline_math(m):
            nonlocal math_counter
            token = f"@@DOCUMORPH_INLINE_MATH_{math_counter}@@"
            content = m.group(1).strip()
            math_store[token] = f'<span class="math-inline">${content}$</span>'
            math_counter += 1
            return token

        shielded_text = re.sub(r'(?<!\\)\$([^$\n]+?)(?<!\\)\$', _shield_inline_math, shielded_text)

        # 5. Compile markdown safely
        html_content = markdown.markdown(shielded_text, extensions=['tables', 'fenced_code'])

        # 6. Unshield math tokens
        for token, math_html in math_store.items():
            html_content = html_content.replace(f"<p>{token}</p>", math_html)
            html_content = html_content.replace(token, math_html)

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
        dynamic_css = self._generate_css(compact_mode, is_landscape=is_landscape, print_margins=print_margins)
        
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

        has_math = bool("$" in markdown_text or "\\(" in markdown_text or "\\[" in markdown_text)
        
        if has_math:
            mathjax_block = """
            <script>
              window.MathJax = {
                options: {
                  enableMenu: false
                },
                tex: {
                  inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                  displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
                  packages: {'[+]': ['noerrors']},
                  formatError: (jax, err) => {
                    const span = document.createElement('span');
                    span.className = 'math-raw-fallback';
                    span.textContent = jax.latex || '';
                    return span;
                  }
                },
                loader: {
                  load: ['[tex]/noerrors']
                },
                startup: {
                  pageReady: () => {
                    return MathJax.startup.defaultPageReady().then(() => {
                      window.mathjax_is_done = true;
                    });
                  }
                }
              };
            </script>
            <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"></script>
            """
        else:
            mathjax_block = """
            <script>
              window.mathjax_is_done = true;
            </script>
            """

        full_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            {dynamic_css}
            {mathjax_block}
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
            if print_margins:
                margins = {"top": "20mm", "right": "20mm", "bottom": "20mm", "left": "20mm"}
            elif compact_mode == "ultra_dense":
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
        
        if progress_callback:
            progress_callback("Typesetting page typography & HTML layout...", 91)

        # Container-safe low-memory Chromium flags (prevents /dev/shm OOM crashes on Render 512MB)
        chromium_args = [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--disable-extensions",
            "--disable-background-networking",
            "--disable-default-apps",
            "--disable-sync",
            "--mute-audio",
            "--js-flags=--max-old-space-size=128"
        ]
        if sys.platform.startswith("linux"):
            chromium_args.append("--no-zygote")

        import gc
        gc.collect()

        # Render to PDF via Playwright Chromium (with automatic self-healing on missing browser)
        with sync_playwright() as p:
            try:
                browser = p.chromium.launch(headless=True, args=chromium_args)
            except Exception as launch_err:
                err_msg = str(launch_err)
                if "Executable doesn't exist" in err_msg or "playwright install" in err_msg:
                    logger.warning("Playwright Chromium executable missing in environment. Running auto-install...")
                    try:
                        subprocess.run([sys.executable, "-m", "playwright", "install", "chromium"], check=True)
                        browser = p.chromium.launch(headless=True, args=chromium_args)
                    except Exception as install_err:
                        logger.error(f"Failed to auto-install Playwright chromium: {install_err}")
                        raise launch_err
                else:
                    raise launch_err

            page = browser.new_page()
            page.set_default_timeout(60000)
            try:
                page.set_content(full_html, wait_until="domcontentloaded", timeout=30000)
            except Exception as set_ex:
                logger.warning(f"DOM load warning, attempting commit fallback: {set_ex}")
                try:
                    page.set_content(full_html, wait_until="commit", timeout=20000)
                    page.wait_for_load_state("domcontentloaded", timeout=15000)
                except Exception:
                    pass

            try:
                page.wait_for_selector("body", state="attached", timeout=10000)
            except Exception:
                pass

            if has_math:
                if progress_callback:
                    progress_callback("Rendering vector MathJax expressions...", 93)
                try:
                    page.wait_for_function("window.mathjax_is_done === true", timeout=8000)
                except Exception:
                    pass

            if progress_callback:
                progress_callback("Compiling print-ready PDF pages...", 96)
            
            page.pdf(**pdf_opts)
            browser.close()
            gc.collect()

        if progress_callback:
            progress_callback("Deflating streams & optimizing file size...", 99)

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
