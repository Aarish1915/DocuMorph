import os
import time
import logging
from google import genai
from documorph.core.api_router import APIRouter

logger = logging.getLogger(__name__)

def polish_markdown(markdown_text: str) -> str:
    """
    Takes locally extracted markdown and uses Gemini to polish its formatting.
    This bridges the gap between raw local text and beautiful AI layout.
    """
    if not markdown_text.strip():
        return markdown_text
        
    router = APIRouter()
    api_key = router.get_next_key()
    
    if not api_key:
        logger.error("No API key available for format polisher.")
        # Fallback to original text if API fails
        return markdown_text
        
    client = genai.Client(api_key=api_key)
    
    prompt = """
    You are an expert educational publisher and layout editor. Your task is to format raw study notes into a clean, highly readable, printable study guide.

    STRICTEST RULES:
    1. ZERO DATA OMISSION & ZERO HALLUCINATION (CRITICAL):
       - You are a pure layout formatter, NOT a summarizer or re-writer.
       - You MUST preserve 100% of the input text, points, definitions, formulas, and examples VERBATIM.
       - NEVER delete any point, law, fact, or sentence from the notes.
       - NEVER summarize, rephrase, or condense text.
       - NEVER add extra commentary, invented rules, or fake tricks.
    2. B&W PRINT-READY & NATURAL FORMATTING:
       - Keep formatting simple, clean, and natural. Not too much bold. Only bold genuine key terms, labels, or names, not entire sentences.
       - Use clean Markdown headings (# for Document Title, ## for Main Topics, ### for Subsections).
       - Students print in black and white: keep layout crisp, high-contrast, and clean without heavy blocks.
       - You may use simple educational emojis (💡, ⚙, ⏱, 📌) on main topic headings where appropriate to guide the student's eye, but keep the layout natural and uncluttered.
    3. CLEAN VERTICAL LISTS:
       - Every bullet point must be on its own line starting with '* '. Never squash bullets into a single line or paragraph.
       - Always leave a blank line before a bullet list so it formats properly.
    4. MATH & LATEX FIDELITY:
       - Keep all LaTeX formulas ($...$ or $$...$$) completely intact.
       - Always ensure \\text{...} has valid curly braces around text (e.g. \\text{m/s}). Never output bare \\text without braces.
    5. TABLE FIDELITY:
       - If HTML <table> tags are present, keep them completely intact. If markdown tables are present, keep their columns clean.
    6. SPAM DELETION ONLY:
       - Delete coaching center promotional fees, phone numbers, and advertisement banners (e.g. "LexRise Academy", "Contact with us", "Pre : 1999/-").
       - Never turn an advertisement fee into a heading!
    7. OUTPUT:
       - Return ONLY the formatted Markdown. If multiple pages are separated by '---PAGE_BREAK---', preserve '---PAGE_BREAK---'. No conversational filler.
    """ + markdown_text

    max_retries = 3
    base_wait = 15  # seconds
    
    for attempt in range(max_retries):
        try:
            logger.info("Sending markdown to Gemini for format polishing...")
            response = client.models.generate_content(
                model='gemini-3.5-flash-lite',
                contents=prompt
            )
            return response.text
            
        except Exception as e:
            error_str = str(e).lower()
            if "429" in error_str or "quota" in error_str:
                wait_time = base_wait * (2 ** attempt)
                logger.warning(f"Rate limited (429) during polish. Retrying in {wait_time}s (Attempt {attempt+1}/{max_retries})")
                time.sleep(wait_time)
            else:
                logger.error(f"Error during format polish: {e}")
                return markdown_text
                
    logger.error("Failed to polish markdown after max retries. Returning raw text.")
    return markdown_text
