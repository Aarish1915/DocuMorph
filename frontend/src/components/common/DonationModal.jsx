import React from 'react';
import UpiPaymentCard from './UpiPaymentCard';

export default function DonationModal({ isOpen, onClose, onOpenUtrModal, onDonationRecorded }) {
  if (!isOpen) return null;

  return (
    <div 
      className="modal-backdrop" 
      onClick={onClose} 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="donation-modal-title"
    >
      <div 
        className="modal-dialog" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px' }}
      >
        {/* Modal Header */}
        <div className="modal-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '22px' }}>☕</span>
            <div>
              <h2 id="donation-modal-title" className="modal-title">Fuel CleanNotes Server</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                100% Free &amp; Private for students. Zero venture capital. Every ₹20 chai keeps servers online.
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className="btn-modal-close" 
            onClick={onClose} 
            aria-label="Close donation modal"
          >
            &times;
          </button>
        </div>

        {/* Live Interactive UPI Payment & QR Code Card */}
        <UpiPaymentCard 
          onDonationSuccess={(donor) => {
            if (onDonationRecorded) onDonationRecorded(donor);
          }}
        />

        {onOpenUtrModal && (
          <div style={{ textAlign: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginTop: '8px' }}>
            <button
              type="button"
              className="btn-open-utr-pill"
              onClick={() => {
                onClose();
                onOpenUtrModal();
              }}
            >
              <span>✍️ Already paid via UPI?</span>
              <strong style={{ color: 'var(--accent)' }}>Submit 12-digit UTR to get on Wall of Fame →</strong>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
