"""
Pluggable local extraction strategies for DocuMorph.
Each function takes a fitz.Page and returns a Markdown string.

The 'smart' engine is the production-quality extractor that uses font metadata
to produce structured Markdown with headings, bold, tables, and section breaks.
"""
import fitz
import logging
import re
from collections import defaultdict

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Engine: "blocks" — the original flat-text extractor (legacy/fallback)
# ---------------------------------------------------------------------------
def extract_with_blocks(page: fitz.Page) -> str:
    """The stable original method. 0 API calls. Ignores images."""
    blocks = page.get_text("blocks")
    block_text_list = []
    for b in blocks:
        if b[6] == 0:  # 0 means text block
            block_text_list.append(b[4].strip())
    return "\n\n".join(block_text_list)


# ---------------------------------------------------------------------------
# Engine: "pymupdf4llm" — experimental markdown extraction
# ---------------------------------------------------------------------------
def extract_with_pymupdf4llm(page: fitz.Page) -> str:
    """The experimental markdown extraction method."""
    try:
        import pymupdf4llm
        doc = page.parent
        return pymupdf4llm.to_markdown(doc, pages=[page.number], write_images=False)
    except Exception as e:
        logger.error(f"pymupdf4llm failed: {e}")
        return extract_with_blocks(page)


# ---------------------------------------------------------------------------
# Engine: "smart" — production-quality structured extraction
# ---------------------------------------------------------------------------

def _collect_spans(page: fitz.Page):
    """Extract all text spans with metadata from the page dict."""
    page_dict = page.get_text("dict")
    blocks = page_dict.get("blocks", [])
    all_spans = []
    
    for block in blocks:
        if block.get("type") != 0:  # Skip image blocks
            continue
        block_bbox = block.get("bbox", (0, 0, 0, 0))
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                text = span.get("text", "")
                if not text.strip():
                    continue
                
                # Filter out garbled text from Identity-H encoded fonts.
                # These fonts produce replacement chars (U+FFFD) or sequences
                # of non-printable chars that render as "?????" in output.
                # If >50% of non-space chars are non-printable or replacement,
                # skip the span entirely.
                stripped = text.strip()
                if stripped:
                    readable = sum(1 for c in stripped if c.isprintable() and ord(c) > 31 and ord(c) != 0xFFFD)
                    if readable / len(stripped) < 0.4:
                        continue
                
                all_spans.append({
                    "text": text,
                    "size": span.get("size", 11.0),
                    "flags": span.get("flags", 0),
                    "bold": bool(span.get("flags", 0) & 16),
                    "bbox": span.get("bbox", (0, 0, 0, 0)),
                    "block_bbox": block_bbox,
                    "font": span.get("font", ""),
                })
    return all_spans


def _compute_body_size(spans):
    """Find the most common font size (body text size)."""
    if not spans:
        return 11.0
    size_counts = defaultdict(int)
    for s in spans:
        # Round to 0.5pt to group similar sizes
        rounded = round(s["size"] * 2) / 2
        size_counts[rounded] += len(s["text"].strip())
    # Body size = the size used for the most characters
    return max(size_counts, key=size_counts.get)


def _is_spam_block(spans_in_block, body_size):
    """
    Detect advertising/watermark blocks.
    Spam blocks are typically much larger than body text and contain
    commercial keywords like prices, phone numbers, batch names.
    """
    if not spans_in_block:
        return False
    
    avg_size = sum(s["size"] for s in spans_in_block) / len(spans_in_block)
    combined_text = " ".join(s["text"] for s in spans_in_block)
    
    # Very small text at page edges (page numbers, headers) — skip
    if avg_size < body_size * 0.6:
        return True
    
    # Oversized text with commercial patterns
    if avg_size > body_size * 1.3:
        spam_patterns = [
            r"(?i)APO\s*(F|Pre|Mains|P\+M)",
            r"(?i)contact with us",
            r"(?i)\d{10}",  # Phone numbers
            r"(?i)(Jharkhand|Bihar|UK|Raj)\s*APO",
            r"(?i)\d+/?-",  # Prices like 4444/-
            r"(?i)Academy",
            r"(?i)FREE.*CLASS",
        ]
        for pat in spam_patterns:
            if re.search(pat, combined_text):
                return True
    
    return False


def _detect_table_from_coords(spans, body_size, page_width):
    """
    Detect if a group of same-Y spans form a table by checking
    if there are consistent column positions (X-coordinate clusters).
    
    Returns: (is_table, table_rows) where table_rows is a list of
    lists of cell texts, or (False, None).
    """
    if len(spans) < 4:
        return False, None
    
    # Filter to body-sized spans only
    body_spans = [s for s in spans if abs(s["size"] - body_size) < 2.0]
    if len(body_spans) < 4:
        return False, None
    
    # Group spans by Y coordinate (tolerance: body_size * 1.8 for same row)
    y_tolerance = max(15, body_size * 1.8)
    rows_by_y = defaultdict(list)
    for s in body_spans:
        y_center = (s["bbox"][1] + s["bbox"][3]) / 2
        # Find existing Y-cluster or create new one
        matched = False
        for existing_y in list(rows_by_y.keys()):
            if abs(y_center - existing_y) < y_tolerance:
                rows_by_y[existing_y].append(s)
                matched = True
                break
        if not matched:
            rows_by_y[y_center].append(s)
    
    # A table needs at least 3 rows
    if len(rows_by_y) < 3:
        return False, None
    
    # Detect column boundaries: find distinct X-position clusters
    all_x_starts = [s["bbox"][0] for s in body_spans]
    x_clusters = _cluster_values(all_x_starts, tolerance=50)
    
    # A table needs at least 2 columns
    if len(x_clusters) < 2:
        return False, None
    
    # Check consistency: at least 60% of rows must have spans in 2+ columns
    multi_col_rows = 0
    for y_key in sorted(rows_by_y.keys()):
        row_spans = rows_by_y[y_key]
        row_x_clusters = set()
        for s in row_spans:
            for ci, cx in enumerate(x_clusters):
                if abs(s["bbox"][0] - cx) < 50:
                    row_x_clusters.add(ci)
                    break
        if len(row_x_clusters) >= 2:
            multi_col_rows += 1
    
    if multi_col_rows / len(rows_by_y) < 0.5:
        return False, None
    
    # Build the table: sort columns, then fill cells
    x_clusters.sort()
    table_rows = []
    for y_key in sorted(rows_by_y.keys()):
        row_spans = rows_by_y[y_key]
        cells = [""] * len(x_clusters)
        for s in row_spans:
            # Find which column this span belongs to
            best_col = 0
            best_dist = float("inf")
            for ci, cx in enumerate(x_clusters):
                dist = abs(s["bbox"][0] - cx)
                if dist < best_dist:
                    best_dist = dist
                    best_col = ci
            # Append text to cell (handles multi-span cells)
            cell_text = s["text"].strip()
            if cells[best_col]:
                cells[best_col] += " " + cell_text
            else:
                cells[best_col] = cell_text
        
        # Skip completely empty rows
        if any(c.strip() for c in cells):
            table_rows.append(cells)
    
    if len(table_rows) < 3:
        return False, None
        
    # Check for MCQ false positive: if the first column looks like (a), (b), 1.
    mcq_pattern = re.compile(r'^\s*(\([a-e]\)|[a-e]\)|\d+\.)', re.IGNORECASE)
    mcq_matches = 0
    for row in table_rows:
        # Find first non-empty cell in row
        first_cell = next((c for c in row if c.strip()), "")
        if first_cell and mcq_pattern.match(first_cell):
            mcq_matches += 1
            
    # If 2 or more rows look like MCQ options, reject table classification
    if mcq_matches >= 2:
        return False, None
    
    return True, table_rows


def _cluster_values(values, tolerance=50):
    """Cluster numeric values within tolerance. Returns cluster centers."""
    if not values:
        return []
    sorted_vals = sorted(set(values))
    clusters = [[sorted_vals[0]]]
    for v in sorted_vals[1:]:
        if v - clusters[-1][-1] < tolerance:
            clusters[-1].append(v)
        else:
            clusters.append([v])
    return [sum(c) / len(c) for c in clusters]


def _format_table_markdown(table_rows):
    """Convert table rows into Markdown table format."""
    if not table_rows:
        return ""
    
    num_cols = max(len(row) for row in table_rows)
    # Pad rows to same column count
    for row in table_rows:
        while len(row) < num_cols:
            row.append("")
    
    lines = []
    # Header row
    header = table_rows[0]
    lines.append("| " + " | ".join(header) + " |")
    lines.append("| " + " | ".join(["---"] * num_cols) + " |")
    # Data rows
    for row in table_rows[1:]:
        lines.append("| " + " | ".join(row) + " |")
    
    return "\n".join(lines)


def extract_with_smart(page: fitz.Page) -> str:
    """
    Production-quality extractor using font metadata for structure.
    Produces proper Markdown with headings, bold, tables, and section breaks.
    """
    all_spans = _collect_spans(page)
    if not all_spans:
        return ""
    
    body_size = _compute_body_size(all_spans)
    page_width = page.rect.width
    
    # Group spans by block (using block_bbox as key)
    block_groups = defaultdict(list)
    for s in all_spans:
        block_key = tuple(round(x) for x in s["block_bbox"])
        block_groups[block_key].append(s)
    
    # Sort blocks by Y position (top to bottom)
    sorted_blocks = sorted(block_groups.items(), key=lambda x: x[0][1])
    
    markdown_parts = []
    
    # To detect tables, we buffer contiguous body-sized blocks
    # When we hit a heading, a large gap, or the end of the page, we check the buffer for a table.
    table_buffer_spans = []
    table_buffer_blocks = []
    
    def flush_table_buffer():
        nonlocal table_buffer_spans, table_buffer_blocks, markdown_parts
        if not table_buffer_spans:
            return
        
        is_table, table_rows = _detect_table_from_coords(table_buffer_spans, body_size, page_width)
        if is_table:
            markdown_parts.append("\n" + _format_table_markdown(table_rows) + "\n")
        else:
            # Not a table, just output as regular paragraphs
            for b_spans in table_buffer_blocks:
                markdown_parts.append(_format_block_as_paragraph(b_spans, body_size))
        
        table_buffer_spans = []
        table_buffer_blocks = []

    def _format_block_as_paragraph(spans_in_block, body_size):
        formatted = ""
        for s in spans_in_block:
            text = s["text"]
            if s["bold"] and text.strip() and s["size"] >= body_size * 0.9:
                formatted += f"**{text.strip()}** "
            else:
                formatted += text
        return formatted.strip()

    prev_block_bottom = 0
    
    for block_key, spans_in_block in sorted_blocks:
        block_y_top = block_key[1]
        block_y_bottom = block_key[3]
        
        # Skip spam/advertising blocks
        if _is_spam_block(spans_in_block, body_size):
            continue
        
        # Detect section break: large vertical gap between blocks
        gap = block_y_top - prev_block_bottom
        if prev_block_bottom > 0 and gap > body_size * 2.5:
            flush_table_buffer()
            markdown_parts.append("\n---\n")
        
        # Determine block type based on font properties
        avg_size = sum(s["size"] for s in spans_in_block) / len(spans_in_block)
        all_bold = all(s["bold"] for s in spans_in_block)
        combined_text = "".join(s["text"] for s in spans_in_block).strip()
        
        if not combined_text:
            prev_block_bottom = block_y_bottom
            continue
        
        # Classify: Heading 1, Heading 2, or Body
        is_heading = False
        if avg_size >= body_size * 1.5 and len(combined_text) < 100:
            flush_table_buffer()
            markdown_parts.append(f"\n# {combined_text}\n")
            is_heading = True
        elif avg_size >= body_size * 1.2 and len(combined_text) < 120:
            flush_table_buffer()
            markdown_parts.append(f"\n## {combined_text}\n")
            is_heading = True
        elif all_bold and len(combined_text) < 80 and avg_size >= body_size:
            flush_table_buffer()
            markdown_parts.append(f"\n### {combined_text}\n")
            is_heading = True
        
        if not is_heading:
            # Accumulate in table buffer
            table_buffer_spans.extend(spans_in_block)
            table_buffer_blocks.append(spans_in_block)
        
        prev_block_bottom = block_y_bottom
    
    # Flush remaining
    flush_table_buffer()
    
    result = "\n\n".join(part for part in markdown_parts if part.strip())
    
    # Clean up excessive whitespace
    result = re.sub(r'\n{3,}', '\n\n', result)
    
    return result.strip()

# Legacy alias
extract_with_dict = extract_with_smart


EXTRACTORS = {
    "blocks": extract_with_blocks,
    "pymupdf4llm": extract_with_pymupdf4llm,
    "dict": extract_with_dict,
    "smart": extract_with_smart,
}
