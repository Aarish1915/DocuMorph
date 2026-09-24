import React, { useState, useEffect, useRef } from 'react';
import { API_BASE, probeBackend } from '../../config';

export default function CommunityWall({
  onNavigateHome,
  onOpenDonation,
  onOpenUtrModal,
  onOpenWriteReview,
}) {
  const [activeTab, setActiveTab] = useState('leaderboard'); // 'leaderboard' | 'recent' | 'reviews'

  // Fuel Gauge Stats
  const [stats, setStats] = useState({
    total_raised: 780,
    target: 1000,
    percentage: 78,
    donor_count: 24,
  });

  // Top Patrons
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  // Recent Donors (Paginated + Filter)
  const [recentDonors, setRecentDonors] = useState([]);
  const [recentPage, setRecentPage] = useState(1);
  const [recentHasMore, setRecentHasMore] = useState(false);
  const [recentLoading, setRecentLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Reviews
  const [reviewsData, setReviewsData] = useState({
    reviews: [],
    total_verified: 0,
    average_rating: 4.9,
  });
  const [selectedExam, setSelectedExam] = useState('all');
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Probe base URL once
  const [baseUrl, setBaseUrl] = useState(API_BASE);

  useEffect(() => {
    probeBackend().then((node) => {
      if (node?.url) setBaseUrl(node.url);
    });
  }, []);

  // Fetch fuel stats
  useEffect(() => {
    fetch(`${baseUrl}/api/donations/stats`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setStats(data);
      })
      .catch(() => {});
  }, [baseUrl]);

  // Fetch Leaderboard
  useEffect(() => {
    setLoadingLeaderboard(true);
    fetch(`${baseUrl}/api/donations/leaderboard`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setLeaderboard(data);
      })
      .catch(() => {})
      .finally(() => setLoadingLeaderboard(false));
  }, [baseUrl]);

  // Fetch Recent Donors
  const fetchRecent = async (page = 1, tier = 'all', query = '', append = false) => {
    setRecentLoading(true);
    try {
      let url = `${baseUrl}/api/donations/recent?page=${page}&limit=12&tier=${tier}`;
      if (query.trim()) {
        url += `&q=${encodeURIComponent(query.trim())}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const items = data.donations || [];
        setRecentDonors((prev) => (append ? [...prev, ...items] : items));
        setRecentHasMore(data.has_more ?? false);
        setRecentPage(page);
      }
    } catch {
      // Ignore network errors
    } finally {
      setRecentLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'recent') {
      fetchRecent(1, selectedTier, searchQuery, false);
    }
  }, [activeTab, selectedTier, baseUrl]);

  // Debounced search
  const searchTimeoutRef = useRef(null);
  const handleSearchChange = (val) => {
    setSearchQuery(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchRecent(1, selectedTier, val, false);
    }, 350);
  };

  // Fetch Reviews
  useEffect(() => {
    if (activeTab === 'reviews') {
      setReviewsLoading(true);
      const url = selectedExam !== 'all'
        ? `${baseUrl}/api/reviews?exam=${selectedExam}&limit=30`
        : `${baseUrl}/api/reviews?limit=30`;

      fetch(url)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) setReviewsData(data);
        })
        .catch(() => {})
        .finally(() => setReviewsLoading(false));
    }
  }, [activeTab, selectedExam, baseUrl]);

  return (
    <div className="community-container">
      {/* Back to Home button */}
      <button
        type="button"
        className="community-back-btn"
        onClick={onNavigateHome}
      >
        <span>←</span>
        <span>Back to Document Workspace</span>
      </button>

      {/* Hero */}
      <div className="community-hero">
        <h1>Community Wall &amp; Server Fuel</h1>
        <p>Every chai counts. Built transparently by students, for students.</p>
      </div>

      {/* Fuel Gauge Card */}
      <div className="fuel-gauge-card">
        <div className="fuel-gauge-header">
          <span className="fuel-gauge-title">September 2026 Server Goal</span>
          <span className="fuel-gauge-stat">
            ₹{stats.total_raised} / ₹{stats.target} ({stats.percentage}%)
          </span>
        </div>

        <div className="fuel-track" aria-label="Donation progress">
          <div
            className="fuel-fill"
            style={{ width: `${Math.min(100, stats.percentage)}%` }}
          />
        </div>

        <div className="cost-breakdown-row">
          <span>🖥️ GPU / Linux Server: ₹480/mo</span>
          <span>🧠 Vision AI API: ₹300/mo</span>
          <span>⚡ Cloudflare CDN: Free Tier</span>
          <span>👥 {stats.donor_count} Student Patrons</span>
        </div>

        <div className="community-cta-row">
          <button
            type="button"
            className="btn-fuel-main"
            onClick={onOpenDonation}
          >
            <span>☕</span>
            <span>Fuel ₹20 via UPI</span>
          </button>
          <button
            type="button"
            className="btn-utr-main"
            onClick={onOpenUtrModal}
          >
            <span>✍️</span>
            <span>Already Paid? Submit UTR</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <nav className="community-tabs-nav" aria-label="Community Wall Navigation">
        <button
          type="button"
          className={`community-tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          👑 Top Patrons
        </button>
        <button
          type="button"
          className={`community-tab-btn ${activeTab === 'recent' ? 'active' : ''}`}
          onClick={() => setActiveTab('recent')}
        >
          ☕ Recent Donors ({stats.donor_count})
        </button>
        <button
          type="button"
          className={`community-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          ⭐ Student Reviews ({reviewsData.total_verified || 47})
        </button>
      </nav>

      {/* Tab 1: Top Patrons */}
      {activeTab === 'leaderboard' && (
        <div className="donors-list">
          {loadingLeaderboard ? (
            <p style={{ textAlign: 'center', color: 'var(--text-3)', padding: '24px' }}>Loading top patrons...</p>
          ) : leaderboard.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-3)', padding: '24px' }}>No top patrons yet. Be the first to fuel ₹100 or ₹500!</p>
          ) : (
            leaderboard.map((donor) => (
              <div key={donor.id} className="donor-card">
                <div className="donor-card-top">
                  <div className="donor-card-left">
                    <div className="donor-avatar-circle">
                      {donor.tier === 'diamond' ? '💎' : '🥇'}
                    </div>
                    <div className="donor-name-block">
                      <span className="donor-name">{donor.name}</span>
                      <span className="donor-location">
                        <span>📍</span>
                        <span>{donor.college || 'Aspirant'}</span>
                      </span>
                    </div>
                  </div>
                  <span className="donor-amount-badge">{donor.amount}</span>
                </div>

                {donor.note && (
                  <p className="donor-tagline-quote">"{donor.note}"</p>
                )}

                <div className="donor-card-footer">
                  <span>Verified Patron ✓</span>
                  <span>{donor.date}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Recent Donors */}
      {activeTab === 'recent' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Filter Bar */}
          <div className="community-filter-bar">
            <input
              type="text"
              className="community-search-input"
              placeholder="🔍 Search by name or city..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            <select
              className="community-tier-select"
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
            >
              <option value="all">All Tiers</option>
              <option value="diamond">💎 Diamond (₹500+)</option>
              <option value="gold">🥇 Gold (₹100+)</option>
              <option value="chai">☕ Chai (₹20)</option>
            </select>
          </div>

          <div className="donors-list">
            {recentLoading && recentDonors.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-3)', padding: '24px' }}>Loading contributions...</p>
            ) : recentDonors.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-3)', padding: '24px' }}>No donations found matching criteria.</p>
            ) : (
              recentDonors.map((d) => (
                <div key={d.id} className="donor-card">
                  <div className="donor-card-top">
                    <div className="donor-card-left">
                      <div className="donor-avatar-circle">
                        {d.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="donor-name-block">
                        <span className="donor-name">{d.name}</span>
                        <span className="donor-location">
                          <span>📍</span>
                          <span>{d.college || 'Student'}</span>
                        </span>
                      </div>
                    </div>
                    <span className="donor-amount-badge">{d.amount}</span>
                  </div>

                  {d.note && (
                    <p className="donor-tagline-quote">"{d.note}"</p>
                  )}

                  <div className="donor-card-footer">
                    <span>Verified ✓</span>
                    <span>{d.date}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {recentHasMore && (
            <button
              type="button"
              className="btn-result-secondary"
              style={{ width: '100%', marginTop: '8px' }}
              onClick={() => fetchRecent(recentPage + 1, selectedTier, searchQuery, true)}
              disabled={recentLoading}
            >
              {recentLoading ? 'Loading more...' : 'Load More Donors ↓'}
            </button>
          )}
        </div>
      )}

      {/* Tab 3: Reviews */}
      {activeTab === 'reviews' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-1)' }}>
                ⭐ {reviewsData.average_rating || 4.9} / 5.0
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>
                ({reviewsData.total_verified || 47} verified aspirants)
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                className="community-tier-select"
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
              >
                <option value="all">All Exams</option>
                <option value="JEE">JEE Main &amp; Adv</option>
                <option value="NEET">NEET UG</option>
                <option value="UPSC">UPSC Civil Services</option>
                <option value="GATE">GATE</option>
                <option value="College">College Notes</option>
              </select>

              {onOpenWriteReview && (
                <button
                  type="button"
                  className="btn-result-secondary"
                  onClick={onOpenWriteReview}
                  style={{ padding: '7px 12px', fontSize: '12.5px' }}
                >
                  ✍️ Write Review
                </button>
              )}
            </div>
          </div>

          <div className="donors-list">
            {reviewsLoading ? (
              <p style={{ textAlign: 'center', color: 'var(--text-3)', padding: '24px' }}>Loading reviews...</p>
            ) : reviewsData.reviews.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-3)', padding: '24px' }}>No reviews found for this exam category.</p>
            ) : (
              reviewsData.reviews.map((r) => (
                <div key={r.id} className="review-card">
                  <div className="review-card-top">
                    <div className="review-student-info">
                      <span className="review-student-name">{r.student_name}</span>
                      <span className="review-target-exam">
                        {r.exam_target} {r.city ? `• 📍 ${r.city}` : ''}
                      </span>
                    </div>
                    <div className="review-stars">
                      {'★'.repeat(r.rating || 5)}
                    </div>
                  </div>
                  <p className="review-body-text">"{r.review_text}"</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
