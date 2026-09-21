import React from 'react';

export default function HeroSection({ onSelectTool }) {
  return (
    <section className="hero-section">
      <div className="hero-ambient-glow" aria-hidden="true" />
      <div className="hero-headline-group">
        <div className="hero-pill-badge" role="status">
          <span className="hero-live-dot" />
          <span className="hero-badge-text">AI Academic Studio • 100% Math &amp; Diagram Safe</span>
        </div>
        
        <h1 className="hero-title">
          Transform messy study notes into <span className="title-gradient">clean, printable PDFs</span>
        </h1>
        
        <p className="hero-description">
          Whiten dark photocopy scans, squeeze out wasted margins to save up to 50% on print sheets, and translate notes into Hindi — with zero LaTeX formulas lost.
        </p>

        {/* Hero Interactive CTAs */}
        <div className="hero-actions-row">
          <button
            type="button"
            className="hero-primary-cta"
            onClick={() => onSelectTool ? onSelectTool('clean') : (window.location.hash = 'clean')}
          >
            <span className="hero-cta-icon">✨</span>
            <span className="hero-cta-label">Clean Your Notes Free</span>
            <span className="hero-cta-pill">No Sign-up</span>
          </button>
          
          <button
            type="button"
            className="hero-secondary-cta"
            onClick={() => {
              const el = document.getElementById('tools-directory-heading') || document.querySelector('.tool-directory-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <span>⚡ View All 4 AI Tools</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M7 13l5 5 5-5M12 4v14" />
            </svg>
          </button>
        </div>

        <div className="hero-trust-grid">
          <div className="trust-pill-card">
            <span className="trust-pill-icon">⚡</span>
            <span className="trust-pill-text">5-Second Fast Test</span>
          </div>
          <div className="trust-pill-card">
            <span className="trust-pill-icon">📐</span>
            <span className="trust-pill-text">LaTeX Math Shield</span>
          </div>
          <div className="trust-pill-card">
            <span className="trust-pill-icon">🔒</span>
            <span className="trust-pill-text">100% Ephemeral &amp; Private</span>
          </div>
          <div className="trust-pill-card">
            <span className="trust-pill-icon">📱</span>
            <span className="trust-pill-text">Direct Mobile Download</span>
          </div>
        </div>
      </div>
    </section>
  );
}
