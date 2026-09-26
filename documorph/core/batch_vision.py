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
from PIL import Image
import asyncio
import httpx
from dotenv import load_dotenv
load_dotenv(override=True)

from documorph.core.tier_manager import TierManager
from documorph.core.api_router import APIRouter

logger = logging.getLogger(__name__)

class BatchVisionEngine:
    """
    AI Engine: Processes multiple images natively in a single API call (Native Multi-Part Batching).
    No resolution loss. No stitching. Respects dynamic tier rate limits.
    Supports OmniRoute Multi-Provider Gateway with auto-fallback to direct Google GenAI SDK.
    """
    def __init__(
        self, 
        custom_api_key: str = None, 
        custom_prompt: str = None, 
        ignore_images: str = "",
        language_mode: str = "auto",
        service_type: str = "clean_format"
    ):
        self.tier_manager = TierManager()
        self.profile = self.tier_manager.get_profile()
        
        self.custom_prompt = custom_prompt
        self.ignore_images = ignore_images
        self.language_mode = language_mode
        self.service_type = service_type or "clean_format"
        
        self.backend = "gemini" # Currently hardcoded to gemini sdk, could be abstracted
        # Initialize APIRouter
        self.router = APIRouter()
        self.model_name = self.profile["vision_model"]
        self.total_retry_delay_seconds = 0.0
        self.total_api_calls = 0
        self.total_input_tokens = 0
        self.total_output_tokens = 0

        # OmniRoute Multi-Provider AI Gateway Protocol
        self.omniroute_url = (
            os.getenv("OMNIROUTE_URL")
            or os.getenv("OMNIROUTE_BASE_URL")
            or "http://localhost:20128/v1"
        ).rstrip("/")
        # Safe detection: only enable if explicitly set to true or if localhost:20128 is listening
        if os.getenv("OMNIROUTE_ENABLED", "").lower() in ("true", "1", "yes"):
            self.omniroute_enabled = True
        elif os.getenv("OMNIROUTE_ENABLED", "").lower() in ("false", "0", "no"):
            self.omniroute_enabled = False
        else:
            # Quick 0.2s probe to see if local OmniRoute daemon is running
            try:
                with socket.create_connection(("127.0.0.1", 20128), timeout=0.2):
                    self.omniroute_enabled = True
            except Exception:
                self.omniroute_enabled = False

        self.omniroute_model = os.getenv("OMNIROUTE_VISION_MODEL", "omniroute/auto")
        self.omniroute_text_model = os.getenv("OMNIROUTE_TEXT_MODEL", "omniroute/auto")

        logger.info(f"Initialized BatchVisionEngine with model: {self.model_name}. API Keys available: {self.router.get_total_keys()}. OmniRoute gateway: {self.omniroute_url} (active={self.omniroute_enabled})")

    def _get_prompt(self, is_full_page: bool = False) -> str:
        # Guard against frontend boolean bugs
        if self.ignore_images and self.ignore_images.lower() in ('false', 'true'):
            self.ignore_images = ''
            
        ignore_clause = f"\nCRITICAL: DO NOT extract any images matching these descriptions: {self.ignore_images}. Return an empty string for them." if self.ignore_images else ""
        
        prompt = """
You are an expert OCR and document structure AI. Your job is to extract text, tables, and math equations from the provided image(s) perfectly.

### EXTRACTION RULES:
1. **NO CODE BLOCKS FOR NORMAL TEXT**: NEVER wrap standard paragraph text, headings, or lists inside markdown code blocks (```). Normal text must be output as pure, raw text.
2. **PRESERVE LINE BREAKS**: If you see a vertical list of items (e.g. states, cities, features, river names) each on their own line, YOU MUST preserve the line breaks. DO NOT squash lists into a single paragraph. Every bullet point must be on its own line starting with '* '.
3. **STRUCTURAL HIERARCHY**: Preserve the exact natural hierarchy of the document. Use # for main topic, ## for sections, ### for subsections.
4. **TABLE FIDELITY (HTML ONLY)**: If the original image contains a structured grid, table, or comparison, YOU MUST output it using strict HTML `<table>`, `<tr>`, `<th>`, and `<td>` tags. DO NOT use markdown tables (no `|` pipes). Preserve EVERY cell and number exactly.
5. **MATH & CHEMICAL FORMULA PRECISION (CRITICAL)**:
   - For mathematical equations, use standard LaTeX notation ($...$ inline, $$...$$ display).
   - **CHEMICAL & SUBSCRIPT FIDELITY**: All chemical formulas and physics subscripts MUST use explicit LaTeX subscripts with underscores, e.g. $\text{C}_6\text{H}_{12}\text{O}_6$, $\text{H}_2\text{O}$, $\text{CO}_2$, $\text{H}_2\text{SO}_4$, $N_1, N_2, I_1, I_2, \\Phi_B, B_1, B_2, v_0, t_1$. NEVER write subscripts as normal baseline digits (DO NOT write `\text{C}6\text{H}{12}\text{O}6`, `C6H12O6`, or `\text{H}{12}`).
   - **DELIMITER BALANCE**: Always balance inline and display math delimiters symmetrically. NEVER enclose narrative text, explanatory sentences, or Devanagari/Hindi words inside `$$ ... $$` or `$...$` math blocks. Place all explanatory prose (e.g. "लेकिन परिनालिका के अंदर चुंबकीय क्षेत्र," or "इसकी तुलना $N\\Phi_B = LI$ से करने पर") OUTSIDE math delimiters as standard text paragraphs. Never nest `$ ... $` inside `$$ ... $$`. Always ensure \\text{...} has valid braces around text (e.g. $\\text{m/s}$).
6. **ZERO HALLUCINATION, ZERO COMMENTARY & ZERO OMISSION (CRITICAL)**:
   - Extract 100% of the authentic concepts, facts, names, formulas, and examples VERBATIM.
   - NEVER add meta-commentary, scene descriptions, or photo captions like "(No text found in image)" or "[Photograph depicting...]". If an image has no text, output an empty string or omit it.
   - NEVER invent fake rules, commentary, or placeholders.
   - NEVER omit legitimate study material, summary diagrams, or mnemonic tricks.
7. **MNEMONIC TRICKS ("शॉर्ट ट्रिक" / "TRICK")**:
   - If a page has a mnemonic memory trick (e.g. `ट्रिक - "यशोदा को राम सा कंगन चाहिए"`, `आम गुनाह है मैम तुसी गाओ...`, `Trick: U.P. B.J.P`), YOU MUST extract the complete trick sentence in quotation marks.
   - Below the trick, list EVERY letter mapping on its own line: `* य -> यमुना नदी`, `* शो -> सोन नदी`, `* दा -> दामोदर नदी`, etc.
   - NEVER output blank quotes `Trick - " "` or empty arrows `• →`! If a trick is written in Hindi, preserve the full Hindi text verbatim so the mnemonic makes sense.
8. **DIAGRAMS, MAPS, CIRCUITS & HAND-DRAWN SKETCHES**:
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
   - For visual scientific diagrams, physics illustrations, circuits, ray optics, mechanics setups, chemical structures, geometric drawings, or hand-drawn notebook sketches:
     Detect the visual diagram region and insert an explicit figure tag with its normalized bounding box coordinates (integers 0 to 1000) on the page image:
     `[Figure: <short description> | bbox: [ymin, xmin, ymax, xmax]]`
     at the exact sentence, question, or paragraph where that figure belongs contextually.
     CRITICAL BOUNDING BOX RULE: The bounding box `[ymin, xmin, ymax, xmax]` MUST generously enclose the ENTIRE diagram, including all sub-parts, circuit wires, AC generators, terminal connections, coil turns, arrows, labels (e.g. 'Coil 1 with N1 turns', 'Coil 2', 'AC power supply'), and captions with a comfortable buffer. NEVER clip off the top or bottom of a diagram or omit hand-drawn sketches.
   - For organic chemistry rings (benzene, cyclohexane, chair forms), skeletal structures, molecular bonds, and complex reaction mechanisms: NEVER attempt to draw them using warped ASCII dashes or unicode symbols. ALWAYS capture them as a visual diagram using `[Fi    - For comparison charts or ordered values (e.g. `SPEED IN DIFFERENT MEDIA`: `VACUUM > GAS > LIQUID > SOLID`): ALWAYS structure the data into an HTML table (`<table>` with `<th>` and `<td>`).
    - For river confluences / Panch Prayag: format as an HTML `<table>` with columns `Prayag` and `Confluence / Rivers`.
9. **SPAM & PROMOTIONAL WATERMARK DELETION (CRITICAL)**:
   - Silently DELETE all coaching center promotional banners, watermarks, fees, and contact info (e.g. "LexRise Academy", "Bihar APO Pre", "Judiciary Pre", "Foundation Batch", "UK APO F: 4444/-", "Jharkhand APO Mains-6999/-", "Raj APO Pre : 2999/-", "7599457405", "@VRLEXA", Telegram channel stickers, WhatsApp logos, QR codes).
   - NEVER create a `[Figure: ...]` tag for academy logos, publisher crests, Telegram channel stamps, phone number stickers, or watermarks. ONLY create `[Figure: ...]` tags for genuine academic/scientific diagrams.
10. **NATURAL READABILITY & TASTEFUL EMOJIS**: Use clean, un-bloated formatting. For major topic headings, you may include a simple, tasteful emoji (e.g. 💡 for concepts/definitions, ⚙ for mechanics/physics principles, ⏱ for speed/time, 📌 for key facts, 🌊 for river systems, 🏔 for mountain ranges) to guide the student's eye, but keep formatting natural and simple.
""" + (f"\n{ignore_clause}" if ignore_clause else "") + """
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
        if self.service_type == "translate":
            target_lang = self.language_mode if (self.language_mode and str(self.language_mode).lower() not in ("auto", "none", "")) else "Hindi"
            prompt += (

                f"\n\nSTRICT TRANSLATION REQUIREMENT ({target_lang.upper()}):\n"
                f"1. Translate all narrative text, explanations, headings, and questions fluently into {target_lang}.\n"
                f"2. CRITICAL FORMULA & CODE SHIELD: Retain 100% of mathematical equations ($...$, $$...$$), formulas, fractions, variable symbols, and code blocks completely UNTOUCHED, in original LaTeX format, and uncorrupted. NEVER omit passages or delete text because of language -- translate all content into {target_lang}.\n"
                f"3. DIAGRAMS & FIGURES: When an image contains a diagram, output a clean descriptive tag: `[Figure: <brief description> | bbox: [ymin, xmin, ymax, xmax]]`. DO NOT output separate multi-row glossary tables or translate single variable letters (like M, N, x, y, v), as this bloats page counts.\n"
            )
        elif self.language_mode and self.language_mode not in ("auto", "Auto-Detect"):
            mode_clean = self.language_mode.lower().strip().replace("-", " ").replace("_", " ")
            if any(x in mode_clean for x in ["math+hindi", "hindi+math", "math + hindi", "hindi + math", "hi+math", "math+hi"]):
                prompt += "\n\nSTRICT LANGUAGE REQUIREMENT (HINDI + MATH): The user requested HINDI + MATH. Extract all Devanagari Hindi explanations and all mathematical equations/formulas perfectly. Omit parallel English paragraphs."
            elif any(x in mode_clean for x in ["en+math", "english+math", "math+en", "english + math"]):
                prompt += "\n\nSTRICT LANGUAGE REQUIREMENT (ENGLISH + MATH): The user requested ENGLISH + MATH. Extract all English explanations and all mathematical equations/formulas perfectly. Omit parallel Hindi paragraphs."
            elif mode_clean in ("math", "only math", "math only"):
                prompt += "\n\nSTRICT LANGUAGE REQUIREMENT: Extract ONLY mathematical equations, formulas, and numeric calculations. Omit normal narrative passages."
            elif mode_clean in ("only english", "english only", "en", "english"):
                prompt += "\n\nSTRICT LANGUAGE REQUIREMENT (ENGLISH ONLY): The user requested ONLY ENGLISH. If the document is bilingual (English and Hindi side-by-side or separated by slashes '/'), extract ONLY the English text. DO NOT translate the parallel Hindi text into English to create duplicates! Each concept must appear only once in English. Omit Hindi text completely, EXCEPT if an image contains a mnemonic trick that only exists in Hindi, preserve the trick words."
            elif mode_clean in ("only hindi", "hindi only", "hi", "hindi"):
                prompt += "\n\nSTRICT LANGUAGE REQUIREMENT (HINDI ONLY): The user requested ONLY HINDI. Output 100% pure Devanagari Hindi for all text, headings, and explanations. DO NOT include English parentheticals or English translations when the Hindi equivalent is already present. Omit parallel English text completely. Retain only essential mathematical equations and standard metric units (e.g. km, m/s)."
            elif mode_clean in ("bilingual", "hi en", "both"):
                prompt += "\n\nLANGUAGE: Retain both languages cleanly formatted without squashing."
            else:
                # Generalized target language translation (Marathi, Gujarati, Bengali, Tamil, Telugu, Kannada, Malayalam, Punjabi, Urdu, Spanish, French, German)
                prompt += f"\n\nSTRICT TRANSLATION REQUIREMENT ({self.language_mode.upper()}): Translate all narrative text, explanations, and headings fluently into {self.language_mode}. CRITICAL FORMULA & CODE SHIELD: Retain 100% of mathematical equations ($...$, $$...$$), formulas, fractions, variable symbols, and code blocks completely UNTOUCHED, in original LaTeX format, and uncorrupted."
            
        if self.ignore_images:
            prompt += f"\n\nIGNORE RULE: If any image strictly matches the following description, completely ignore it and return an empty string for that index: {self.ignore_images}"
            
        if self.custom_prompt:
            prompt += f"\n\nUSER OVERRIDE INSTRUCTIONS: {self.custom_prompt}"
            
        return prompt

    async def _call_omniroute_vision(self, image_paths: List[str], prompt: str) -> Optional[str]:
        """
        Dispatches multi-image vision extraction to the local OmniRoute AI gateway
        (http://localhost:20128/v1/chat/completions) with quota-aware routing across
        359 providers / 150+ free tiers.
        """
        if not self.omniroute_enabled:
            return None

        try:
            # Build OpenAI-standard vision content payload
            content_list = [{"type": "text", "text": prompt}]
            for img_path in image_paths:
                try:
                    with open(img_path, "rb") as f:
                        b64_data = base64.b64encode(f.read()).decode("utf-8")
                    ext = Path(img_path).suffix.lower().lstrip(".")
                    mime = "image/jpeg" if ext in ("jpg", "jpeg") else ("image/png" if ext == "png" else "image/webp")
                    content_list.append({
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime};base64,{b64_data}",
                            "detail": "high"
                        }
                    })
                except Exception as read_err:
                    logger.warning(f"Could not read image for OmniRoute payload: {img_path}: {read_err}")

            payload = {
                "model": self.omniroute_model,
                "messages": [
                    {"role": "user", "content": content_list}
                ],
                "temperature": 0.1,
                "max_tokens": 8192
            }
            api_key = os.getenv("OMNIROUTE_API_KEY", "sk-omniroute")
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}"
            }

            timeout = httpx.Timeout(connect=2.0, read=45.0, write=10.0, pool=2.0)
            async with httpx.AsyncClient(timeout=timeout) as client:
                res = await client.post(
                    f"{self.omniroute_url}/chat/completions",
                    json=payload,
                    headers=headers
                )
                if res.status_code == 200:
                    data = res.json()
                    choices = data.get("choices", [])
                    if choices and "message" in choices[0]:
                        msg_content = choices[0]["message"].get("content", "")
                        if msg_content and msg_content.strip():
                            logger.info(f"OmniRoute Vision Gateway extracted {len(image_paths)} images successfully via model: {data.get('model', self.omniroute_model)}")
                            self.total_api_calls += 1
                            return msg_content.strip()
                else:
                    logger.warning(f"OmniRoute gateway returned HTTP {res.status_code}: {res.text[:200]}")
        except Exception as e:
            self.omniroute_enabled = False
            logger.info(f"OmniRoute Vision Gateway offline/unreachable ({e}). Automatically switching to Google GenAI SDK...")
        return None

    async def _call_omniroute_text(self, prompt: str) -> Optional[str]:
        """
        Dispatches direct text prompt to local OmniRoute AI gateway with multi-provider fallback.
        """
        if not self.omniroute_enabled:
            return None

        try:
            payload = {
                "model": self.omniroute_text_model,
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.1,
                "max_tokens": 8192
            }
            api_key = os.getenv("OMNIROUTE_API_KEY", "sk-omniroute")
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}"
            }
            timeout = httpx.Timeout(connect=2.0, read=30.0, write=10.0, pool=2.0)
            async with httpx.AsyncClient(timeout=timeout) as client:
                res = await client.post(
                    f"{self.omniroute_url}/chat/completions",
                    json=payload,
                    headers=headers
                )
                if res.status_code == 200:
                    data = res.json()
                    choices = data.get("choices", [])
                    if choices and "message" in choices[0]:
                        content = choices[0]["message"].get("content", "")
                        if content and content.strip():
                            logger.info(f"OmniRoute Text Gateway returned completion via model: {data.get('model', self.omniroute_text_model)}")
                            return content.strip()
        except Exception as e:
            self.omniroute_enabled = False
            logger.info(f"OmniRoute Text Gateway offline ({e}). Switching to Google GenAI SDK...")
        return None

    async def process_images_batch(self, image_paths: List[str], batch_index: int = 1) -> Dict[int, str]:
        """
        Sends an array of images to the AI natively. Returns a dict mapping index to extracted markdown.
        Now executes asynchronously using a round-robin API key.
        Supports OmniRoute multi-provider gateway with auto-fallback to Google GenAI SDK.
        """
        if not image_paths:
            return {}
            
        logger.info(f"Processing batch {batch_index} of {len(image_paths)} native images...")
        prompt = self._get_prompt()

        # Try OmniRoute Multi-Provider Gateway first (if running/enabled)
        if self.omniroute_enabled:
            omni_text = await self._call_omniroute_vision(image_paths, prompt)
            if omni_text:
                if len(image_paths) == 1:
                    return {0: omni_text.replace("---PAGE_BREAK---", "").strip()}
                parts = [p.strip() for p in omni_text.split("---PAGE_BREAK---")]
                result_dict = {}
                for i in range(len(image_paths)):
                    if i < len(parts):
                        result_dict[i] = parts[i]
                    else:
                        result_dict[i] = "<!-- EXTRACTION TRUNCATED BY AI -->"
                return result_dict
        
        contents = [prompt]
        for img_path in image_paths:
            try:
                # Open with PIL directly - google-genai supports PIL Image natively with zero SSL socket EOF drops
                img = Image.open(img_path)
                # High-res clamp to max 1400px width: preserves formula sub-pixel clarity while slashing prefill latency
                max_w = 1400
                if img.width > max_w:
                    ratio = max_w / float(img.width)
                    new_h = int(img.height * ratio)
                    img = img.resize((max_w, new_h), Image.Resampling.BILINEAR)
                contents.append(img)
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
                rate_wait = self.router.get_rate_wait_seconds(current_key)
                if rate_wait > 0:
                    logger.info(f"RateLimitShield: Pacing request for {rate_wait:.2f}s (async)...")
                    await asyncio.sleep(rate_wait)
                client = genai.Client(api_key=current_key)
                
                # Authoritative current Gemini models in 2026
                candidate_models = ["gemini-3.6-flash", "gemini-2.5-flash"]
                if self.model_name and self.model_name not in candidate_models:
                    candidate_models.insert(0, self.model_name)

                seen_models = set()
                response = None
                
                for candidate in candidate_models:
                    if not candidate or candidate in seen_models:
                        continue
                    seen_models.add(candidate)
                    try:
                        response = await asyncio.to_thread(
                            client.models.generate_content,
                            model=candidate,
                            contents=contents,
                            config=config
                        )
                        if response:
                            break
                    except Exception as model_err:
                        err_text = str(model_err).lower()
                        if "404" in err_text or "not found" in err_text or "not available" in err_text or "400" in err_text:
                            logger.warning(f"Model '{candidate}' unavailable ({model_err}). Falling back to next candidate...")
                            continue
                        else:
                            raise model_err
                
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
                    wait_time = max(2.0, delay * (2 ** attempt)) # Rapid exponential retry (2s, 4s) instead of 15s freeze
                    self.total_retry_delay_seconds += wait_time
                    logger.warning(f"API Limit / Network Dropout: {e}. Retrying in {wait_time}s (Attempt {attempt+1}/{max_retries})")
                    await asyncio.sleep(wait_time)
                else:
                    logger.error(f"Gemini API Error for batch: {e}")
                    return {}
                    
        logger.error(f"Failed to process image batch after max retries.")
        return {}

    async def translate_text_direct(self, text: str, target_lang: str = "Hindi") -> str:
        """
        Translates raw digital text directly using text models.
        Preserves LaTeX math, skips image rasterization, and executes in <1s with minimal memory.
        """
        if not text or not text.strip():
            return ""

        prompt = (
            f"You are an academic textbook and notes translator.\n"
            f"STRICT TRANSLATION REQUIREMENT ({target_lang.upper()}):\n"
            f"1. Translate all narrative text, explanations, headings, questions, and examples fluently into {target_lang}.\n"
            f"2. CRITICAL FORMULA & CODE SHIELD: Retain 100% of mathematical equations ($...$, $$...$$), formulas, fractions, variable symbols, units, and code blocks completely UNTOUCHED, in original LaTeX format.\n"
            f"3. Return ONLY the translated Markdown. Do not include conversational greetings or explanations.\n\n"
            f"Source Text:\n{text}"
        )

        if self.omniroute_enabled:
            omni_translated = await self._call_omniroute_text(prompt)
            if omni_translated:
                return omni_translated

        current_key = self.router.get_next_key()
        rate_wait = self.router.get_rate_wait_seconds(current_key)
        if rate_wait > 0:
            await asyncio.sleep(rate_wait)
        client = genai.Client(api_key=current_key)
        candidate_models = [self.model_name, "gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-3.5-flash"]
        for candidate in candidate_models:
            if not candidate:
                continue
            try:
                response = await asyncio.to_thread(
                    client.models.generate_content,
                    model=candidate,
                    contents=prompt
                )
                if response and response.text:
                    return response.text.strip()
            except Exception as e:
                logger.warning(f"translate_text_direct error with {candidate}: {e}")
                continue
        return text
