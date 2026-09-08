import re
import json
import os

class SpamFilter:
    """
    Phase 4: Removes unwanted watermarks, advertisements, and repetitive spam headers.
    Loads custom regex patterns from config.json.
    """
    def __init__(self, config_path: str = "config.json", custom_spam_words: str = ""):
        self.spam_patterns = [
            r"(?i)subscribe to.*?(channel|youtube|telegram)",
            r"(?i)join our telegram.*",
            r"(?i)download (the|our) .*?app.*",
            r"(?i)use (coupon )?code.*",
            r"(?i)apply coupon code.*",
            r"(?i)follow us on (instagram|facebook|twitter|youtube)",
            r"(?i)watermark\s*removed.*",
            r"(?i)scanned by camscanner",
            
            # Coaching / Academy Ads & Banners
            r"(?i)lexrise academy.*",
            r"(?i)(support|contact)\s*(with us|&|and)?\s*enquiry:?\s*[\d\-\+]+",
            r"(?i)seats are limited",
            r"(?i)batch highlights",
            r"(?i)live classes \+ recorded",
            r"(?i)limited time offer.*",
            r"(?i)₹\s*\d+(,\d+)?\s*only",
            r"(?i)(bihar|jharkhand|up|uk|mppsc|judiciary|raj|rajasthan|delhi).*?(apo|pre|mains|foundation|f:|f\s*:|p\+m|sankalp).*?\d+/?-?",
            r"(?i)(bihar|jharkhand|up|uk|mppsc|judiciary|raj|rajasthan|delhi).*?(apo|pre|mains|foundation|sankalp).*(batch|program)",
            r"(?i)(batch|foundation)\s*:?\s*\d+/?-?",
            r"(?i)pre\s*\+\s*mains\s*\+\s*interview\s*batch",
            r"(?i)complete preparation program",
            r"(?i)how to join\?",
            r"(?i)up-?apo\s*202\d",
            r"(?i)rajasthan\s*apo\s*202\d",
            
            # Additional Social & Free Class Spam
            r"(?i)telegram:\s*@\w+",
            r"(?i)@vrlexa",
            r"(?i)@visheshrastogi\d*",
            r"(?i)free.*?mcq live class.*",
            r"(?i)free\s*(classes|pdfs|mock tests).*",
            r"(?i)class\s*-\s*\d+",
            r"पेपर यहीं से आएगा",
            r"(?i)contact with us\s*:?\s*[\d\-\+\s]+",
            r"7599457405",
            r"(?i)\bEXA\b",
            r"(?i)original price:?",
            r"(?i)coupon code:?",
            r"(?i)best value offer",
            r"(?i)support & enquiry",
            r"(?i)steps to join",
            r"(?i)vishesh sir",
            r"(?i)tricks wale sir",
            r"(?i)expert faculty",
            r"(?i)result oriented",
            r"(?i)save\s*₹",
        ]
        
        if os.path.exists(config_path):
            try:
                with open(config_path, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                    if "custom_spam_patterns" in config:
                        self.spam_patterns.extend(config["custom_spam_patterns"])
            except Exception as e:
                print(f"Error loading config.json for SpamFilter: {e}")
                
        if custom_spam_words:
            # Split by commas, trim whitespace, and escape for regex
            words = [w.strip() for w in custom_spam_words.split(",") if w.strip()]
            for word in words:
                # Add word boundary if it's alphanumeric, otherwise just escape it
                escaped = re.escape(word)
                if word[-1].isalnum() and word[0].isalnum():
                    self.spam_patterns.append(rf"(?i)\b{escaped}\b")
                else:
                    self.spam_patterns.append(rf"(?i){escaped}")
                
        # Remove duplicates and compile
        self.spam_patterns = list(set(self.spam_patterns))
        self.compiled_patterns = [re.compile(p) for p in self.spam_patterns]
        
        # Fast path: build a set of exact lowercased strings from the patterns that are just plain text
        # (This ignores complex regexes but catches the bulk of simple spam phrases instantly)
        self.exact_spam_set = set()
        for p in self.spam_patterns:
            clean_p = p.replace('(?i)', '').replace('\\b', '').strip()
            # If it looks like plain text (no regex meta chars), add to fast lookup set
            if not re.search(r'[\*\+\?\|\(\)\[\]]', clean_p):
                self.exact_spam_set.add(clean_p.lower())

    def clean_text(self, text: str) -> str:
        """
        Removes spam patterns from the provided text, while safely ignoring math and structural terms.
        """
        # Whitelist of terms that should NEVER be touched by the spam filter
        SAFE_KEYWORDS = ["Article", "Art.", "Section", "Chapter", "Part", "→", "λ", "∑", "√", "Veto", "Amendment", "Bill"]
        
        cleaned_lines = []
        for line in text.split('\n'):
            # If line contains a safe keyword, don't run regex on it
            if any(keyword.lower() in line.lower() for keyword in SAFE_KEYWORDS):
                cleaned_lines.append(line)
                continue
                
            clean_line = line
            # Strip markdown and HTML tags just for matching purposes
            match_line = re.sub(r'[*#_\|<>]', '', clean_line)
            match_line = re.sub(r'</?\w+>', '', match_line) # strip html like <u> <mark>
            match_line = match_line.strip()
            match_lower = match_line.lower()
            
            # Fast path check
            if match_lower in self.exact_spam_set:
                continue
            
            for pattern in self.compiled_patterns:
                # Safely substitute the spam string itself, leaving the rest of the line intact
                clean_line = pattern.sub("", clean_line)
                
            if clean_line.strip() == "" and match_line != "":
                # Line was entirely spam, delete it
                continue
                
            cleaned_lines.append(clean_line)
            
        cleaned = '\n'.join(cleaned_lines)
            
        # Clean up dangling empty lines left by regex replacements
        cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
        return cleaned.strip()

if __name__ == "__main__":
    sf = SpamFilter()
    test_str = "Question 1: What is the capital of India?\nJoin our telegram channel for more!\nAnswer: New Delhi"
    print(sf.clean_text(test_str))
