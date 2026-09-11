import re
import os
import json

class HindiHandler:
    """
    Phase 5: Detects and handles Hindi (Devanagari) text blocks.
    Modes: 
      - 'en': English only (strips Hindi)
      - 'hi': Hindi only (strips English)
      - 'bilingual' / 'hi-en': Retains both
    """
    def __init__(self, config_path: str = "config.json", mode: str = "en"):
        self.mode = mode
        mode_lower = mode.lower()
        if any(x in mode_lower for x in ["only english", "english + math", "en+math", "english_only", "en"]):
            self.mode = "en"
        elif any(x in mode_lower for x in ["only hindi", "hindi + math", "math+hindi", "hindi_only", "hi"]):
            self.mode = "hi"
        elif any(x in mode_lower for x in ["only math", "math only", "math_only"]):
            self.mode = "math"
        elif any(x in mode_lower for x in ["auto", "bilingual", "both", "all"]):
            self.mode = "auto"
        else:
            self.mode = mode_lower
        
        if self.mode == "auto" and os.path.exists(config_path):
            try:
                with open(config_path, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                    if "language_mode" in config:
                        # Normalize config value
                        cfg_mode = config["language_mode"].lower()
                        if cfg_mode == "english-only": self.mode = "en"
                        elif cfg_mode == "hindi-only": self.mode = "hi"
                        else: self.mode = cfg_mode
            except Exception as e:
                print(f"Error loading config.json for HindiHandler: {e}")
                
        # Devanagari Unicode Block: U+0900 to U+097F
        self.devanagari_pattern = re.compile(r'[\u0900-\u097F]+')
        # Math detection (basic heuristic to avoid dropping standalone math in hi mode)
        self.math_pattern = re.compile(r'(\$[^$]+\$)|(\\\()|(\\\[)|([0-9+\-*/=^])')

    def has_hindi(self, text: str) -> bool:
        return bool(self.devanagari_pattern.search(text))

    def clean_segment(self, s: str) -> str:
        """Cleans a single text segment (inside a cell or standalone line) based on mode."""
        # Extract and preserve leading markdown structural prefixes (headings, bullets, blockquotes)
        prefix_match = re.match(r'^(\s*(?:#{1,6}\s+|[*+\-]\s+|\d+\.\s+|>\s*)*)', s)
        prefix = prefix_match.group(1) if prefix_match else ''
        content = s[len(prefix):].strip()
        
        if not content:
            return s if prefix else ""
            
        has_hindi = self.has_hindi(content)
        
        if self.mode == "en":
            if has_hindi:
                # 1. Protect all math blocks ($...$ or $$...$$) with placeholders before cleaning
                math_blocks = []
                def save_math(m):
                    math_blocks.append(m.group(0))
                    return f"__MATH_HOLD_{len(math_blocks)-1}__"
                content_safe = re.sub(r'(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)', save_math, content)

                parts = re.split(r'\s*[/|]\s*', content_safe)
                en_parts = []
                for p in parts:
                    p_stripped = self.devanagari_pattern.sub('', p).strip()
                    # Check for genuine English words excluding the placeholder itself
                    clean_for_latin = re.sub(r'__MATH_HOLD_\d+__', '', p_stripped)
                    if re.search(r'[a-zA-Z]{2,}', clean_for_latin):
                        en_parts.append(p_stripped)
                    elif not en_parts and (re.search(r'[a-zA-Z0-9]', clean_for_latin) or '__MATH_HOLD_' in p_stripped):
                        en_parts.append(p_stripped)
                        
                if en_parts:
                    res = ' - '.join(en_parts)
                    res = re.sub(r'[\u2014\u2013]+', '-', res)
                    res = re.sub(r'\(\s*\)', '', res)
                    res = re.sub(r'\[\s*\]', '', res)
                    res = re.sub(r'\{\s*\}', '', res)
                    res = re.sub(r':\s*-\s*:\s*-\s*:', '', res)
                    res = re.sub(r'(?:[-:–—\s]*\s*/\s*)+', ' - ', res)
                    res = re.sub(r'^\s*[-:,/\s—]+', '', res)
                    res = re.sub(r'[-:,/\s—]+\s*$', '', res)
                    res = re.sub(r'\s+', ' ', res).strip()
                    if res.count('*') % 2 != 0:
                        res = re.sub(r'\*+', '', res).strip()
                    # Restore math placeholders
                    for idx, mb in enumerate(math_blocks):
                        res = res.replace(f"__MATH_HOLD_{idx}__", mb)
                    return f"{prefix}{res}".strip() if res else ""
                else:
                    # ZERO DATA LOSS GUARD:
                    # If this line contains pure Hindi mnemonic trick (e.g. ट्रिक - "यशोदा को राम सा कंगन चाहिए" or य -> यमुना)
                    # and has NO English translation on the page, PRESERVE IT VERBATIM rather than deleting into empty arrows!
                    return f"{prefix}{content}".strip()
            return s
            
        elif self.mode == "hi":
            if has_hindi:
                # 1. Protect all math blocks ($...$ or $$...$$) with placeholders before cleaning
                math_blocks = []
                def save_math(m):
                    math_blocks.append(m.group(0))
                    return f"__MATH_HOLD_{len(math_blocks)-1}__"
                content_safe = re.sub(r'(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)', save_math, content)

                parts = re.split(r'\s*[/|]\s*', content_safe)
                hi_parts = []
                for p in parts:
                    if self.has_hindi(p):
                        # If segment has: English + (Hindi) -> unwrap Hindi
                        match = re.match(r'^[a-zA-Z\s,.\-0-9]+\(([\u0900-\u097F\s,.\-0-9]+)\)(.*?)$', p.strip())
                        if match:
                            p = f"{match.group(1)}{match.group(2)}"
                        
                        # Strip English parentheticals and bracketed notes: (Lal Bahadur Shastri), [Instrument of Accession]
                        p = re.sub(r'[\(\[]\s*[a-zA-Z\s,.\-0-9]+[\)\]]', '', p)
                        
                        # If separated by dash or colon: English - Hindi
                        sub_parts = re.split(r'\s+[-–—:]\s+', p)
                        sub_hi = [sp for sp in sub_parts if self.has_hindi(sp)]
                        if sub_hi:
                            p = ' - '.join(sub_hi)
                            
                        # Strip remaining stray Latin words (2+ letters, not standard unit abbreviations and not math placeholder)
                        units = {"km", "m", "cm", "mm", "sec", "s", "kg", "g", "hr", "h", "km/h", "km/sec", "m/s", "m/sec"}
                        def replace_latin(m):
                            word = m.group(0)
                            if word.startswith("__MATH_HOLD_"):
                                return word
                            return word if word.lower() in units else ''
                        p = re.sub(r'(__MATH_HOLD_\d+__|[a-zA-Z]{2,})', replace_latin, p)
                        
                        # Clean up punctuation artifacts
                        p = re.sub(r'[\u2014\u2013]+', '-', p)
                        p = re.sub(r'\(\s*\)', '', p)
                        p = re.sub(r'\[\s*\]', '', p)
                        p = re.sub(r'\{\s*\}', '', p)
                        p = re.sub(r'^\s*[-:,/\s—]+', '', p)
                        p = re.sub(r'[-:,/\s—]+\s*$', '', p)
                        p = re.sub(r'\s+', ' ', p).strip()
                        if p:
                            hi_parts.append(p)
                    elif "__MATH_HOLD_" in p:
                        # Retain pure math parts
                        hi_parts.append(p.strip())

                res = ' - '.join(hi_parts) if hi_parts else ''
                # Restore math placeholders
                for idx, mb in enumerate(math_blocks):
                    res = res.replace(f"__MATH_HOLD_{idx}__", mb)
                return f"{prefix}{res}".strip() if res else ""
            else:
                # Standalone line without Hindi: Only keep if it is pure LaTeX math/formula without English text
                is_pure_math = bool(re.search(r'(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)', content)) and not re.search(r'[a-zA-Z]{3,}', re.sub(r'\\[a-zA-Z]+', '', content))
                if is_pure_math:
                    return s
                return ""
                
        elif self.mode == "math":
            # Extract ONLY mathematical equations, formulas, numeric expressions, and problem symbols
            has_latex = bool(re.search(r'(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)', content))
            if has_latex:
                return s
            # Pure arithmetic / equations: e.g. "F = m * a", "2x + 3y = 7"
            is_numeric_math = bool(re.match(r'^[0-9+\-*/=^().,\s%<>≤≥√∑∫π]+$', content))
            if is_numeric_math and len(content.strip()) > 1:
                return s
            # Short variable equation without narrative sentences (words with 4+ letters)
            clean_for_words = re.sub(r'\\[a-zA-Z]+', '', content)
            words = re.findall(r'[a-zA-Z\u0900-\u097F]{4,}', clean_for_words)
            if not words and bool(re.search(r'[0-9=+\-*/^]', content)):
                return s
            return ""

        return s

    def process_text(self, text: str) -> str:
        if self.mode in ("bilingual", "hi-en", "auto"):
            return text
            
        lines = text.split('\n')
        processed_lines = []
        
        for line in lines:
            stripped = line.strip()
            # 1. Skip empty lines
            if not stripped:
                processed_lines.append(line)
                continue
                
            # 2. Pure structural HTML tags (table, tr, thead, tbody, etc.) - NEVER mangle
            if re.match(r'^\s*</?(?:table|thead|tbody|tr|div|p|ul|ol|li)[^>]*>\s*$', line, re.IGNORECASE):
                processed_lines.append(line)
                continue
                
            # 3. HTML table cells (th / td) - Process only the inner text so HTML tags remain intact
            if '<th' in line.lower() or '<td' in line.lower():
                cleaned_line = re.sub(r'(<th[^>]*>)(.*?)(</th>)', lambda m: m.group(1) + self.clean_segment(m.group(2)) + m.group(3), line, flags=re.IGNORECASE)
                cleaned_line = re.sub(r'(<td[^>]*>)(.*?)(</td>)', lambda m: m.group(1) + self.clean_segment(m.group(2)) + m.group(3), cleaned_line, flags=re.IGNORECASE)
                processed_lines.append(cleaned_line)
                continue
                
            # 4. Markdown table separator row
            if re.match(r'^\|[-\s|:]+\|$', stripped):
                processed_lines.append(line)
                continue
                
            # 5. Markdown table data row
            if stripped.startswith('|') and stripped.endswith('|'):
                cells = line.split('|')
                cleaned_cells = [self.clean_segment(c) for c in cells]
                processed_lines.append('|'.join(cleaned_cells))
                continue
                
            # 6. Standard line / paragraph
            cleaned_line = self.clean_segment(line)
            if cleaned_line:
                if self.mode == "en" and not re.search(r'[a-zA-Z0-9]', cleaned_line):
                    # Only orphan punctuation left after removing Hindi
                    continue
                processed_lines.append(cleaned_line)
        
        return '\n'.join(processed_lines)

if __name__ == "__main__":
    hh = HindiHandler(mode="hi")
    test_str = "1 Parsec = 3.1 x 10^16 m / 1 पारसेक = 3.1 x 10^16 मीटर\nThis is pure English.\n$\\frac{1}{2}$ is math."
    print(f"Result:\n{hh.process_text(test_str)}")
