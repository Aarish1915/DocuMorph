import React from 'react';

export default function PrivacyPage({ onNavigateHome }) {
  return (
    <div className="tool-page-container" style={{ maxWidth: '840px', margin: '0 auto', padding: '32px 16px' }}>
      {/* Top back navigation */}
      <nav aria-label="Breadcrumb" className="tool-page-breadcrumb">
        <button
          type="button"
          onClick={onNavigateHome}
          className="breadcrumb-back-btn"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>Back to All Tools</span>
        </button>
        <span className="breadcrumb-separator" aria-hidden="true">/</span>
        <span className="breadcrumb-current" aria-current="page">Privacy Policy</span>
      </nav>

      <div style={{ textAlign: 'center', margin: '24px 0 36px 0' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>
          <span>🛡️</span>
          <span>Simple, Honest &amp; Clear</span>
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 10px 0', color: 'var(--text-main)' }}>
          Privacy Policy: Your Files Stay Yours
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto', lineHeight: '1.6' }}>
          We built DocuMorph for students and teachers. You don't need a law degree to read our policy. Here is our simple promise in plain English:
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: 'var(--surface-card, #ffffff)', border: '1.5px solid var(--border-default, #e2e8f0)', borderRadius: '14px', padding: '20px' }}>
          <div style={{ fontSize: '28px', marginBottom: '10px' }}>🗑️</div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-main)' }}>
            1. We Delete Your Files Immediately
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
            When you upload a PDF to clean, shrink, or translate, we process it and give you the download. As soon as you are done, your file is permanently erased from our computers. We never store your books or notes.
          </p>
        </div>

        <div style={{ background: 'var(--surface-card, #ffffff)', border: '1.5px solid var(--border-default, #e2e8f0)', borderRadius: '14px', padding: '20px' }}>
          <div style={{ fontSize: '28px', marginBottom: '10px' }}>🚫</div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-main)' }}>
            2. We Never Sell Your Data
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
            We do not sell your files, notes, or information to advertisers, companies, or third parties. We don't use your private study material to train public AI.
          </p>
        </div>

        <div style={{ background: 'var(--surface-card, #ffffff)', border: '1.5px solid var(--border-default, #e2e8f0)', borderRadius: '14px', padding: '20px' }}>
          <div style={{ fontSize: '28px', marginBottom: '10px' }}>🔒</div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-main)' }}>
            3. Safe &amp; Secure Connection
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
            All documents travel through secure, encrypted channels (HTTPS), just like online banking. Nobody on the internet can peek at your notes while they are being processed.
          </p>
        </div>

        <div style={{ background: 'var(--surface-card, #ffffff)', border: '1.5px solid var(--border-default, #e2e8f0)', borderRadius: '14px', padding: '20px' }}>
          <div style={{ fontSize: '28px', marginBottom: '10px' }}>🍪</div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-main)' }}>
            4. No Creepy Tracking
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
            We do not track who you are or follow you across the internet. We only save simple preferences on your own phone or laptop, like whether you prefer Dark Mode or Light Mode.
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
