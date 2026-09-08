import React from 'react';

const TOOLS = [
  {
    id: 'clean_format',
    view: 'clean',
    iconBg: 'rgba(37, 99, 235, 0.1)',
    iconColor: '#2563eb',
    title: 'Clean & Format',
    desc: 'Erase dark shadows, Telegram ads, and watermarks.',
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
    iconBg: 'rgba(22, 163, 74, 0.1)',
    iconColor: '#16a34a',
    title: 'Compress PDF',
    desc: 'Compact margins to fit more content on fewer pages.',
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
    iconBg: 'rgba(2, 132, 199, 0.1)',
    iconColor: '#0284c7',
    title: 'Extract Text',
    desc: 'Convert scan tables into clean Markdown and text.',
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
    iconBg: 'rgba(234, 88, 12, 0.1)',
    iconColor: '#ea580c',
    title: 'Translate PDF',
    desc: 'Translate notes into Indic languages with formulas preserved.',
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
            <div className="tool-card-icon-wrap" style={{ background: tool.iconBg, color: tool.iconColor }}>
              {tool.icon}
            </div>
            <h3 className="tool-card-title">{tool.title}</h3>
            <p className="tool-card-desc">{tool.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
