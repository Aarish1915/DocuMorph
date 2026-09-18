import React from 'react';

export default function PrivacyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="privacy-modal-title">
      <div className="modal-card legal-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', maxHeight: '85vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <div className="modal-header-left">
            <span className="modal-icon" aria-hidden="true">🛡️</span>
            <div>
              <h2 id="privacy-modal-title" className="modal-title">Privacy Policy</h2>
              <p className="modal-subtitle">100% Private, Ephemeral Processing</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close Privacy Policy">
            ✕
          </button>
        </div>

        <div className="modal-body legal-content" style={{ padding: '20px', lineHeight: '1.6', fontSize: '14px', color: 'var(--text-main, #1e293b)' }}>
          <div className="legal-highlight-box" style={{ background: 'var(--bg-secondary, #f8fafc)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
            <strong>Our Core Commitment:</strong> DocuMorph is engineered for students and professionals who require strict document privacy. <strong>Your uploaded files and extracted text are never stored, never sold, and never used to train public AI models.</strong>
          </div>

          <h3 style={{ fontSize: '15px', fontWeight: 600, marginTop: '16px', marginBottom: '6px' }}>1. Zero-Retention File Policy</h3>
          <p>When you upload a PDF for cleaning, compression, text extraction, or translation, the file is held in secure ephemeral memory during processing. As soon as processing concludes or the browser session ends, memory buffers are purged using operating system level memory reclamation.</p>

          <h3 style={{ fontSize: '15px', fontWeight: 600, marginTop: '16px', marginBottom: '6px' }}>2. Client-Side Preferences</h3>
          <p>Theme choices (dark/light) and non-sensitive UI settings are saved solely in your local browser storage (<code>localStorage</code>). We do not use tracking cookies or track individual browsing identities across websites.</p>

          <h3 style={{ fontSize: '15px', fontWeight: 600, marginTop: '16px', marginBottom: '6px' }}>3. Secure Transmission (HTTPS & HSTS)</h3>
          <p>All communication between your device and DocuMorph processing nodes is strictly encrypted via Transport Layer Security (TLS/HTTPS with HSTS enforcement).</p>

          <h3 style={{ fontSize: '15px', fontWeight: 600, marginTop: '16px', marginBottom: '6px' }}>4. Third-Party AI Isolation</h3>
          <p>Any visual OCR or translation requests passed to vision models operate under strict zero-training API agreements. Your academic documents remain your exclusive intellectual property.</p>

          <div style={{ marginTop: '24px', textAlign: 'right' }}>
            <button type="button" className="btn-primary" onClick={onClose} style={{ padding: '8px 20px', borderRadius: '6px', cursor: 'pointer' }}>
              I Understand
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
