import re
import logging

logger = logging.getLogger(__name__)


class FormatFixer:
    """
    Phase 6: Standardizes markdown formatting to ensure the final output is clean
    and compiles perfectly into a native PDF.
    """

    def fix_markdown(self, markdown_text: str) -> str:
        text = markdown_text

        # 1. Normalize line endings
        text = text.replace('\r\n', '\n')
        
        # 1.a. Clean up garbage brackets left by Hindi deletion e.g. ( , , , ) or ( , )
        text = re.sub(r'\(\s*(?:,\s*)+\)', '', text)
        
        # 1.b. Clean up dangling slashes and long dashes at the start of words/lines (preserving valid indentation)
        text = re.sub(r'(?m)^[ \t]*[/—]+\s*', '', text)
        text = re.sub(r'\s+/\s+', ' - ', text)     # Replace standalone slashes with dashes
        text = re.sub(r'\s+—\s+', ' - ', text)     # Normalize long dashes
        
        # 1.c. Fix squashed headings/bold tags like "Age**1."
        text = re.sub(r'([a-zA-Z])(\*\*)', r'\1 \2', text)
        
        # 1.d. Collapse excessive newlines
        text = re.sub(r'\n{3,}', '\n\n', text)

        # 2. Fix degree symbols: \circC → °C, \circF → °F
        text = re.sub(r'\\circC', '°C', text)
        text = re.sub(r'\\circF', '°F', text)
        text = re.sub(r'\\circ\s*C', '°C', text)
        text = re.sub(r'\\circ\s*F', '°F', text)
        text = re.sub(r'\\circ', '°', text)  # generic degree

        # 3. Fix broken bullet points (e.g., "*Item" -> "* Item") while protecting negative math operators
        # If a line starts with "- " or "+ " followed by a LaTeX command or equation (e.g. "- \frac{...}", "- L \frac{...}"),
        # escape the leading hyphen (\- ) so Markdown never interprets it as a bullet list!
        text = re.sub(r'(?m)^([+\-])\s+(?=(?:\\|\$|[a-zA-Z0-9_]+\s*\\))', r'\\\1 ', text)
        text = re.sub(r'^(\*|-)([\w])', r'\1 \2', text, flags=re.MULTILINE)

        # 4. Fix broken headers (e.g., "##Header" -> "## Header")
        text = re.sub(r'^(#+)([\w])', r'\1 \2', text, flags=re.MULTILINE)

        # 5. Collapse 3+ newlines into exactly 2
        text = re.sub(r'\n{3,}', '\n\n', text)

        # 6. Fix spaces around bold/italic markers
        text = re.sub(r'\*\*\s+(.*?)\s+\*\*', r'**\1**', text)

        # 7. Clean up stray markdown code fences from Gemini output
        text = re.sub(r'^```markdown\s*\n', '', text, flags=re.MULTILINE)
        text = re.sub(r'^```\s*$', '', text, flags=re.MULTILINE)

        # 8. Fix LaTeX \text{} artifacts without destroying valid MathJax notation
        # Normalize double-escaped backslashes in \text
        text = re.sub(r'\\\\text\b', r'\\text', text)
        # Remove empty \text{} or \text{ }
        text = re.sub(r'\\text\{\s*\}', '', text)
        # Fix \text followed by words without braces: \text m/sec -> \text{m/sec}
        text = re.sub(r'\\text\s+([a-zA-Z0-9_/\.\-]+)', r'\\text{\1}', text)
        # Strip trailing bare \text at the end of math: e.g. \text$ or \text $ or \text\b
        text = re.sub(r'\\text\s*(?=[$\n])', '', text)
        # Any remaining bare \text not followed by { is invalid LaTeX and causes MathJax "Missing argument for \text"
        text = re.sub(r'\\text\b(?!\s*\{)', '', text)
        
        # 8.b. Chemical & Physical Formula Subscript Sanitizer:
        # Fixes broken formulas like \text{C}6\text{H}{12}\text{O}6 -> \text{C}_6\text{H}_{12}\text{O}_6
        # 1. Fix element followed by {digits} without underscore: \text{H}{12} -> \text{H}_{12}
        text = re.sub(r'(\\text\{[A-Z][a-z]?\})\s*\{(\d+)\}', r'\1_{\2}', text)
        text = re.sub(r'(?<![a-zA-Z0-9_\\])([A-Z][a-z]?)\{(\d+)\}', r'\1_{\2}', text)
        # 2. Fix \text{Element}digits without underscore: \text{C}6 -> \text{C}_6, \text{O}6 -> \text{O}_6
        text = re.sub(r'(\\text\{[A-Z][a-z]?\})\s*(\d+)', r'\1_{\2}', text)
        # 3. Fix unclosed/asymmetric parenthesis before math ending with $: (\text{C}_6...$ -> ($\text{C}_6...$)
        text = re.sub(r'\(([\\a-zA-Z0-9_{}^]+)\$', r'($\1$)', text)
        # 4. Chemical reaction & equilibrium arrows inside math: -> to \rightarrow, <=> to \rightleftharpoons
        def _fix_chem_arrows(match):
            m = match.group(0)
            m = re.sub(r'(?<=\s|<)(?:<==>|<=>|<-->)(?=\s|>|\$)', r'\\rightleftharpoons ', m)
            m = re.sub(r'(?<=\s)(?:-->|->)(?=\s|\$)', r'\\rightarrow ', m)
            return m
        text = re.sub(r'\$[^$\n]+\$', _fix_chem_arrows, text)
        text = re.sub(r'\$\$(.*?)\$\$', _fix_chem_arrows, text, flags=re.DOTALL)

        # 8.c. Ensure balanced braces inside inline math $ ... $
        def fix_inline_math(match):
            m = match.group(0)
            diff = m.count('{') - m.count('}')
            if diff > 0:
                m = m[:-1] + ('}' * diff) + '$'
            elif diff < 0:
                for _ in range(abs(diff)):
                    m = re.sub(r'\}(?=[^}]*\$)', '', m, count=1)
            return m
        text = re.sub(r'\$[^$\n]+\$', fix_inline_math, text)

        # 9. Clean up empty or broken callouts left by LLM
        text = re.sub(r'(?m)^>\s*(?:\*\*(?:Key Fact|Note|Important):?\*\*)?\s*$', '', text)
        text = re.sub(r'(?m)^>\s*\*\*(?:Key Fact|Note|Important):?\*\*\s*\d+\s*$', '', text)
        text = re.sub(r'(?m)^>\s*\*\*(?:Key Fact|Note):?\*\*\s*["\']\s*["\']\s*-\s*', '> **Note:** ', text)

        # 10. Remove lone OCR artifact page numbers (e.g. lines with only 1-3 digits) and orphan map numbers like (560 ..)
        text = re.sub(r'(?m)^\s*\d{1,3}\s*$', '', text)
        text = re.sub(r'(?m)^\s*[*+\-•]?\s*\(\s*\d+[\s.]*\)\s*$', '', text)

        # 11. Split run-on inline bullet points onto new lines (e.g. "* Action 1 * Action 2")
        # CRITICAL: Match only '*' and '•'. NEVER match '-' or '+' which are mathematical operators (e.g. e = - L \frac{dI}{dt})
        text = re.sub(r'([^\n\s])[^\S\r\n]+[*•]\s+([A-Za-z0-9\u0900-\u097F])', r'\1\n* \2', text)

        # 11.b. Ensure blank line before transitioning from a regular paragraph to a list (preserving sub-bullet indentation)
        lines = text.split('\n')
        spaced_lines = []
        for i, line in enumerate(lines):
            if i > 0:
                prev = lines[i-1].strip()
                curr = line.lstrip()
                # A line is a list item if it starts with '* ', '• ', or a digit list
                # For '-' or '+', it is ONLY a list item if it does NOT contain mathematical syntax (=, \, $, ^)
                has_math = bool(re.search(r'[=\\$\^]', curr))
                is_curr_list = bool(re.match(r'^(?:[*•]\s+|\d+\.\s+)', curr)) or (bool(re.match(r'^(?:[+\-]\s+)', curr)) and not has_math)
                is_prev_list = bool(re.match(r'^(?:[*•]\s+|\d+\.\s+)', prev)) or (bool(re.match(r'^(?:[+\-]\s+)', prev)) and not bool(re.search(r'[=\\$\^]', prev)))
                is_prev_header = prev.startswith('#') or prev.startswith('>')
                if is_curr_list and prev and not is_prev_list and not is_prev_header:
                    spaced_lines.append('')
            spaced_lines.append(line)
        text = '\n'.join(spaced_lines)

        # 12. Deduplicate duplicate bilingual titles if any slipped through (e.g. "## Heading | Heading")
        text = re.sub(r'(?m)^(#+\s*)(.*?)\s*\|\s*\2\s*$', r'\1\2', text)

        # 13. Math Sanitizer & Delimiter Reconciliation:
        # Fix mismatched inline/display math delimiters like "$e = ... $$" -> "$$e = ...$$"
        text = re.sub(r'(?<!\$)\$([^$\n]+)\$\$(?!\$)', r'$$\1$$', text)

        # Reconcile Devanagari text erroneously trapped inside $$ ... $$ blocks
        def _clean_display_math(match):
            block = match.group(1)
            # Check if block contains Devanagari characters
            has_devanagari = bool(re.search(r'[\u0900-\u097F]', block))
            if not has_devanagari:
                # Remove nested $ ... $ inside $$ ... $$
                block_clean = re.sub(r'(?<!\\)\$([^$\n]+)(?<!\\)\$', r'\1', block)
                return f"\n\n$${block_clean.strip()}$$\n\n"

            # Block has Devanagari text! Split line by line to separate prose from pure math
            lines = block.split('\n')
            segments = []
            curr_math = []

            for l in lines:
                l_strip = l.strip()
                if not l_strip:
                    continue
                deva_count = len(re.findall(r'[\u0900-\u097F]', l_strip))
                if deva_count > 3:
                    # This line is prose (e.g. "लेकिन परिनालिका के अंदर चुंबकीय क्षेत्र,")
                    if curr_math:
                        m_clean = "\n".join(curr_math).strip()
                        m_clean = re.sub(r'(?<!\\)\$([^$\n]+)(?<!\\)\$', r'\1', m_clean)
                        if m_clean:
                            segments.append(f"$${m_clean}$$")
                        curr_math = []
                    segments.append(l_strip)
                else:
                    curr_math.append(l_strip)

            if curr_math:
                m_clean = "\n".join(curr_math).strip()
                m_clean = re.sub(r'(?<!\\)\$([^$\n]+)(?<!\\)\$', r'\1', m_clean)
                if m_clean:
                    segments.append(f"$${m_clean}$$")

            return "\n\n" + "\n\n".join(segments) + "\n\n"

        text = re.sub(r'\$\$(.*?)\$\$', _clean_display_math, text, flags=re.DOTALL)

        # Clean up orphan $$ delimiters on lines by themselves if total $$ count is odd
        total_double_dollars = len(re.findall(r'\$\$', text))
        if total_double_dollars % 2 != 0:
            text = re.sub(r'(?m)^\s*\$\$\s*$', '', text, count=1)

        # Auto-wrap bare/naked LaTeX equations outside delimiters (e.g. \frac{dI}{dt} = 40, \Rightarrow N_2\phi_2 = MI_1)
        latex_starters = (
            r'\\(?:Rightarrow|rightarrow|Leftarrow|leftarrow|Leftrightarrow|iff|implies|frac|dfrac|'
            r'sum|prod|int|iint|iiint|oint|sqrt|partial|nabla|alpha|beta|gamma|delta|epsilon|theta|'
            r'lambda|mu|pi|rho|sigma|tau|phi|Phi|psi|omega|Omega|vec|mathbf|mathrm|text|bm)\b'
        )
        t_lines = text.split('\n')
        wrapped_lines = []
        in_block_math = False
        for tl in t_lines:
            ts = tl.strip()
            if '$$' in ts:
                c_dd = ts.count('$$')
                if c_dd % 2 != 0:
                    in_block_math = not in_block_math
                wrapped_lines.append(tl)
                continue

            if not in_block_math and ts:
                starts_with_latex = bool(re.match(r'^(?:' + latex_starters + r')', ts))
                is_latex_eqn = bool(re.match(r'^[A-Za-z0-9_\\^]+\s*=\s*(?:[A-Za-z0-9_\\^+\-*/()]+|' + latex_starters + r')', ts)) and ('\\' in ts)
                if (starts_with_latex or is_latex_eqn) and not ts.startswith('$') and not ts.endswith('$'):
                    wrapped_lines.append(f"$${ts}$$")
                    continue
            wrapped_lines.append(tl)
        text = '\n'.join(wrapped_lines)

        # Ensure block math equations ($$) have clean blank line spacing
        text = re.sub(r'(?<!\n)\n\s*\$\$(.*?)\$\$\s*\n(?!\n)', r'\n\n$$\1$$\n\n', text, flags=re.DOTALL)

        # 14. Ensure blank line before markdown tables so table extension parses them
        text = re.sub(r'([^\n\s])\n(\|)', r'\1\n\n\2', text)

        # 15. Fix glued punctuation and adjacent bilingual scripts (English and Devanagari)
        text = re.sub(r'([.!?])([\u0900-\u097F])', r'\1 \2', text)
        text = re.sub(r'([a-zA-Z])([\u0900-\u097F])', r'\1 \2', text)
        text = re.sub(r'([\u0900-\u097F])([a-zA-Z])', r'\1 \2', text)

        return text.strip('\r\n')


if __name__ == "__main__":
    ff = FormatFixer()
    test_str = "##Header\n*Bullet point 1\n\n\n\n** bold word **\n36.9\\circC / 37\\circC"
    print(ff.fix_markdown(test_str))
