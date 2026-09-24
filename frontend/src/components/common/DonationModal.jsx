import React from 'react';
import UpiPaymentCard from './UpiPaymentCard';

export default function DonationModal({ isOpen, onClose, onDonationRecorded }) {
  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose} 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="donation-modal-title"
    >
      <div 
        className="modal-dialog-card donation-modal-container" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-title-icon">☕</span>
            <div>
              <h2 id="donation-modal-title" className="modal-title">Support DocuMorph Server Fuel</h2>
              <p className="modal-subtitle">
                100% Free &amp; Ad-Free for students. Zero venture capital. Every ₹20 chai keeps GPU servers online.
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className="modal-close-btn" 
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
      </div>
    </div>
  );
}
