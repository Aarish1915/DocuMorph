import React from 'react';

const TOOLS = [
  {
    id: 'clean_format',
    view: 'clean',
    tag: 'Erase Ads & Watermarks',
    tagColor: '#2563eb',
    tagBg: 'rgba(37, 99, 235, 0.08)',
    iconBg: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    iconColor: '#ffffff',
    title: 'Clean & Format',
    desc: 'Remove dark scan shadows, Telegram watermarks, and fix faint handwriting.',
    accent: '#2563eb',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
      </svg>
    ),
  },
  {
    id: 'compress',
    view: 'compress',
    tag: 'Save up to 60% Pages',
    tagColor: '#16a34a',
    tagBg: 'rgba(22, 163, 74, 0.08)',
    iconBg: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
    iconColor: '#ffffff',
    title: 'Compress PDF',
    desc: 'Shrink empty margins and fit more questions on fewer printed pages.',
    accent: '#16a34a',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 14h6m0 0v6m0-6L3 21" />
        <path d="M20 10h-6m0 0V4m0 6 7-7" />
      </svg>
    ),
  },
  {
    id: 'extract_text',
    view: 'extract',
    tag: 'Tables to Excel & Notion',
    tagColor: '#0284c7',
    tagBg: 'rgba(2, 132, 199, 0.08)',
    iconBg: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    iconColor: '#ffffff',
    title: 'Extract Text',
    desc: 'Turn uncopyable scan tables into clean text and spreadsheets.',
    accent: '#0284c7',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="16" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
      </svg>
    ),
  },
  {
    id: 'translate',
    view: 'translate',
    tag: '10+ Indic Languages',
    tagColor: '#ea580c',
    tagBg: 'rgba(234, 88, 12, 0.08)',
    iconBg: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
    iconColor: '#ffffff',
    title: 'Translate PDF',
    desc: 'Translate study notes into Hindi, Tamil & more with math intact.',
    accent: '#ea580c',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
];

export default function ToolDirectory({ onSelectTool }) {
  return (
    <section className="tool-directory-section" aria-label="DocuMorph Tools">
      <div className="tool-grid">
        {TOOLS.map((tool) => (
          <div
            key={tool.id}
            className="tool-card"
            style={{ '--tool-accent': tool.accent }}
            onClick={() => onSelectTool(tool.view)}
            role="button"
            tabIndex={0}
            aria-label={`Open ${tool.title}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectTool(tool.view);
              }
            }}
          >
            <div className="tool-card-top-row">
              <div className="tool-card-icon-wrap" style={{ background: tool.iconBg, color: tool.iconColor }}>
                {tool.icon}
              </div>
              <span className="tool-card-pill" style={{ color: tool.tagColor, backgroundColor: tool.tagBg }}>
                {tool.tag}
              </span>
            </div>

            <h3 className="tool-card-title">{tool.title}</h3>
            <p className="tool-card-desc">{tool.desc}</p>

            <div className="tool-card-action">
              <span>Open tool</span>
              <span className="tool-card-arrow">→</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
