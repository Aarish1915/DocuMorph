import os
import json
import base64
import time
import socket
import logging
from pathlib import Path

# Force IPv4 resolution to prevent Windows IPv6 routing drops/timeouts
_orig_getaddrinfo = socket.getaddrinfo
def _ipv4_getaddrinfo(*args, **kwargs):
    res = _orig_getaddrinfo(*args, **kwargs)
    return [r for r in res if r[0] == socket.AF_INET] or res
socket.getaddrinfo = _ipv4_getaddrinfo

from google import genai
from google.genai import types
from typing import Dict, Optional, List
import re
from PIL import Image
import io
import asyncio

from documorph.core.tier_manager import TierManager
from documorph.core.api_router import APIRouter

logger = logging.getLogger(__name__)

class BatchVisionEngine:
    """
    AI Engine: Processes multiple images natively in a single API call (Native Multi-Part Batching).
    No resolution loss. No stitching. Respects dynamic tier rate limits.
    """
    def __init__(
        self, 
        custom_api_key: str = None, 
        custom_prompt: str = None, 
        ignore_images: str = "",
        language_mode: str = "auto"
    ):
        self.tier_manager = TierManager()
        self.profile = self.tier_manager.get_profile()
        
        self.custom_prompt = custom_prompt
        self.ignore_images = ignore_images
        self.language_mode = language_mode
        
        self.backend = "gemini" # Currently hardcoded to gemini sdk, could be abstracted
        # Initialize APIRouter
        self.router = APIRouter()
        self.model_name = self.profile["vision_model"]
        self.total_retry_delay_seconds = 0.0
        self.total_api_calls = 0
        self.total_input_tokens = 0
        self.total_output_tokens = 0
        logger.info(f"Initialized BatchVisionEngine with model: {self.model_name}. API Keys available: {self.router.get_total_keys()}")

    def _get_prompt(self, is_full_page: bool = False) -> str:
        # Guard against frontend boolean bugs
        if self.ignore_images and self.ignore_images.lower() in ('false', 'true'):
            self.ignore_images = ''
            
        ignore_clause = f"\nCRITICAL: DO NOT extract any images matching these descriptions: {self.ignore_images}. Return an empty string for them." if self.ignore_images else ""
        
        prompt = f"""
You are an expert OCR and document structure AI. Your job is to extract text, tables, and math equations from the provided image(s) perfectly.

### EXTRACTION RULES:
1. **NO CODE BLOCKS FOR NORMAL TEXT**: NEVER wrap standard paragraph text, headings, or lists inside markdown code blocks (```). Normal text must be output as pure, raw text.
2. **PRESERVE LINE BREAKS**: If you see a vertical list of items (e.g. states, cities, features, river names) each on their own line, YOU MUST preserve the line breaks. DO NOT squash lists into a single paragraph. Every bullet point must be on its own line starting with '* '.
3. **STRUCTURAL HIERARCHY**: Preserve the exact natural hierarchy of the document. Use # for main topic, ## for sections, ### for subsections.
4. **TABLE FIDELITY (HTML ONLY)**: If the original image contains a structured grid, table, or comparison, YOU MUST output it using strict HTML `<table>`, `<tr>`, `<th>`, and `<td>` tags. DO NOT use markdown tables (no `|` pipes). Preserve EVERY cell and number exactly.
5. **MATH PRECISION**: For mathematical equations, use standard LaTeX notation ($...$ inline, $$...$$ display). Always ensure \\text{{...}} has valid braces around text (e.g. $\\text{{m/s}}$). Never output bare \\text without braces.
6. **ZERO HALLUCINATION, ZERO COMMENTARY & ZERO OMISSION (CRITICAL)**:
   - Extract 100% of the authentic concepts, facts, names, formulas, and examples VERBATIM.
   - NEVER add meta-commentary, scene descriptions, or photo captions like "(No text found in image)" or "[Photograph depicting...]". If an image has no text, output an empty string or omit it.
   - NEVER invent fake rules, commentary, or placeholders.
   - NEVER omit legitimate study material, summary diagrams, or mnemonic tricks.
7. **MNEMONIC TRICKS ("शॉर्ट ट्रिक" / "TRICK")**:
   - If a page has a mnemonic memory trick (e.g. `ट्रिक - "यशोदा को राम सा कंगन चाहिए"`, `आम गुनाह है मैम तुसी गाओ...`, `Trick: U.P. B.J.P`), YOU MUST extract the complete trick sentence in quotation marks.
   - Below the trick, list EVERY letter mapping on its own line: `* य -> यमुना नदी`, `* शो -> सोन नदी`, `* दा -> दामोदर नदी`, etc.
   - NEVER output blank quotes `Trick - " "` or empty arrows `• →`! If a trick is written in Hindi, preserve the full Hindi text verbatim so the mnemonic makes sense.
8. **DIAGRAMS, MAPS & REGIONAL DIVISIONS**:
   - For regional/district maps (e.g. Uttarakhand map): structure as clean bulleted sections:
     `### Garhwal Division`
     `* Uttarkashi`
     `* Tehri Garhwal`
     `* Dehradun`
     `* Haridwar`
     `* Pauri Garhwal`
     `* Rudraprayag`
     `* Chamoli`
     `* Gairsain`
     
     `### Kumaon Division`
     `* Bageshwar`
     `* Almora`
     `* Pithoragarh`
     `* Nainital`
     `* Champawat`
     `* Udham Singh Nagar`
   - For Himalayan divisions and peaks: extract every division with its length (e.g. `* Punjab Himalaya (560 km) - Indus to Sutlej River`) and every peak with elevation (e.g. `* Nanga Parbat (8,126 m)`, `* Nanda Devi (7,817 m)`, `* Mt. Everest (8,848.86 m)`, `* Kanchenjunga (8,598 m)`, `* Namcha Barwa (7,756 m)`). NEVER leave orphan numbers like `(8,126 .)`!
   - For comparison charts or ordered values (e.g. `SPEED IN DIFFERENT MEDIA`: `VACUUM > GAS > LIQUID > SOLID`): ALWAYS structure the data into an HTML table (`<table>` with `<th>` and `<td>`).
   - For river confluences / Panch Prayag: format as an HTML `<table>` with columns `Prayag` and `Confluence / Rivers`.
9. **SPAM & PROMOTIONAL FEE DELETION**: Silently DELETE all coaching center promotional banners, watermarks, and fees (e.g. "LexRise Academy", "Bihar APO Pre", "Judiciary Pre", "Foundation Batch", "UK APO F: 4444/-", "Jharkhand APO Mains-6999/-", "Raj APO Pre : 2999/-", "7599457405", "@VRLEXA"). NEVER turn an advertisement fee into a document heading!
10. **NATURAL READABILITY & TASTEFUL EMOJIS**: Use clean, un-bloated formatting. For major topic headings, you may include a simple, tasteful emoji (e.g. 💡 for concepts/definitions, ⚙ for mechanics/physics principles, ⏱ for speed/time, 📌 for key facts, 🌊 for river systems, 🏔 for mountain ranges) to guide the student's eye, but keep formatting natural and simple.
{ignore_clause}
Output the raw markdown for each image in the exact order they appear. If multiple images are provided, you MUST separate the markdown for each image with exactly the following text on a new line: `---PAGE_BREAK---`. Do not use JSON. Output ONLY the markdown and the page breaks.
"""
            
        if os.path.exists("config.json"):
            try:
                with open("config.json", "r", encoding="utf-8") as f:
                    config = json.load(f)
                    prompt = config.get("ai_prompt", prompt)
            except Exception:
                pass
                
        # Inject Strict Language Isolation or Multi-Language Translation (Prevent duplicate bilingual output)
        if self.language_mode and self.language_mode not in ("auto", "Auto-Detect"):
            mode_clean = self.language_mode.lower().strip()
            if any(x in mode_clean for x in ["math+hindi", "hindi+math", "math + hindi", "hindi + math"]):
                prompt += "\n\nSTRICT LANGUAGE REQUIREMENT (HINDI + MATH): The user requested HINDI + MATH. Extract all Devanagari Hindi explanations and all mathematical equations/formulas perfectly. Omit parallel English paragraphs."
            elif any(x in mode_clean for x in ["en+math", "english+math", "math+en", "english + math"]):
                prompt += "\n\nSTRICT LANGUAGE REQUIREMENT (ENGLISH + MATH): The user requested ENGLISH + MATH. Extract all English explanations and all mathematical equations/formulas perfectly. Omit parallel Hindi paragraphs."
            elif mode_clean in ("math", "only math", "math only", "math_only"):
                prompt += "\n\nSTRICT LANGUAGE REQUIREMENT: Extract ONLY mathematical equations, formulas, and numeric calculations. Omit normal narrative passages."
            elif mode_clean in ("only english", "english_only", "en", "english"):
                prompt += "\n\nSTRICT LANGUAGE REQUIREMENT (ENGLISH ONLY): The user requested ONLY ENGLISH. If the document is bilingual (English and Hindi side-by-side or separated by slashes '/'), extract ONLY the English text. DO NOT translate the parallel Hindi text into English to create duplicates! Each concept must appear only once in English. Omit Hindi text completely, EXCEPT if an image contains a mnemonic trick that only exists in Hindi, preserve the trick words."
            elif mode_clean in ("only hindi", "hindi_only", "hi", "hindi"):
                prompt += "\n\nSTRICT LANGUAGE REQUIREMENT (HINDI ONLY): The user requested ONLY HINDI. Output 100% pure Devanagari Hindi for all text, headings, and explanations. DO NOT include English parentheticals or English translations when the Hindi equivalent is already present. Omit parallel English text completely. Retain only essential mathematical equations and standard metric units (e.g. km, m/s)."
            elif mode_clean in ("bilingual", "hi-en", "both"):
                prompt += "\n\nLANGUAGE: Retain both languages cleanly formatted without squashing."
            else:
                # Generalized target language translation (Marathi, Gujarati, Bengali, Tamil, Telugu, Kannada, Malayalam, Punjabi, Urdu, Spanish, French, German)
                prompt += f"\n\nSTRICT TRANSLATION REQUIREMENT ({self.language_mode.upper()}): Translate all narrative text, explanations, and headings fluently into {self.language_mode}. CRITICAL FORMULA & CODE SHIELD: Retain 100% of mathematical equations ($...$, $$...$$), formulas, fractions, variable symbols, and code blocks completely UNTOUCHED, in original LaTeX format, and uncorrupted."
            
        if self.ignore_images:
            prompt += f"\n\nIGNORE RULE: If any image strictly matches the following description, completely ignore it and return an empty string for that index: {self.ignore_images}"
            
        if self.custom_prompt:
            prompt += f"\n\nUSER OVERRIDE INSTRUCTIONS: {self.custom_prompt}"
            
        return prompt

    async def process_images_batch(self, image_paths: List[str], batch_index: int = 1) -> Dict[int, str]:
        """
        Sends an array of images to the AI natively. Returns a dict mapping index to extracted markdown.
        Now executes asynchronously using a round-robin API key.
        """
        if not image_paths:
            return {}
            
        logger.info(f"Processing batch {batch_index} of {len(image_paths)} native images...")
        prompt = self._get_prompt()
        
        contents = [prompt]
        for img_path in image_paths:
            try:
                # Token Reduction:
                # - Full-page images: 15% reduction (scale 0.85) to preserve table text & formula clarity
                # - Targeted crops: 30% reduction (scale 0.70)
                # Keep RGB — grayscale destroys table header colors
                is_full = os.path.basename(img_path).startswith("full_")
                scale = 0.85 if is_full else 0.70
                with Image.open(img_path) as img:
                    new_width = max(1, int(img.width * scale))
                    new_height = max(1, int(img.height * scale))
                    resized_img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                    
                    img_byte_arr = io.BytesIO()
                    resized_img.save(img_byte_arr, format='JPEG', quality=80)
                    image_bytes = img_byte_arr.getvalue()
                    
                mime = "image/jpeg"
                contents.append(types.Part.from_bytes(data=image_bytes, mime_type=mime))
            except Exception as e:
                logger.error(f"Failed to read image {img_path}: {e}")
                
        max_retries = self.profile["max_retries"]
        delay = self.profile["api_delay_seconds"]
        
        for attempt in range(max_retries):
            try:
                # Add delay BEFORE request if we are on a rate-limited tier
                if delay > 0:
                    await asyncio.sleep(delay)
                    
                config = None
                
                # Fetch next round-robin key
                current_key = self.router.get_next_key()
                client = genai.Client(api_key=current_key)
                    
                # Run the synchronous generate_content in a thread to allow asyncio concurrency
                response = await asyncio.to_thread(
                    client.models.generate_content,
                    model=self.model_name,
                    contents=contents,
                    config=config
                )
                
                if response:
                    self.total_api_calls += 1
                    if hasattr(response, 'usage_metadata') and response.usage_metadata:
                        self.total_input_tokens += getattr(response.usage_metadata, 'prompt_token_count', 0) or 0
                        self.total_output_tokens += getattr(response.usage_metadata, 'candidates_token_count', 0) or 0

                if response and response.text:
                    text = response.text.strip()
                    
                    # We requested ---PAGE_BREAK--- as a delimiter
                    if len(image_paths) == 1:
                        return {0: text.replace("---PAGE_BREAK---", "").strip()}
                        
                    parts = [p.strip() for p in text.split("---PAGE_BREAK---")]
                    
                    result_dict = {}
                    for i in range(len(image_paths)):
                        if i < len(parts):
                            result_dict[i] = parts[i]
                        else:
                            result_dict[i] = "<!-- EXTRACTION TRUNCATED BY AI -->"
                            
                    return result_dict
                return {}
            except Exception as e:
                error_str = str(e).lower()
                if "429" in error_str or "quota" in error_str or "503" in error_str or "500" in error_str or "ssl" in error_str or "disconnected" in error_str:
                    wait_time = max(15, delay * (2 ** attempt)) # Exponential backoff
                    self.total_retry_delay_seconds += wait_time
                    logger.warning(f"API Limit / Network Dropout: {e}. Retrying in {wait_time}s (Attempt {attempt+1}/{max_retries})")
                    await asyncio.sleep(wait_time)
                else:
                    logger.error(f"Gemini API Error for batch: {e}")
                    return {}
                    
        logger.error(f"Failed to process image batch after max retries.")
        return {}
