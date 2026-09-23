import os
import re
import json
import logging
from typing import Dict, Any, List
import fitz
from documorph.services.base_service import BaseServiceHandler

logger = logging.getLogger("documorph.extract_text_service")

class ExtractTextServiceHandler(BaseServiceHandler):
    """
    Handles structured text extraction:
    - plain text (.txt)
    - JSON array of pages (.json)
    - formatted markdown (.md)
    """

    def process(
        self,
        doc: fitz.Document,
        config: Dict[str, Any],
        temp_dir: str,
        base_name: str,
        timestamp: int,
        processed_markdown: str = "",
        ordered_pages: List[str] = None,
        file_name: str = ""
    ) -> str:
        out_fmt = str(config.get("output_format", "markdown")).lower()

        if any(k in out_fmt for k in ["raw", "txt", "plain", "text"]):
            # 1. Strip Markdown headings
            plain_text = re.sub(r'(?m)^#+\s*', '', processed_markdown)
            # 2. Strip bold, italics, strikethroughs
            plain_text = re.sub(r'[\*_]{1,3}(.*?)[\*_]{1,3}', r'\1', plain_text)
            # 3. Strip HTML comments and tags
            plain_text = re.sub(r'<!--.*?-->', '', plain_text, flags=re.DOTALL)
            plain_text = re.sub(r'<[^>]+>', '', plain_text)
            # 4. Clean Markdown links [text](url) -> text
            plain_text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', plain_text)
            # 5. Clean Markdown table separators and pipes
            plain_text = re.sub(r'(?m)^\|(?:\s*:?-+:?\s*\|)+$', '', plain_text)
            plain_text = re.sub(r'(?m)^\|\s*', '', plain_text)
            plain_text = re.sub(r'\s*\|\s*$', '', plain_text)
            plain_text = re.sub(r'\s*\|\s*', '  |  ', plain_text)
            # 6. Normalize excessive blank lines
            plain_text = re.sub(r'\n{3,}', '\n\n', plain_text)

            txt_path = os.path.join(self.orchestrator.output_dir, f"EXTRACTED_{timestamp}_{base_name}.txt")
            with open(txt_path, "w", encoding="utf-8") as f:
                f.write(plain_text.strip())
            self.orchestrator._report("Text Extraction Complete (.txt)", 95)
            return txt_path

        elif "json" in out_fmt:
            pages_list = ordered_pages or [processed_markdown]
            json_data = {
                "file_name": file_name or f"{base_name}.pdf",
                "service_type": "extract_text",
                "total_pages": len(pages_list),
                "pages": [
                    {"page_number": idx + 1, "content": p_content}
                    for idx, p_content in enumerate(pages_list)
                ]
            }
            json_path = os.path.join(self.orchestrator.output_dir, f"EXTRACTED_{timestamp}_{base_name}.json")
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(json_data, f, indent=2, ensure_ascii=False)
            self.orchestrator._report("Text Extraction Complete (.json)", 95)
            return json_path

        else:
            md_path = os.path.join(self.orchestrator.output_dir, f"EXTRACTED_{timestamp}_{base_name}.md")
            with open(md_path, "w", encoding="utf-8") as f:
                f.write(processed_markdown.strip())
            self.orchestrator._report("Text Extraction Complete (.md)", 95)
            return md_path
