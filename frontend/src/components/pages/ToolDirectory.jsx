import React from 'react';

const TOOLS = [
  {
    id: 'clean_format',
    view: 'clean',
    iconBg: 'rgba(99, 102, 241, 0.12)',
    iconColor: '#6366f1',
    title: 'Clean & Format',
    tag: '✨ Scan Whitening',
    desc: 'Whiten grey phone scans, erase watermarks & coaching stamps, and sharpen blurred text.',
    accent: '#6366f1',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
      </svg>
    ),
  },
  {
    id: 'compress',
    view: 'compress',
    iconBg: 'rgba(16, 185, 129, 0.12)',
    iconColor: '#10b981',
    title: 'Compress & Compact',
    tag: '📉 Save 50% Paper',
    desc: 'Squeeze empty margins and loose questions to cut paper printing expenses and shrink MB size.',
    accent: '#10b981',
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
    iconBg: 'rgba(245, 158, 11, 0.12)',
    iconColor: '#f59e0b',
    title: 'Extract Text & Tables',
    tag: '📝 Markdown & JSON',
    desc: 'Copy words, tables, and questions into Word, Notion, or text editors with intact LaTeX math.',
    accent: '#f59e0b',
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
    iconBg: 'rgba(6, 182, 212, 0.12)',
    iconColor: '#06b6d4',
    title: 'Translate PDF Notes',
    tag: '🌐 14 Languages',
    desc: 'Translate notes into Hindi, Marathi & regional scripts while keeping math equations untouched.',
    accent: '#06b6d4',
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
    <section className="tool-directory-section" aria-labelledby="tools-directory-heading">
      <h2 id="tools-directory-heading" className="sr-only">Free PDF Transformation Tools</h2>
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
              <span className="tool-card-pill" style={{ background: tool.iconBg, color: tool.iconColor }}>
                {tool.tag}
              </span>
            </div>
            <h3 className="tool-card-title">{tool.title}</h3>
            <p className="tool-card-desc">{tool.desc}</p>
            <div className="tool-card-action">
              <span>Launch Studio</span>
              <svg className="tool-card-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
