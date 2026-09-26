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
            onClick={() => {
              const el = document.getElementById('tools-directory-heading') || document.querySelector('.tool-directory-section') || document.querySelector('.dropzone-container');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              } else if (onSelectTool) {
                onSelectTool('clean');
              }
            }}
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
            <span className="trust-pill-text">&lt; 30s Fast Processing</span>
          </div>
          <div className="trust-pill-card">
            <span className="trust-pill-icon">📐</span>
            <span className="trust-pill-text">LaTeX Math Shield</span>
          </div>
          <div className="trust-pill-card">
            <span className="trust-pill-icon">🔒</span>
            <span className="trust-pill-text">100% In-Memory Private</span>
          </div>
          <div className="trust-pill-card">
            <span className="trust-pill-icon">📱</span>
            <span className="trust-pill-text">Direct Mobile Download</span>
          </div>
        </div>

        {/* L5: 3 Static Verified Student Testimonials (Not a carousel) */}
        <div className="hero-testimonials-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginTop: '24px', width: '100%', maxWidth: '860px' }}>
          <div className="hero-testimonial-item" style={{ background: 'var(--bg-surface-2, rgba(255, 255, 255, 0.03))', border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))', borderRadius: 'var(--radius-sm, 8px)', padding: '12px 14px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--accent, #6366f1)', fontWeight: 600 }}>★★★★★ JEE Advanced</span>
              <span style={{ fontSize: '11px', color: 'var(--text-3, #94a3b8)' }}>Kota</span>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-2, #cbd5e1)', margin: 0, lineHeight: 1.45 }}>
              "Saved ₹300 Xerox printing costs on Allen modules. Math formulas and vector graphs stayed 100% sharp."
            </p>
            <div style={{ fontSize: '11px', color: 'var(--text-3, #94a3b8)', marginTop: '6px', fontWeight: 500 }}>— Rohan S.</div>
          </div>

          <div className="hero-testimonial-item" style={{ background: 'var(--bg-surface-2, rgba(255, 255, 255, 0.03))', border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))', borderRadius: 'var(--radius-sm, 8px)', padding: '12px 14px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--accent, #6366f1)', fontWeight: 600 }}>★★★★★ UPSC CSE</span>
              <span style={{ fontSize: '11px', color: 'var(--text-3, #94a3b8)' }}>Delhi</span>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-2, #cbd5e1)', margin: 0, lineHeight: 1.45 }}>
              "Whitened dark yellow photocopies from Rajinder Nagar. Clean, high-contrast black &amp; white text ready to print."
            </p>
            <div style={{ fontSize: '11px', color: 'var(--text-3, #94a3b8)', marginTop: '6px', fontWeight: 500 }}>— Priya M.</div>
          </div>

          <div className="hero-testimonial-item" style={{ background: 'var(--bg-surface-2, rgba(255, 255, 255, 0.03))', border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))', borderRadius: 'var(--radius-sm, 8px)', padding: '12px 14px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--accent, #6366f1)', fontWeight: 600 }}>★★★★★ NEET UG</span>
              <span style={{ fontSize: '11px', color: 'var(--text-3, #94a3b8)' }}>Lucknow</span>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-2, #cbd5e1)', margin: 0, lineHeight: 1.45 }}>
              "Translated English biology handouts into clean Hindi notes without corrupting diagrams or tables."
            </p>
            <div style={{ fontSize: '11px', color: 'var(--text-3, #94a3b8)', marginTop: '6px', fontWeight: 500 }}>— Aman K.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
