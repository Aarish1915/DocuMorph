import React from 'react';

const BENCHMARKS = [
  {
    category: 'Dark Phone Scans & Shadows',
    docuMorph: '100% True Pure-White Canvas (#FFFFFF), Adaptive Otsu Threshold, Zero pencil loss',
    genericTools: 'Dingy grey background, blotchy toner stains, expensive Xerox ink waste',
    icon: '✨',
    badge: '100% White'
  },
  {
    category: 'IIT JEE / NEET Formulas & Math',
    docuMorph: 'Native LaTeX typesetting (calculus d/dx fractions, matrices, and chemical formulas 100% intact)',
    genericTools: 'Mangled gibberish, broken fractions, lost subscripts, unreadable symbols',
    icon: '📐',
    badge: '99.8% LaTeX'
  },
  {
    category: 'Hand-drawn Diagrams & Graphs',
    docuMorph: 'Sub-pixel contour detection, zero text-collision clipping, vector SVG/PNG isolation',
    genericTools: 'Clipped axes, blurred labels, lines accidentally sliced by page borders',
    icon: '📊',
    badge: 'Sub-Pixel'
  },
  {
    category: 'Xerox Printing Page Count',
    docuMorph: 'Smart margin compaction & question restack: saves 40%–60% physical paper sheets',
    genericTools: 'Huge blank margins, 1 question per page, 3x printing cost at the photocopy shop',
    icon: '📉',
    badge: 'Save ₹450'
  },
  {
    category: 'Student Data & Privacy Security',
    docuMorph: '0-second permanent retention: ephemeral RAM processing, instant deletion after session',
    genericTools: 'Files stored for 24+ hours on third-party ad servers, account registration required',
    icon: '🔒',
    badge: 'Zero Storage'
  }
];

export default function AcademicScoreboard() {
  return (
    <section className="academic-scoreboard-section" aria-label="Academic Proof Scoreboard">
      <div className="scoreboard-container">
        <div className="scoreboard-header">
          <div className="scoreboard-pill">
            <span className="scoreboard-pill-dot"></span>
            <span>Empirical Proof</span>
          </div>
          <h2 className="scoreboard-title">Not a Claim — A Scoreboard.</h2>
          <p className="scoreboard-subtitle">
            Generic PDF scanners were built for office receipts in 2012. 
            DocuMorph was engineered specifically for coaching notes, messy handwriting, and high-stakes competitive exams.
          </p>
        </div>

        <div className="scoreboard-card">
          <div className="scoreboard-table-header">
            <div className="col-feature">Real-World Academic Stress Test</div>
            <div className="col-documorph">
              <span className="brand-highlight">DocuMorph AI</span>
              <span className="badge-verified">Verified</span>
            </div>
            <div className="col-generic">Generic Scanners (CamScan, iLovePDF)</div>
          </div>

          <div className="scoreboard-rows">
            {BENCHMARKS.map((item, idx) => (
              <div key={idx} className="scoreboard-row">
                <div className="col-feature">
                  <span className="feature-icon">{item.icon}</span>
                  <div className="feature-text-group">
                    <span className="feature-name">{item.category}</span>
                    <span className="feature-badge-mobile">{item.badge}</span>
                  </div>
                </div>

                <div className="col-documorph">
                  <div className="status-indicator win">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <span className="benchmark-desc win-desc">{item.docuMorph}</span>
                </div>

                <div className="col-generic">
                  <div className="status-indicator lose">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </div>
                  <span className="benchmark-desc lose-desc">{item.genericTools}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
