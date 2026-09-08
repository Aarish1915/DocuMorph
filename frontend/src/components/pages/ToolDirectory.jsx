import React from 'react';

const TOOLS = [
  {
    id: 'clean_format',
    view: 'clean',
    icon: '✨',
    badge: '0 Ads • Crisp A4',
    badgeColor: '#1d4ed8',
    badgeBg: '#eff6ff',
    iconBg: '#dbeafe',
    title: 'Clean & Beautify',
    desc: 'Remove Telegram ads, watermarks, dark photocopy shadows & restore vector math formulas into pristine A4.',
    cta: 'Open Clean Tool →',
  },
  {
    id: 'compress',
    view: 'compress',
    icon: '📉',
    badge: 'Save 64% Paper & Xerox',
    badgeColor: '#15803d',
    badgeBg: '#f0fdf4',
    iconBg: '#dcfce7',
    title: 'Compact & Save Paper',
    desc: 'Condense loose 50-page coaching booklets into 18 dense 2-column sheets without losing a single question.',
    cta: 'Open Compactor →',
  },
  {
    id: 'extract_text',
    view: 'extract',
    icon: '📋',
    badge: 'Notion & Excel Ready',
    badgeColor: '#0369a1',
    badgeBg: '#f0f9ff',
    iconBg: '#e0f2fe',
    title: 'Copy Text & Tables',
    desc: 'Unlock uncopyable flat scan tables into structured Markdown, CSV, and JSON with 1-click clipboard copy.',
    cta: 'Open Extractor →',
  },
  {
    id: 'translate',
    view: 'translate',
    icon: '🌐',
    badge: '10+ Languages • LaTeX Safe',
    badgeColor: '#c2410c',
    badgeBg: '#fff7ed',
    iconBg: '#ffedd5',
    title: 'Translate Language',
    desc: 'Translate English study notes to Hindi, Marathi, Tamil & 10+ languages with LaTeX formulas 100% protected.',
    cta: 'Open Translator →',
  },
];

export default function ToolDirectory({ onSelectTool }) {
  return (
    <section className="tool-directory-section" aria-label="DocuMorph Tools Directory">
      <div className="tool-directory-header">
        <h2 className="tool-directory-title">Select a Specialized Tool</h2>
        <p className="tool-directory-subtitle">
          Engineered with specialized layout AI, watermark stripping, and LaTeX formula protection.
        </p>
      </div>

      <div className="tool-grid">
        {TOOLS.map((tool) => (
          <div
            key={tool.id}
            className="tool-card"
            onClick={() => onSelectTool(tool.view)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectTool(tool.view);
              }
            }}
          >
            <div>
              <div className="tool-card-icon-wrap" style={{ background: tool.iconBg }}>
                {tool.icon}
              </div>
              <span
                className="tool-card-badge"
                style={{ color: tool.badgeColor, background: tool.badgeBg }}
              >
                {tool.badge}
              </span>
              <h3 className="tool-card-title">{tool.title}</h3>
              <p className="tool-card-desc">{tool.desc}</p>
            </div>

            <div className="tool-card-cta">
              <span>{tool.cta}</span>
              <span className="tool-card-arrow">→</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
