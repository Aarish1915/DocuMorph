import React, { useState } from 'react';
import { API_BASE_URL } from '../../config';

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
  const [hoverRating, setHoverRating] = useState(0);
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
      const res = await fetch(`${API_BASE_URL}/api/reviews`, {
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
      if (onReviewSubmitted) {
        onReviewSubmitted(data.review);
      }
      setTimeout(() => {
        onClose();
        setSuccessMsg('');
        setStudentName('');
        setCity('');
        setReviewText('');
      }, 1800);
    } catch (err) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="write-review-title">
      <div className="modal-dialog-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-title-icon">✍️</span>
            <div>
              <h2 id="write-review-title" className="modal-title">Share Your Study Experience</h2>
              <p className="modal-subtitle">Help other aspirants discover how DocuMorph saves Xerox costs &amp; clean study notes.</p>
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
          {/* Star Rating Row */}
          <div className="form-group">
            <label className="form-label">Your Rating</label>
            <div className="star-rating-row">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  className={`star-icon ${(hoverRating || rating) >= star ? 'active' : ''}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={`${star} star${star > 1 ? 's' : ''}`}
                >
                  ★
                </button>
              ))}
              <span className="rating-label-text">
                {rating === 5 ? '5/5 (Outstanding)' : `${rating}/5`}
              </span>
            </div>
          </div>

          {/* Name & Exam in 2 columns on desktop, stacked on mobile */}
          <div className="form-row-2col">
            <div className="form-group">
              <label htmlFor="rev-student-name" className="form-label">Your Name *</label>
              <input
                id="rev-student-name"
                type="text"
                className="form-input"
                placeholder="e.g. Aryan Sharma"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                maxLength={60}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="rev-exam-target" className="form-label">Target Exam / Degree</label>
              <select
                id="rev-exam-target"
                className="form-input form-select"
                value={examTarget}
                onChange={(e) => setExamTarget(e.target.value)}
              >
                {EXAM_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="rev-city" className="form-label">City / Institute (Optional)</label>
            <input
              id="rev-city"
              type="text"
              className="form-input"
              placeholder="e.g. Allen Kota or IIT Bombay"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              maxLength={60}
            />
          </div>

          <div className="form-group">
            <label htmlFor="rev-text" className="form-label">
              Your Review / Experience *
              <span className="char-count">{reviewText.length}/1000</span>
            </label>
            <textarea
              id="rev-text"
              className="form-textarea"
              rows={4}
              placeholder="How did DocuMorph help your notes? e.g. 'Whitened my dark coaching modules, kept all calculus formulas intact and cut my printing bill by half.'"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              maxLength={1000}
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-submit-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Post Student Review ✨'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
