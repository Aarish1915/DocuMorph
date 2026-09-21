import React, { useState } from 'react';
import { API_BASE_URL } from '../../config';

const PRESET_AMOUNTS = [
  { amount: 20, label: '1 Cutting Chai', icon: '☕' },
  { amount: 50, label: '1 Exam Notebook', icon: '📚' },
  { amount: 100, label: '1 Day Cloud GPU', icon: '⚡' },
  { amount: 500, label: 'Batch / Hostel Patron', icon: '💎' }
];

export default function UpiPaymentCard({ onDonationSuccess, compact = false }) {
  const [amount, setAmount] = useState(20);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [copied, setCopied] = useState(false);

  // UTR verification form state
  const [showUtrForm, setShowUtrForm] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [college, setCollege] = useState('');
  const [utrReference, setUtrReference] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const upiId = 'documorph@upi';
  const effectiveAmount = isCustom ? parseInt(customAmount, 10) || 20 : amount;

  // Real UPI deep link for mobile apps
  const upiPayUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent('DocuMorph AI')}&am=${effectiveAmount}&cu=INR&tn=${encodeURIComponent('DocuMorph Server Fuel')}`;
  
  // Real dynamic QR code image URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(upiPayUrl)}`;

  const handleCopyUPI = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleSelectPreset = (val) => {
    setIsCustom(false);
    setAmount(val);
    setCustomAmount('');
  };

  const handleCustomChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    setCustomAmount(val);
    setIsCustom(true);
    if (val) setAmount(parseInt(val, 10));
  };

  const handleVerifyUtr = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', text: '' });

    if (donorName.trim().length < 2) {
      setFeedback({ type: 'error', text: 'Please enter your name or batch/hostel name.' });
      return;
    }

    const cleanUtr = utrReference.trim().replace(/\s+/g, '');
    if (cleanUtr.length < 8) {
      setFeedback({ type: 'error', text: 'Please enter a valid 12-digit UPI UTR transaction number.' });
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
          amount: effectiveAmount,
          utr_reference: cleanUtr,
          message: message.trim() || 'Chai fuel for servers!'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Could not verify transaction. Please re-check UTR.');
      }

      setFeedback({ 
        type: 'success', 
        text: '🎉 Verified! Your name has been added to the Wall of Fame.' 
      });

      if (onDonationSuccess) {
        onDonationSuccess(data.donor);
      }

      setTimeout(() => {
        setShowUtrForm(false);
        setUtrReference('');
        setDonorName('');
        setCollege('');
        setMessage('');
        setFeedback({ type: '', text: '' });
      }, 2500);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Verification failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`upi-payment-card ${compact ? 'compact' : ''}`}>
      {/* Amount Selector Tabs */}
      <div className="upi-amount-pills">
        {PRESET_AMOUNTS.map((p) => (
          <button
            key={p.amount}
            type="button"
            className={`upi-pill ${!isCustom && amount === p.amount ? 'active' : ''}`}
            onClick={() => handleSelectPreset(p.amount)}
          >
            <span className="pill-icon">{p.icon}</span>
            <span className="pill-amount">₹{p.amount}</span>
            {!compact && <span className="pill-desc">{p.label}</span>}
          </button>
        ))}
        <div className={`upi-custom-chip ${isCustom ? 'active' : ''}`}>
          <span className="custom-rupee">₹</span>
          <input
            type="text"
            placeholder="Other"
            value={customAmount}
            onChange={handleCustomChange}
            className="custom-amount-input"
            maxLength={5}
            aria-label="Custom contribution amount in rupees"
          />
        </div>
      </div>

      {/* QR Code & Direct Payment Grid */}
      <div className="upi-qr-display-grid">
        {/* QR Code Frame */}
        <div className="qr-frame-wrapper">
          <div className="qr-image-container">
            <img 
              src={qrCodeUrl} 
              alt={`Scan UPI QR Code to pay ₹${effectiveAmount}`}
              className="upi-qr-image"
              loading="lazy"
            />
            <div className="qr-scan-badge">
              <span>Scan with any UPI app</span>
            </div>
          </div>
          <div className="qr-supported-apps">
            <span className="app-badge">GPay</span>
            <span className="app-badge">PhonePe</span>
            <span className="app-badge">Paytm</span>
            <span className="app-badge">BHIM</span>
          </div>
        </div>

        {/* UPI Details & Mobile Intent Actions */}
        <div className="upi-details-column">
          <div className="upi-id-box">
            <label className="upi-id-label">Official DocuMorph UPI ID</label>
            <div className="upi-id-row">
              <code className="upi-vpa-text">{upiId}</code>
              <button 
                type="button" 
                className={`btn-copy-upi ${copied ? 'copied' : ''}`}
                onClick={handleCopyUPI}
                title="Copy UPI ID to clipboard"
              >
                {copied ? '✓ Copied!' : 'Copy UPI'}
              </button>
            </div>
          </div>

          <div className="mobile-pay-action">
            <a 
              href={upiPayUrl} 
              className="btn-open-upi-app"
              rel="noopener noreferrer"
            >
              <span>📱</span>
              <span>Pay ₹{effectiveAmount} via GPay / PhonePe</span>
            </a>
            <span className="mobile-only-hint">Tapping directly opens your installed UPI app on mobile</span>
          </div>

          <div className="upi-security-note">
            <span>🛡️ 100% Direct &amp; Verified. Zero middleman gateway fees deducted.</span>
          </div>
        </div>
      </div>

      {/* Toggle UTR Recording Form */}
      <div className="utr-toggle-strip">
        {!showUtrForm ? (
          <button
            type="button"
            className="btn-trigger-utr-form"
            onClick={() => setShowUtrForm(true)}
          >
            <span>✍️</span>
            <span>Already scanned &amp; paid? <strong>Add your name to the Wall of Fame</strong></span>
          </button>
        ) : (
          <form onSubmit={handleVerifyUtr} className="utr-inline-form">
            <div className="utr-form-header">
              <h4>Record Your Fuel on the Wall of Fame</h4>
              <button 
                type="button" 
                className="btn-close-utr" 
                onClick={() => setShowUtrForm(false)}
              >
                &times;
              </button>
            </div>

            {feedback.text && (
              <div className={`utr-feedback ${feedback.type}`}>
                <span>{feedback.type === 'success' ? '✅' : '⚠️'}</span>
                <span>{feedback.text}</span>
              </div>
            )}

            <div className="utr-form-row">
              <div className="utr-input-group">
                <label>12-Digit UPI UTR / Ref No *</label>
                <input
                  type="text"
                  placeholder="e.g. 628491028471"
                  value={utrReference}
                  onChange={(e) => setUtrReference(e.target.value.replace(/[^0-9a-zA-Z]/g, ''))}
                  className="font-mono"
                  maxLength={24}
                  required
                />
              </div>

              <div className="utr-input-group">
                <label>Your Name / Batch *</label>
                <input
                  type="text"
                  placeholder="e.g. Kunal Singhania"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  maxLength={60}
                  required
                />
              </div>
            </div>

            <div className="utr-form-row">
              <div className="utr-input-group">
                <label>College / Institute (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. IIT Delhi or Allen Kota"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  maxLength={80}
                />
              </div>

              <div className="utr-input-group">
                <label>Note / Message (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 'Saved ₹200 printing thermodynamics notes!'"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={160}
                />
              </div>
            </div>

            <div className="utr-form-actions">
              <button 
                type="button" 
                className="btn-cancel-utr" 
                onClick={() => setShowUtrForm(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-submit-utr" 
                disabled={submitting}
              >
                {submitting ? 'Verifying...' : 'Verify UTR & Join Wall 🏆'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
