import React from 'react';

export const PRESETS = [
  {
    id: 'coaching_exam',
    icon: '🎓',
    title: 'UPSC & Exam Notes',
    badge: 'Most Popular',
    badgeColor: '#1d4ed8',
    badgeBg: '#dbeafe',
    description: 'Strips coaching phone numbers, Telegram watermarks, and scan shadows. Restores Hindi & English bilingual notes into crisp A4 book pages.',
    capabilities: ['100% Watermarks Stripped', 'Hindi + English Intact', 'Clean Tables & Flowcharts'],
    serviceType: 'clean_format',
    defaultConfig: {
      clean_watermarks: true,
      fix_spacing: true,
      fix_formulas: true,
      language_mode: 'bilingual',
      page_range: 'all',
      doc_type: 'auto',
    }
  },
  {
    id: 'math_science',
    icon: '📐',
    title: 'Physics & Math Notes',
    badge: 'JEE • NEET • College',
    badgeColor: '#047857',
    badgeBg: '#d1fae5',
    description: 'Formats illegible mathematical equations into crisp LaTeX textbook notation with fraction bars. Protects formulas, graphs, and science diagrams.',
    capabilities: ['LaTeX Equations Rendered', 'Formulas & Diagrams Kept', 'High Scientific Precision'],
    serviceType: 'clean_format',
    defaultConfig: {
      clean_watermarks: true,
      fix_formulas: true,
      protect_math: true,
      language_mode: 'math',
      page_range: 'all',
      doc_type: 'auto',
    }
  },
  {
    id: 'compact_paper',
    icon: '📉',
    title: 'Compact & Save Paper',
    badge: 'Save 40–60% Pages',
    badgeColor: '#b45309',
    badgeBg: '#fef3c7',
    description: 'Condenses loose 50-page phone scans into ~18 compact A4 pages. Removes wide empty margins, repeated banners, and cuts Xerox printing cost in half.',
    capabilities: ['Cuts Print Cost by 60%', 'Zero Wasted Blank Margins', 'Compact 2-Column Format'],
    serviceType: 'compress',
    defaultConfig: {
      quality: 'balanced',
      images: 'compress',
      remove_duplicates: true,
      strip_metadata: true,
      page_range: 'all',
    }
  },
  {
    id: 'extract_text',
    icon: '📋',
    title: 'Copy to Word / Notion',
    badge: 'Editable Export',
    badgeColor: '#6d28d9',
    badgeBg: '#ede9fe',
    description: 'Extracts full text and tables into editable Markdown, plain text, or JSON so you can paste into Word, Notion, Google Docs, or study apps.',
    capabilities: ['Word & Notion Compatible', 'Tables Converted to Markdown', 'Clean Editable Text'],
    serviceType: 'extract_text',
    defaultConfig: {
      output_format: 'markdown',
      preserve_structure: true,
      clean_watermarks: true,
      fix_spacing: true,
      page_range: 'all',
    }
  }
];

export default function DocumentPresetPicker({
  activePresetId,
  onSelectPreset,
}) {
  return (
    <div className="preset-picker-section">
      <div className="preset-picker-header">
        <label className="section-step-label">Step 1: What is your primary document goal?</label>
        <span className="section-step-sub">Select a preset to auto-configure all optimal AI settings in 1 tap</span>
      </div>

      <div className="preset-cards-grid">
        {PRESETS.map((preset) => {
          const isSelected = activePresetId === preset.id;
          return (
            <div
              key={preset.id}
              className={`preset-card ${isSelected ? 'active' : ''}`}
              onClick={() => onSelectPreset(preset)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelectPreset(preset);
              }}
            >
              <div className="preset-card-top">
                <div className="preset-icon-title">
                  <span className="preset-icon">{preset.icon}</span>
                  <span className="preset-title">{preset.title}</span>
                </div>
                <span
                  className="preset-badge"
                  style={{ color: preset.badgeColor, backgroundColor: preset.badgeBg }}
                >
                  {preset.badge}
                </span>
              </div>

              <p className="preset-desc">{preset.description}</p>

              {/* Visual Capability Pills (Guides the user's mind on what DocuMorph does) */}
              <div className="preset-capabilities-row">
                {preset.capabilities.map((cap, i) => (
                  <span key={i} className="cap-pill">
                    <span className="cap-check">✓</span> {cap}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
