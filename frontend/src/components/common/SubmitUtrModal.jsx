import React, { useState } from 'react';
import { API_BASE_URL } from '../../config';

const AMOUNT_PRESETS = [20, 50, 100, 200, 500];

export default function SubmitUtrModal({ isOpen, onClose, onDonationRecorded }) {
  const [donorName, setDonorName] = useState('');
  const [college, setCollege] = useState('');
  const [amount, setAmount] = useState(20);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [utrReference, setUtrReference] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSelectPreset = (val) => {
    setIsCustom(false);
    setAmount(val);
    setCustomAmount('');
  };

  const handleCustomChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    setCustomAmount(val);
    setIsCustom(true);
    if (val) {
      setAmount(parseInt(val, 10));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const finalAmount = isCustom ? parseInt(customAmount, 10) : amount;
    if (!finalAmount || finalAmount < 10) {
      setErrorMsg('Please specify a valid contribution amount (minimum ₹10).');
      return;
    }

    const cleanUtr = utrReference.trim().replace(/\s+/g, '');
    if (cleanUtr.length < 8 || cleanUtr.length > 30) {
      setErrorMsg('Please enter a valid 12-digit UPI UTR / Transaction Reference Number.');
      return;
    }

    if (donorName.trim().length < 2) {
      setErrorMsg('Please enter your name or hostel / batch name.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/donations/submit-utr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donor_name: donorName.trim(),
          college: college.trim() || null,
          amount: finalAmount,
          utr_reference: cleanUtr,
          message: message.trim() || null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to verify transaction. Please check the UTR number.');
      }

      setSuccessMsg('🎉 Verified! Your contribution is now shining on the Wall of Fame.');
      if (onDonationRecorded) {
        onDonationRecorded(data.donor);
      }
      setTimeout(() => {
        onClose();
        setSuccessMsg('');
        setDonorName('');
        setCollege('');
        setUtrReference('');
        setMessage('');
      }, 2000);
    } catch (err) {
      setErrorMsg(err.message || 'An unexpected error occurred during verification.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="submit-utr-title">
      <div className="modal-dialog-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-title-icon">🏆</span>
            <div>
              <h2 id="submit-utr-title" className="modal-title">Record UPI Server Fuel</h2>
              <p className="modal-subtitle">Add your name, college, and message to the permanent Wall of Fame.</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        {errorMsg && (
          <div className="modal-alert modal-alert-error" role="alert">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="modal-alert modal-alert-success" role="alert">
            <span>✅</span>
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Amount presets */}
          <div className="form-group">
            <label className="form-label">Fuel Contribution Amount</label>
            <div className="fuel-preset-chips">
              {AMOUNT_PRESETS.map((val) => (
                <button
                  type="button"
                  key={val}
                  className={`fuel-chip ${!isCustom && amount === val ? 'active' : ''}`}
                  onClick={() => handleSelectPreset(val)}
                >
                  ₹{val}
                </button>
              ))}
              <div className="fuel-custom-chip-wrap">
                <span className="rupee-prefix">₹</span>
                <input
                  type="text"
                  placeholder="Custom"
                  value={customAmount}
                  onChange={handleCustomChange}
                  className={`fuel-custom-input ${isCustom ? 'active' : ''}`}
                  maxLength={5}
                />
              </div>
            </div>
          </div>

          {/* 12-Digit UPI UTR Reference */}
          <div className="form-group">
            <label htmlFor="utr-number" className="form-label">
              12-Digit UPI UTR / Transaction ID *
            </label>
            <input
              id="utr-number"
              type="text"
              className="form-input font-mono"
              placeholder="e.g. 628491028471"
              value={utrReference}
              onChange={(e) => setUtrReference(e.target.value.replace(/[^0-9a-zA-Z]/g, ''))}
              maxLength={22}
              required
            />
            <span className="input-hint">Found in Google Pay, PhonePe, or Paytm payment receipt details.</span>
          </div>

          {/* Name & College 2-Col */}
          <div className="form-row-2col">
            <div className="form-group">
              <label htmlFor="donor-name-input" className="form-label">Your Name / Batch *</label>
              <input
                id="donor-name-input"
                type="text"
                className="form-input"
                placeholder="e.g. Aryan Sharma or Mech Batch 26"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                maxLength={60}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="donor-college-input" className="form-label">College / Institute</label>
              <input
                id="donor-college-input"
                type="text"
                className="form-input"
                placeholder="e.g. IIT Delhi or Allen Kota"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                maxLength={80}
              />
            </div>
          </div>

          {/* Message / Note */}
          <div className="form-group">
            <label htmlFor="donor-message-input" className="form-label">
              Message on the Wall of Fame (Optional)
            </label>
            <input
              id="donor-message-input"
              type="text"
              className="form-input"
              placeholder="e.g. 'Saved 200 sheets on thermodynamics notes!' or 'Keep this free!'"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={180}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-submit-primary" disabled={submitting}>
              {submitting ? 'Verifying...' : 'Verify & Add to Wall 🏆'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
