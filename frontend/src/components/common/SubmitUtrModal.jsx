import React, { useState } from 'react';
import { API_BASE, probeBackend } from '../../config';

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
  const [geoDetecting, setGeoDetecting] = useState(false);

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

  // 1-Click Gen-Z Geo Flex auto-detector
  const handleDetectLocation = async () => {
    setGeoDetecting(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            // Quick reverse geocode via free public API with 3s timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
              { signal: controller.signal }
            );
            clearTimeout(timeoutId);
            if (res.ok) {
              const data = await res.json();
              const city = data.address?.city || data.address?.state_district || data.address?.state || 'India';
              const state = data.address?.state;
              const locationStr = state && state !== city ? `${city}, ${state}` : city;
              setCollege(locationStr);
            } else {
              setCollege('Delhi, IN');
            }
          } catch {
            setCollege('Kota, Rajasthan');
          } finally {
            setGeoDetecting(false);
          }
        },
        () => {
          // Denied or timeout: set smart fallback
          setCollege('Kota, Rajasthan');
          setGeoDetecting(false);
        },
        { timeout: 4000 }
      );
    } else {
      setCollege('Delhi, IN');
      setGeoDetecting(false);
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
    if (cleanUtr.length !== 12 || !/^\d{12}$/.test(cleanUtr)) {
      setErrorMsg('Please enter an exact 12-digit UPI UTR / Transaction Reference Number.');
      return;
    }

    if (donorName.trim().length < 2) {
      setErrorMsg('Please enter your name or batch/hostel name.');
      return;
    }

    setSubmitting(true);
    try {
      const node = await probeBackend();
      const targetUrl = node.url || API_BASE;

      const res = await fetch(`${targetUrl}/api/donations/submit-utr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donor_name: donorName.trim(),
          college: college.trim() || null,
          amount: `₹${finalAmount}`,
          utr_reference: cleanUtr,
          message: message.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to verify transaction. Please check UTR.');
      }

      setSuccessMsg('🎉 Verified! Your name & tagline are now live on the Wall of Fame.');
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
      setErrorMsg(err.message || 'An error occurred during verification.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🏆</span>
            <div>
              <h2 className="modal-title">Record UPI Server Fuel</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                Flex your contribution &amp; tagline on the permanent Wall of Fame.
              </p>
            </div>
          </div>
          <button type="button" className="btn-modal-close" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        {errorMsg && (
          <div style={{ padding: '10px 12px', borderRadius: '4px', background: 'var(--danger-soft)', border: '1px solid var(--danger-border)', color: 'var(--danger)', fontSize: '13px' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{ padding: '10px 12px', borderRadius: '4px', background: 'var(--success-soft)', border: '1px solid var(--success-border)', color: 'var(--success)', fontSize: '13px' }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Amount Presets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="setting-label">Fuel Contribution</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {AMOUNT_PRESETS.map((val) => (
                <button
                  type="button"
                  key={val}
                  className="sample-chip"
                  style={{
                    background: !isCustom && amount === val ? 'var(--accent)' : 'var(--bg-surface-2)',
                    color: !isCustom && amount === val ? '#ffffff' : 'var(--text-1)',
                    borderColor: !isCustom && amount === val ? 'var(--accent)' : 'var(--border)'
                  }}
                  onClick={() => handleSelectPreset(val)}
                >
                  ₹{val}
                </button>
              ))}
              <input
                type="text"
                placeholder="Custom ₹"
                value={customAmount}
                onChange={handleCustomChange}
                className="setting-input"
                style={{ width: '80px', padding: '4px 8px', fontSize: '12px' }}
                maxLength={5}
              />
            </div>
          </div>

          {/* 12-Digit UTR */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="setting-label" htmlFor="utr-ref">
              12-Digit UPI UTR / Transaction ID *
            </label>
            <input
              id="utr-ref"
              type="text"
              className="setting-input"
              style={{ fontFamily: 'var(--font-mono)' }}
              placeholder="e.g. 628491028471"
              value={utrReference}
              onChange={(e) => setUtrReference(e.target.value.replace(/\D/g, '').slice(0, 12))}
              maxLength={12}
              required
            />
            <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
              From Google Pay, PhonePe, Paytm, or CRED receipt details.
            </span>
          </div>

          {/* Donor Name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="setting-label" htmlFor="donor-name">Your Name / Nickname *</label>
            <input
              id="donor-name"
              type="text"
              className="setting-input"
              placeholder="e.g. Aryan S. or IITD Mech Hostel"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              maxLength={60}
              required
            />
          </div>

          {/* Geo Flex Location with 1-Click Auto-Detect */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="setting-label" htmlFor="donor-loc">City / College Flex</label>
              <button
                type="button"
                className="btn-geo-detect"
                onClick={handleDetectLocation}
                disabled={geoDetecting}
                title="Auto-detect city without asking for personal address"
              >
                <span>📍</span>
                <span>{geoDetecting ? 'Detecting...' : 'Auto-detect My City'}</span>
              </button>
            </div>
            <input
              id="donor-loc"
              type="text"
              className="setting-input"
              placeholder="e.g. Kota, Rajasthan or Mukherjee Nagar"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              maxLength={80}
            />
          </div>

          {/* Custom Tagline / Shoutout */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="setting-label" htmlFor="donor-msg">
              Tagline / Flex Quote on Wall
            </label>
            <input
              id="donor-msg"
              type="text"
              className="setting-input"
              placeholder="e.g. 'Saved ₹1,200 on printing!' or 'AIR 1 Loading 🚀'"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={180}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              className="btn-result-secondary"
              style={{ flex: 1 }}
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-download-primary"
              style={{ flex: 2 }}
              disabled={submitting}
            >
              {submitting ? 'Verifying...' : 'Verify & Add to Wall 🏆'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
