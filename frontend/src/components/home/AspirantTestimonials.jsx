import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';
import WriteReviewModal from './WriteReviewModal';

const EXAM_FILTERS = [
  { id: 'all', label: 'All Aspirants' },
  { id: 'jee', label: 'JEE Advanced' },
  { id: 'neet', label: 'NEET UG/PG' },
  { id: 'upsc', label: 'UPSC CSE' },
  { id: 'college', label: 'College / B.Tech' },
  { id: 'gate', label: 'GATE / ESE' }
];

const AVATAR_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#06b6d4', '#ec4899', '#8b5cf6'];

export default function AspirantTestimonials() {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ average_rating: 4.9, total_verified: 5 });
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);

  const fetchReviews = async (filterId) => {
    try {
      setLoading(true);
      const url = filterId === 'all' 
        ? `${API_BASE_URL}/api/reviews?limit=30` 
        : `${API_BASE_URL}/api/reviews?exam=${encodeURIComponent(filterId)}&limit=30`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        if (data.average_rating) {
          setStats({
            average_rating: data.average_rating,
            total_verified: data.total_verified || data.reviews.length
          });
        }
      }
    } catch (err) {
      console.warn('Could not fetch reviews from API, using fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(selectedFilter);
  }, [selectedFilter]);

  const handleReviewSubmitted = (newReview) => {
    setReviews((prev) => [newReview, ...prev]);
    setStats((prev) => ({
      ...prev,
      total_verified: prev.total_verified + 1
    }));
  };

  return (
    <section className="aspirant-testimonials-section" aria-label="Student Testimonials">
      <div className="testimonials-container">
        {/* Section Header */}
        <div className="testimonials-header">
          <div className="testimonials-pill">
            <span className="testimonials-pill-dot" />
            <span>Verified Student Wall</span>
          </div>

          <h2 className="testimonials-title">
            Trusted by 10,000+ Exam Aspirants &amp; College Students
          </h2>
          
          <p className="testimonials-subtitle">
            From Kota study rooms to Mukherjee Nagar libraries — see how students save Xerox costs, keep LaTeX formulas crisp, and ace exams with DocuMorph.
          </p>

          {/* Social Proof Aggregate Banner */}
          <div className="testimonials-score-strip">
            <div className="score-stars">
              <span className="stars-gold">★★★★★</span>
              <span className="score-numeric">{stats.average_rating.toFixed(1)} / 5.0</span>
            </div>
            <span className="score-divider">•</span>
            <span className="score-count">{stats.total_verified}+ Verified Student Experiences</span>
            <span className="score-divider">•</span>
            <button
              type="button"
              className="btn-open-review-modal"
              onClick={() => setIsWriteModalOpen(true)}
            >
              <span>✍️</span>
              <span>Share Your Experience</span>
            </button>
          </div>

          {/* Filter Pills */}
          <div className="testimonials-filter-bar">
            {EXAM_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={`filter-tab-pill ${selectedFilter === filter.id ? 'active' : ''}`}
                onClick={() => setSelectedFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reviews Grid */}
        {loading ? (
          <div className="testimonials-loading-state">
            <div className="spinner-mini" />
            <span>Loading verified aspirant feedback...</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="no-reviews-state">
            <p>No reviews found for this category yet.</p>
            <button
              type="button"
              className="btn-submit-primary"
              onClick={() => setIsWriteModalOpen(true)}
            >
              Be the first to share your experience ✨
            </button>
          </div>
        ) : (
          <div className="testimonials-grid">
            {reviews.map((rev, idx) => {
              const bg = AVATAR_COLORS[idx % AVATAR_COLORS.length];
              const starStr = '★'.repeat(rev.rating || 5) + '☆'.repeat(5 - (rev.rating || 5));
              return (
                <div key={rev.id || idx} className="testimonial-card">
                  <div className="testimonial-card-top">
                    <div className="testimonial-rating" aria-label={`${rev.rating} out of 5 stars`}>
                      {starStr}
                    </div>
                    <span className="verified-badge-pill">✓ Verified Aspirant</span>
                  </div>

                  <p className="testimonial-quote">"{rev.review_text}"</p>

                  <div className="testimonial-author">
                    <div className="author-avatar" style={{ background: bg }}>
                      {(rev.student_name && rev.student_name[0]) ? rev.student_name[0].toUpperCase() : 'S'}
                    </div>
                    <div className="author-meta">
                      <span className="author-name">{rev.student_name}</span>
                      <span className="author-exam">
                        {rev.exam_target} {rev.city ? `• ${rev.city}` : ''}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Floating / Bottom Write Review Trigger */}
        <div className="testimonials-footer-cta">
          <div className="footer-cta-text">
            <h3>Has DocuMorph helped your exam preparation?</h3>
            <p>Let other students know about saved print costs, clean math equations, and sharp medical diagrams.</p>
          </div>
          <button
            type="button"
            className="btn-write-review-large"
            onClick={() => setIsWriteModalOpen(true)}
          >
            <span>✨</span>
            <span>Write a Student Review</span>
          </button>
        </div>
      </div>

      {/* Write Review Modal */}
      <WriteReviewModal
        isOpen={isWriteModalOpen}
        onClose={() => setIsWriteModalOpen(false)}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </section>
  );
}
