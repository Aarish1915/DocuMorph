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

        # 3. Fix broken bullet points (e.g., "*Item" -> "* Item")
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
        
        # Ensure balanced braces inside inline math $ ... $
        def fix_inline_math(match):
            m = match.group(0)
            # If math has unclosed { (more { than })
            diff = m.count('{') - m.count('}')
            if diff > 0:
                # Add missing closing braces before closing $
                m = m[:-1] + ('}' * diff) + '$'
            elif diff < 0:
                # Extra closing braces: strip from end
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
        text = re.sub(r'([^\n\s])[^\S\r\n]+[*+\-]\s+([A-Za-z0-9\u0900-\u097F])', r'\1\n* \2', text)

        # 11.b. Ensure blank line before transitioning from a regular paragraph to a list (preserving sub-bullet indentation)
        lines = text.split('\n')
        spaced_lines = []
        for i, line in enumerate(lines):
            if i > 0:
                prev = lines[i-1].strip()
                curr = line.lstrip()
                is_curr_list = bool(re.match(r'^(?:[*+\-]\s+|\d+\.\s+)', curr))
                is_prev_list = bool(re.match(r'^(?:[*+\-]\s+|\d+\.\s+)', prev))
                is_prev_header = prev.startswith('#') or prev.startswith('>')
                if is_curr_list and prev and not is_prev_list and not is_prev_header:
                    spaced_lines.append('')
            spaced_lines.append(line)
        text = '\n'.join(spaced_lines)

        # 12. Deduplicate duplicate bilingual titles if any slipped through (e.g. "## Heading | Heading")
        text = re.sub(r'(?m)^(#+\s*)(.*?)\s*\|\s*\2\s*$', r'\1\2', text)

        # 13. Ensure block math equations ($$) are properly centered/spaced on their own lines
        text = re.sub(r'(?<!\n)\s*\$\$(.*?)\$\$\s*(?!\n)', r'\n\n$$\1$$\n\n', text, flags=re.DOTALL)

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
