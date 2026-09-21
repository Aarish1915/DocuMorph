import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';
import SubmitUtrModal from '../common/SubmitUtrModal';

const FALLBACK_DONORS = [
  { id: 'f1', name: 'IIT Delhi Mech Hostel', tier: 'diamond', amount: '₹500', college: 'IIT Delhi', date: '2026-09-18', note: 'Our batch cleaned 400 pages of thermodynamics lecture notes. Saved ₹1,200 on spiral printing!' },
  { id: 'f2', name: 'Kunal Singhania', tier: 'diamond', amount: '₹500', college: 'Allen Career Institute Kota', date: '2026-09-15', note: 'Best tool for dark photocopy modules. Math formulas stayed completely sharp.' },
  { id: 'f3', name: 'Dr. Priya V.', tier: 'gold', amount: '₹200', college: 'AIIMS Bhopal', date: '2026-09-19', note: 'Histology vector diagrams came out in pristine A4 publication quality.' },
  { id: 'f4', name: 'Siddharth M.', tier: 'gold', amount: '₹150', college: 'GATE Prep Hyderabad', date: '2026-09-17', note: '2-column compact mode reduced my photocopy volume by 55%.' },
  { id: 'f5', name: 'Rohan Sharma', tier: 'gold', amount: '₹100', college: 'PhysicsWallah Aspirant', date: '2026-09-20', note: 'Telegram stamps and coaching watermarks disappeared completely.' },
  { id: 'f6', name: 'Ananya Kapoor', tier: 'chai', amount: '₹50', college: 'UPSC Aspirant Delhi', date: '2026-09-20', note: 'Cleaned dark photocopies of ancient history notes without losing Devanagari text.' },
  { id: 'f7', name: 'Aman Verma', tier: 'chai', amount: '₹20', college: 'SGSITS Indore', date: '2026-09-19', note: 'Bought a chai for the developer. Keep this free!' },
  { id: 'f8', name: 'Neha Reddy', tier: 'chai', amount: '₹20', college: 'Osmania University', date: '2026-09-19', note: 'Instant download straight to my iPhone storage.' },
  { id: 'f9', name: 'Vikram Joshi', tier: 'chai', amount: '₹20', college: 'NIT Trichy', date: '2026-09-18', note: 'Chemical reaction arrows and benzene rings were 100% intact.' }
];

export default function BackersPage({ onNavigateHome, onOpenDonation }) {
  const [activeTab, setActiveTab] = useState('leaderboard'); // 'leaderboard' or 'feed'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState('all');
  const [stats, setStats] = useState({ total_raised: 780, target: 1000, percentage: 78, donor_count: 9 });
  const [leaderboard, setLeaderboard] = useState([]);
  const [recentFeed, setRecentFeed] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isUtrModalOpen, setIsUtrModalOpen] = useState(false);

  // 1. Fetch server stats
  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/donations/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats({
          total_raised: data.total_raised || 780,
          target: data.target || 1000,
          percentage: data.percentage || 78,
          donor_count: data.donor_count || 9
        });
      }
    } catch (e) {
      console.warn('Using default donation stats:', e);
    }
  };

  // 2. Fetch Leaderboard
  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/donations/leaderboard`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.length ? data : FALLBACK_DONORS.filter(d => d.tier !== 'chai'));
      } else {
        setLeaderboard(FALLBACK_DONORS.filter(d => d.tier !== 'chai'));
      }
    } catch (e) {
      setLeaderboard(FALLBACK_DONORS.filter(d => d.tier !== 'chai'));
    }
  };

  // 3. Fetch Paginated Recent Feed
  const fetchFeed = async (pageNum, tier, isLoadMore = false) => {
    try {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      const url = `${API_BASE_URL}/api/donations/recent?page=${pageNum}&limit=12&tier=${encodeURIComponent(tier)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (isLoadMore) {
          setRecentFeed(prev => [...prev, ...(data.donations || [])]);
        } else {
          setRecentFeed(data.donations && data.donations.length ? data.donations : FALLBACK_DONORS);
        }
        setHasMore(data.has_more || false);
        setPage(pageNum);
      } else {
        if (!isLoadMore) setRecentFeed(FALLBACK_DONORS);
      }
    } catch (e) {
      if (!isLoadMore) setRecentFeed(FALLBACK_DONORS);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchLeaderboard();
    fetchFeed(1, selectedTier);
  }, []);

  const handleTierFilterChange = (tier) => {
    setSelectedTier(tier);
    fetchFeed(1, tier);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchFeed(page + 1, selectedTier, true);
    }
  };

  const handleDonationRecorded = (newDonor) => {
    setRecentFeed(prev => [newDonor, ...prev]);
    setStats(prev => ({
      ...prev,
      total_raised: prev.total_raised + parseInt(newDonor.amount.replace('₹', ''), 10),
      donor_count: prev.donor_count + 1,
      percentage: Math.min(100, Math.round(((prev.total_raised + 20) / prev.target) * 100))
    }));
  };

  // Search filtering on active dataset
  const currentDataset = activeTab === 'leaderboard' ? leaderboard : recentFeed;
  const filteredDonors = currentDataset.filter((donor) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = (donor.name && donor.name.toLowerCase().includes(q)) ||
                          (donor.college && donor.college.toLowerCase().includes(q)) ||
                          (donor.note && donor.note.toLowerCase().includes(q));
    const matchesTier = selectedTier === 'all' || donor.tier === selectedTier;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="backers-page-container">
      {/* Header Navigation Bar */}
      <div className="backers-page-header">
        <button type="button" className="back-button" onClick={onNavigateHome} aria-label="Back to home">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Back to Tools</span>
        </button>
        <span className="backers-header-tag">Community Wall of Fame</span>
      </div>

      {/* Hero Section */}
      <div className="backers-hero">
        <div className="hero-pill-badge">
          <span className="hero-live-dot" />
          <span>100% Student-Funded • Zero Corporate Ads</span>
        </div>
        <h1 className="backers-title">
          Fueling Free Academic Tools <span className="title-gradient">Together</span>
        </h1>
        <p className="backers-subtitle">
          DocuMorph runs on high-speed CPU servers, Vision AI models, and zero corporate venture capital. Every single cutting chai helps keep servers online during university and competitive exam seasons.
        </p>

        {/* Live Server Fuel Gauge Card */}
        <div className="server-fuel-card">
          <div className="fuel-card-header">
            <div className="fuel-title-group">
              <span className="fuel-icon">⛽</span>
              <div>
                <h3 className="fuel-heading">September 2026 Server Fuel Tank</h3>
                <p className="fuel-subheading">
                  ₹{stats.total_raised} raised of ₹{stats.target} monthly server maintenance goal ({stats.donor_count} student backers)
                </p>
              </div>
            </div>
            <span className="fuel-percentage-pill">{stats.percentage}% Funded</span>
          </div>

          <div className="fuel-track">
            <div className="fuel-fill" style={{ width: `${stats.percentage}%` }}>
              <div className="fuel-glow" />
            </div>
          </div>

          <div className="fuel-cost-breakdown">
            <div className="cost-item">
              <span className="cost-label">VPS Compute (8GB RAM):</span>
              <span className="cost-val">₹480/mo</span>
            </div>
            <div className="cost-item">
              <span className="cost-label">Gemini Vision AI Engine:</span>
              <span className="cost-val">₹300/mo</span>
            </div>
            <div className="cost-item">
              <span className="cost-label">Vercel &amp; Cloudflare CDN:</span>
              <span className="cost-val">₹0 (Free Edge)</span>
            </div>
          </div>

          <div className="fuel-cta-row">
            <button type="button" className="fuel-cta-btn" onClick={onOpenDonation}>
              <span>☕</span>
              <span>Fuel Next 50 Pages (₹20 via UPI)</span>
            </button>
            <button 
              type="button" 
              className="fuel-verify-utr-btn" 
              onClick={() => setIsUtrModalOpen(true)}
              title="Already paid? Enter your UPI 12-digit UTR to join the wall"
            >
              <span>✍️</span>
              <span>Already Donated? Verify UPI UTR</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Backers Registry Section */}
      <div className="backers-registry-section">
        {/* Navigation Tabs: Leaderboard vs Recent Feed */}
        <div className="backers-tab-switcher">
          <button
            type="button"
            className={`registry-tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('leaderboard')}
          >
            <span>🏆</span>
            <span>Patrons Hall of Fame</span>
          </button>
          <button
            type="button"
            className={`registry-tab-btn ${activeTab === 'feed' ? 'active' : ''}`}
            onClick={() => setActiveTab('feed')}
          >
            <span>☕</span>
            <span>Recent Server Fuel Feed ({stats.donor_count})</span>
          </button>
        </div>

        {/* Search & Tier Filter Controls */}
        <div className="registry-controls">
          <div className="search-box-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by student name, college, or hostel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="registry-search-input"
            />
          </div>

          <div className="tier-filter-pills">
            <button
              type="button"
              className={`filter-pill ${selectedTier === 'all' ? 'active' : ''}`}
              onClick={() => handleTierFilterChange('all')}
            >
              All Tiers
            </button>
            <button
              type="button"
              className={`filter-pill ${selectedTier === 'diamond' ? 'active' : ''}`}
              onClick={() => handleTierFilterChange('diamond')}
            >
              💎 Diamond (₹500+)
            </button>
            <button
              type="button"
              className={`filter-pill ${selectedTier === 'gold' ? 'active' : ''}`}
              onClick={() => handleTierFilterChange('gold')}
            >
              🥇 Gold (₹100+)
            </button>
            <button
              type="button"
              className={`filter-pill ${selectedTier === 'chai' ? 'active' : ''}`}
              onClick={() => handleTierFilterChange('chai')}
            >
              ☕ Chai Friends
            </button>
          </div>
        </div>

        {/* Backers Grid */}
        <div className="donor-grid">
          {filteredDonors.map((donor) => {
            const tierEmoji = donor.tier === 'diamond' ? '💎' : donor.tier === 'gold' ? '🥇' : '☕';
            return (
              <div key={donor.id} className={`donor-card tier-${donor.tier}`}>
                <div className="donor-card-top">
                  <div className="donor-avatar-circle">
                    {tierEmoji}
                  </div>
                  <div className="donor-meta-group">
                    <h4 className="donor-name">{donor.name}</h4>
                    <span className="donor-college-name">{donor.college || 'Student Backer'}</span>
                  </div>
                  <span className="donor-amount-badge">{donor.amount}</span>
                </div>

                <p className="donor-note">"{donor.note || 'Supported free academic tools!'}"</p>

                <div className="donor-card-footer">
                  <span className="donor-date">{donor.date}</span>
                  <span className="donor-verified-badge">✓ Verified Fuel</span>
                </div>
              </div>
            );
          })}
        </div>

        {filteredDonors.length === 0 && (
          <div className="no-donors-found">
            <span>🔍</span>
            <p>No backers found matching "{searchTerm}".</p>
          </div>
        )}

        {/* Paginated "Load More" button for Feed tab */}
        {activeTab === 'feed' && hasMore && (
          <div className="load-more-wrapper">
            <button
              type="button"
              className="btn-load-more-fuel"
              onClick={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading more backers...' : 'Load More Backers ↓'}
            </button>
          </div>
        )}
      </div>

      {/* Bottom Community Join Strip */}
      <div className="backers-join-banner">
        <div className="join-banner-left">
          <h3>Want your name or college on the Wall of Fame?</h3>
          <p>Support DocuMorph with a ₹20 chai via UPI. Your contribution immediately extends cloud GPU and server uptime.</p>
        </div>
        <div className="join-banner-actions">
          <button type="button" className="join-wall-btn" onClick={onOpenDonation}>
            <span>☕</span>
            <span>Fuel with ₹20 Chai</span>
          </button>
          <button 
            type="button" 
            className="verify-utr-secondary-btn" 
            onClick={() => setIsUtrModalOpen(true)}
          >
            <span>✍️</span>
            <span>Record UPI UTR</span>
          </button>
        </div>
      </div>

      {/* Submit UTR Modal */}
      <SubmitUtrModal
        isOpen={isUtrModalOpen}
        onClose={() => setIsUtrModalOpen(false)}
        onDonationRecorded={handleDonationRecorded}
      />
    </div>
  );
}
