import React from 'react';

const TOOLS = [
  {
    id: 'clean_format',
    label: 'Clean & Format',
    descriptor: 'Whiten dark photocopy scans, erase shadows & beautify notes',
    icon: (
      <svg className="tool-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        <path d="M5 3v4" />
        <path d="M19 17v4" />
        <path d="M3 5h4" />
        <path d="M17 19h4" />
      </svg>
    ),
  },
  {
    id: 'compress',
    label: 'Compact PDF',
    descriptor: 'Squeeze margins & compress high-res scans to save 50%+ printing pages',
    icon: (
      <svg className="tool-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 14 10 14 10 20" />
        <polyline points="20 10 14 10 14 4" />
        <line x1="14" y1="10" x2="21" y2="3" />
        <line x1="3" y1="21" x2="10" y2="14" />
      </svg>
    ),
  },
  {
    id: 'extract_text',
    label: 'Extract Text',
    descriptor: 'Convert tables, diagram text & handwriting into pristine editable Markdown',
    icon: (
      <svg className="tool-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
      </svg>
    ),
  },
  {
    id: 'translate',
    label: 'Translate',
    descriptor: 'Translate between Hindi, English & regional languages with LaTeX math intact',
    icon: (
      <svg className="tool-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
];

export default function ToolTabs({ activeTool, onSelectTool, disabled = false }) {
  const current = TOOLS.find((t) => t.id === activeTool) || TOOLS[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <nav className="tool-tabs-wrapper" aria-label="Tool Selector">
        {TOOLS.map((tool) => {
          const isActive = tool.id === activeTool;
          return (
            <button
              key={tool.id}
              type="button"
              className={`tool-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTool(tool.id)}
              disabled={disabled}
              aria-pressed={isActive}
            >
              {tool.icon}
              <span>{tool.label}</span>
            </button>
          );
        })}
      </nav>
      <p className="tool-descriptor">{current.descriptor}</p>
    </div>
  );
}
