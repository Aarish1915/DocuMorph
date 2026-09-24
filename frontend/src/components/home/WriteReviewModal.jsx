import React, { useState } from 'react';
import { API_BASE, probeBackend } from '../../config';

const EXAM_OPTIONS = [
  'JEE Advanced / Main',
  'NEET UG / PG',
  'UPSC CSE',
  'GATE / ESE',
  'College / B.Tech',
  'Class 11 / 12 CBSE',
  'Other'
];

export default function WriteReviewModal({ isOpen, onClose, onReviewSubmitted }) {
  const [studentName, setStudentName] = useState('');
  const [examTarget, setExamTarget] = useState('JEE Advanced / Main');
  const [city, setCity] = useState('');
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (studentName.trim().length < 2) {
      setErrorMsg('Please enter your name (at least 2 characters).');
      return;
    }
    if (reviewText.trim().length < 10) {
      setErrorMsg('Please write at least a sentence about your experience (minimum 10 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const node = await probeBackend();
      const baseUrl = node?.url || API_BASE;
      const res = await fetch(`${baseUrl}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: studentName.trim(),
          exam_target: examTarget,
          city: city.trim() || null,
          rating: rating,
          review_text: reviewText.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to submit review. Please try again.');
      }

      setSuccessMsg('Thank you! Your review is now live on the student wall.');
      if (onReviewSubmitted) onReviewSubmitted(data.review);
      setTimeout(() => {
        onClose();
        setSuccessMsg('');
        setStudentName('');
        setCity('');
        setReviewText('');
      }, 1800);
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred while submitting.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>⭐</span>
            <h2 className="modal-title">Write an Aspirant Review</h2>
          </div>
          <button type="button" className="btn-modal-close" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        {errorMsg && (
          <div style={{ padding: '10px', borderRadius: '4px', background: 'var(--danger-soft)', border: '1px solid var(--danger-border)', color: 'var(--danger)', fontSize: '13px' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{ padding: '10px', borderRadius: '4px', background: 'var(--success-soft)', border: '1px solid var(--success-border)', color: 'var(--success)', fontSize: '13px' }}>
            🎉 {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="setting-label" htmlFor="rev-name">Your Name / Handle *</label>
            <input
              id="rev-name"
              type="text"
              className="setting-input"
              placeholder="e.g. Priya V."
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="setting-label" htmlFor="rev-exam">Target Exam *</label>
              <select
                id="rev-exam"
                className="setting-select"
                value={examTarget}
                onChange={(e) => setExamTarget(e.target.value)}
              >
                {EXAM_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="setting-label" htmlFor="rev-city">City / Institute</label>
              <input
                id="rev-city"
                type="text"
                className="setting-input"
                placeholder="e.g. AIIMS Bhopal"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="setting-label">Star Rating</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '22px',
                    color: star <= rating ? '#F59E0B' : 'var(--border)',
                    cursor: 'pointer'
                  }}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="setting-label" htmlFor="rev-text">Your Review / Experience *</label>
            <textarea
              id="rev-text"
              className="setting-input"
              rows={3}
              placeholder="How did CleanNotes help your preparation or printing budget?"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              required
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
              {submitting ? 'Submitting...' : 'Post Verified Review ⭐'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
