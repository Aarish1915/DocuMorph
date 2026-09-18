import React from 'react';

export default function TermsPage({ onNavigateHome }) {
  return (
    <div className="tool-page-container" style={{ maxWidth: '840px', margin: '0 auto', padding: '32px 16px' }}>
      {/* Top back navigation */}
      <nav aria-label="Breadcrumb" className="tool-page-breadcrumb">
        <button
          type="button"
          onClick={onNavigateHome}
          className="breadcrumb-back-btn"
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>Back to All Tools</span>
        </button>
        <span className="breadcrumb-separator" aria-hidden="true">/</span>
        <span className="breadcrumb-current" aria-current="page">Terms of Service</span>
      </nav>

      <div style={{ textAlign: 'center', margin: '24px 0 36px 0' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>
          <span>📜</span>
          <span>Simple Rules for Everyone</span>
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 10px 0', color: 'var(--text-main)' }}>
          Terms of Service: How DocuMorph Works
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto', lineHeight: '1.6' }}>
          Here is how we work together, written so anyone can understand it in two minutes:
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: 'var(--surface-card, #ffffff)', border: '1.5px solid var(--border-default, #e2e8f0)', borderRadius: '14px', padding: '20px' }}>
          <div style={{ fontSize: '28px', marginBottom: '10px' }}>🎓</div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-main)' }}>
            1. Free for Students and Teachers
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
            DocuMorph is free to help students, teachers, and exam candidates clean up dark scans, shrink large files for WhatsApp, and translate study guides.
          </p>
        </div>

        <div style={{ background: 'var(--surface-card, #ffffff)', border: '1.5px solid var(--border-default, #e2e8f0)', borderRadius: '14px', padding: '20px' }}>
          <div style={{ fontSize: '28px', marginBottom: '10px' }}>✍️</div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-main)' }}>
            2. You Own 100% of Your Work
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
            Everything you upload, and all the cleaned or translated versions, belong to you. We claim zero rights or ownership over your notes, research, or homework.
          </p>
        </div>

        <div style={{ background: 'var(--surface-card, #ffffff)', border: '1.5px solid var(--border-default, #e2e8f0)', borderRadius: '14px', padding: '20px' }}>
          <div style={{ fontSize: '28px', marginBottom: '10px' }}>🤝</div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-main)' }}>
            3. Fair &amp; Respectful Use
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
            Please use DocuMorph for genuine study and work documents. Do not upload viruses, harmful software, or illegal files.
          </p>
        </div>

        <div style={{ background: 'var(--surface-card, #ffffff)', border: '1.5px solid var(--border-default, #e2e8f0)', borderRadius: '14px', padding: '20px' }}>
          <div style={{ fontSize: '28px', marginBottom: '10px' }}>📌</div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-main)' }}>
            4. Double-Check Your Critical Notes
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
            We work very hard to keep your math formulas, physics symbols, and translations accurate. However, always review your notes before taking an important exam or printing!
          </p>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <button
          type="button"
          onClick={onNavigateHome}
          style={{
            padding: '12px 28px',
            background: 'var(--tool-primary, #2563eb)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '14px',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          ← Return to All Tools
        </button>
      </div>
    </div>
  );
}
