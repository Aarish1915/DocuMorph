import React, { useState, useEffect } from 'react';

export default function CookieConsent({ onOpenPrivacy }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const consent = localStorage.getItem('documorph_cookie_consent');
      if (!consent) {
        // Subtle delay for smooth appearance
        const timer = setTimeout(() => setVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleAccept = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('documorph_cookie_consent', 'accepted');
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      className="cookie-consent-bar"
      role="region"
      aria-label="Privacy & Storage Notice"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        left: 'auto',
        transform: 'none',
        zIndex: 9990,
        width: 'calc(100% - 48px)',
        maxWidth: '420px',
        background: 'var(--bg-elevated, #ffffff)',
        color: 'var(--text-main, #0f172a)',
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: '12px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        fontSize: '13px',
        animation: 'slideUpFade 0.3s ease-out'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '18px' }} aria-hidden="true">🍪</span>
        <span>
          We only store your dark/light theme on your device. We never save your files or track you.{' '}
          <button
            type="button"
            onClick={onOpenPrivacy}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--tool-primary, #2563eb)',
              textDecoration: 'underline',
              cursor: 'pointer',
              padding: 0,
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            Read Privacy
          </button>
        </span>
      </div>
      <button
        type="button"
        onClick={handleAccept}
        style={{
          background: 'var(--color-primary, #2563eb)',
          color: '#ffffff',
          border: 'none',
          padding: '6px 14px',
          borderRadius: '6px',
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          fontSize: '12px'
        }}
      >
        Got it
      </button>
    </aside>
  );
}
