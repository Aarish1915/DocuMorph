import React from 'react';

export default function TermsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="terms-modal-title">
      <div className="modal-card legal-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', maxHeight: '85vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <div className="modal-header-left">
            <span className="modal-icon" aria-hidden="true">📜</span>
            <div>
              <h2 id="terms-modal-title" className="modal-title">Terms of Service</h2>
              <p className="modal-subtitle">Fair Use & Educational Guidelines</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close Terms of Service">
            ✕
          </button>
        </div>

        <div className="modal-body legal-content" style={{ padding: '20px', lineHeight: '1.6', fontSize: '14px', color: 'var(--text-main, #1e293b)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginTop: '8px', marginBottom: '6px' }}>1. Educational Fair Use</h3>
          <p>DocuMorph is provided as an open tool for students, educators, and researchers to clean study notes, format mathematical formulas, compress file sizes, and translate study materials into regional languages.</p>

          <h3 style={{ fontSize: '15px', fontWeight: 600, marginTop: '16px', marginBottom: '6px' }}>2. User Responsibility & Content Ownership</h3>
          <p>You retain full rights and ownership of your documents. You agree not to use DocuMorph to process unlawful, malicious, or intentionally infringing materials.</p>

          <h3 style={{ fontSize: '15px', fontWeight: 600, marginTop: '16px', marginBottom: '6px' }}>3. Service Availability & Performance</h3>
          <p>DocuMorph provides best-in-class layout reconstruction and AI transcription. While we employ rigorous mathematical formula verification and sub-pixel diagram cropping, you should review compiled outputs prior to official printing or publication.</p>

          <h3 style={{ fontSize: '15px', fontWeight: 600, marginTop: '16px', marginBottom: '6px' }}>4. Automated Rate Limits</h3>
          <p>To ensure fair server capacity for all students, abuse-prevention rate limiters guard processing endpoints against automated scraping and DDOS attacks.</p>

          <div style={{ marginTop: '24px', textAlign: 'right' }}>
            <button type="button" className="btn-primary" onClick={onClose} style={{ padding: '8px 20px', borderRadius: '6px', cursor: 'pointer' }}>
              Accept Terms
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
