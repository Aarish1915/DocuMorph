import React from 'react';

export default function NotFoundView({ onNavigateHome }) {
  return (
    <div className="not-found-container" style={{
      textAlign: 'center',
      padding: '80px 20px',
      maxWidth: '520px',
      margin: '0 auto',
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        fontSize: '64px',
        fontWeight: 800,
        background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        lineHeight: 1,
        marginBottom: '16px'
      }}>
        404
      </div>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-main, #0f172a)', marginBottom: '8px' }}>
        Document Tool Not Found
      </h1>
      <p style={{ fontSize: '14px', color: 'var(--text-secondary, #64748b)', marginBottom: '28px', lineHeight: 1.6 }}>
        The tool page or document link you requested could not be located or has been relocated to our main AI suite.
      </p>
      <button
        type="button"
        className="btn-primary"
        onClick={onNavigateHome}
        style={{
          padding: '12px 28px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 600,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer'
        }}
      >
        <span>←</span> Back to All Tools
      </button>
    </div>
  );
}
