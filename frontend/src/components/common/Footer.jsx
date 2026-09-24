import React from 'react';

export default function Footer({ onNavigateView, onOpenDonation, onSelectTool }) {
  const handleNav = (view, e) => {
    if (e) e.preventDefault();
    onNavigateView(view);
  };

  const handleToolClick = (toolId, e) => {
    if (e) e.preventDefault();
    if (onSelectTool) {
      onSelectTool(toolId);
    } else {
      onNavigateView('home');
    }
  };

  const scrollToSection = (sectionId, e) => {
    if (e) e.preventDefault();
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      onNavigateView('home');
      setTimeout(() => {
        const target = document.getElementById(sectionId);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <footer className="site-footer">
      <div className="footer-top-grid">
        {/* Brand & Privacy Mission */}
        <div className="footer-col footer-col-brand">
          <div className="footer-brand-header">
            <div className="footer-brand-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <path d="m10 13-2 2 2 2" />
                <path d="m14 17 2-2-2-2" />
              </svg>
            </div>
            <span className="footer-brand-name">DocuMorph AI</span>
            <span className="footer-brand-badge">STUDENT FREE</span>
          </div>

          <p className="footer-brand-desc">
            Empowering JEE, NEET, UPSC, GATE and college aspirants with zero-retention document restoration. Whiten dark Xerox scans, compress pages, and protect LaTeX formulas.
          </p>

          <div className="footer-trust-pill">
            <span className="trust-pill-dot" />
            <span>100% In-Memory • DPDP Act 2023 &amp; GDPR Compliant</span>
          </div>
        </div>

        {/* Academic Tools Column */}
        <div className="footer-col">
          <h4 className="footer-col-title">Academic Tools</h4>
          <ul className="footer-links-list">
            <li>
              <a href="#clean" onClick={(e) => handleToolClick('clean_format', e)}>
                ✨ Clean &amp; Format Notes
              </a>
            </li>
            <li>
              <a href="#compress" onClick={(e) => handleToolClick('compress', e)}>
                📦 Space Compaction (Save Xerox)
              </a>
            </li>
            <li>
              <a href="#extract" onClick={(e) => handleToolClick('extract_text', e)}>
                📝 Extract Text to Markdown
              </a>
            </li>
            <li>
              <a href="#translate" onClick={(e) => handleToolClick('translate', e)}>
                🌐 Exam Prose Translation
              </a>
            </li>
          </ul>
        </div>

        {/* Empirical Proof Column */}
        <div className="footer-col">
          <h4 className="footer-col-title">Proof &amp; Reviews</h4>
          <ul className="footer-links-list">
            <li>
              <a href="#scoreboard" onClick={(e) => scrollToSection('scoreboard', e)}>
                🏆 Empirical Proof Scoreboard
              </a>
            </li>
            <li>
              <a href="#how-it-works" onClick={(e) => scrollToSection('how-it-works', e)}>
                🧠 The 3-Pass AI Engine
              </a>
            </li>
            <li>
              <a href="#testimonials" onClick={(e) => scrollToSection('testimonials', e)}>
                ✍️ Verified Aspirant Reviews
              </a>
            </li>
            <li>
              <a href="#community" onClick={(e) => handleNav('community', e)}>
                ⭐ Wall of Fame &amp; Patrons
              </a>
            </li>
          </ul>
        </div>

        {/* Legal & Fuel Column */}
        <div className="footer-col">
          <h4 className="footer-col-title">Support &amp; Legal</h4>
          <ul className="footer-links-list">
            <li>
              <a href="#faq" onClick={(e) => handleNav('faq', e)}>
                💡 Frequently Asked Questions
              </a>
            </li>
            <li>
              <a href="#privacy" onClick={(e) => handleNav('privacy', e)}>
                🔒 Privacy &amp; Zero-Storage Policy
              </a>
            </li>
            <li>
              <a href="#terms" onClick={(e) => handleNav('terms', e)}>
                📜 Fair Use &amp; Terms (Sec 52)
              </a>
            </li>
            <li style={{ marginTop: '6px' }}>
              <button
                type="button"
                className="btn-footer-fuel"
                onClick={onOpenDonation}
                title="Fuel Server Costs"
              >
                <span>☕</span>
                <span>Fuel Server (₹20)</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom-bar">
        <div className="footer-status-indicator">
          <span className="status-indicator-dot live" />
          <span>Edge OCR Nodes Active • Sub-3s Inference</span>
        </div>

        <div className="footer-copyright">
          <span>© 2026 DocuMorph AI • Free &amp; Open for All Indian Students</span>
        </div>

        <button
          type="button"
          className="btn-footer-backtotop"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Scroll back to top"
        >
          <span>↑ Back to top</span>
        </button>
      </div>
    </footer>
  );
}
