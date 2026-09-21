import React from 'react';

const SEO_LINKS = [
  {
    category: 'Scan Whitening & Restoration',
    links: [
      { text: 'Whiten Dark Phone Scans', view: 'clean' },
      { text: 'Remove Background Shadows', view: 'clean' },
      { text: 'Convert Phone Photos to Clean A4', view: 'clean' },
      { text: 'Handwriting Contrast Enhancer', view: 'clean' }
    ]
  },
  {
    category: 'Print Cost Compaction',
    links: [
      { text: 'Squeeze Margins to Save 50% Paper', view: 'compress' },
      { text: 'Xerox Photocopy Optimizer', view: 'compress' },
      { text: 'Coaching Notes Page Reducer', view: 'compress' },
      { text: 'Dense 2-Column Question Compactor', view: 'compress' }
    ]
  },
  {
    category: 'Academic Formula & Text Extraction',
    links: [
      { text: 'Extract Math into LaTeX Equations', view: 'extract' },
      { text: 'Convert Scanned Tables to Markdown', view: 'extract' },
      { text: 'Digital Text Siphon (.txt / .md / .json)', view: 'extract' },
      { text: 'Formula-Safe Notes Scraper', view: 'extract' }
    ]
  },
  {
    category: 'Regional Exam Translation',
    links: [
      { text: 'English Notes to Hindi PDF Translation', view: 'translate' },
      { text: 'JEE / NEET Formula-Protected Translation', view: 'translate' },
      { text: 'State Board Regional Language Notes', view: 'translate' },
      { text: 'Preserve Diagrams During Translation', view: 'translate' }
    ]
  }
];

export default function PopularToolsFooter({ onNavigateView }) {
  return (
    <section className="popular-tools-section" aria-label="Popular Academic Tools Directory">
      <div className="popular-tools-container">
        <div className="popular-tools-header">
          <h3 className="popular-tools-title">Popular Academic Transformation Tools</h3>
          <p className="popular-tools-subtitle">Engineered specifically for engineering, medical, and civil service exam prep.</p>
        </div>

        <div className="popular-tools-grid">
          {SEO_LINKS.map((cat, idx) => (
            <div key={idx} className="popular-tools-column">
              <h4 className="column-title">{cat.category}</h4>
              <ul className="column-link-list">
                {cat.links.map((link, lIdx) => (
                  <li key={lIdx}>
                    <button
                      type="button"
                      className="seo-nav-link"
                      onClick={() => onNavigateView && onNavigateView(link.view)}
                    >
                      <span>{link.text}</span>
                      <svg className="seo-nav-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
