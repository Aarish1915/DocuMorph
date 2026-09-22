import React, { useState, useEffect } from 'react';
import { getStoredConfig, probeBackend, API_BASE } from '../../config';

export default function AdminDashboardModal({ isOpen, onClose, standalone = false }) {
  if (!isOpen) return null;
  return <AdminDashboardModalDialog onClose={onClose} standalone={standalone} />;
}

function AdminDashboardModalDialog({ onClose, standalone = false }) {
  // Authentication State (JWT Bearer Token persisted in sessionStorage)
  const [token, setToken] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('documorph_admin_jwt') || '';
    }
    return '';
  });

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard state
  const [activeTab, setActiveTab] = useState('monitoring'); // 'monitoring' | 'jobs' | 'engine'
  const [adminStatus, setAdminStatus] = useState(null);
  const [adminJobs, setAdminJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [adminDates, setAdminDates] = useState([]);
  const [selectedAdminDate, setSelectedAdminDate] = useState(null);
  const [adminPage, setAdminPage] = useState(1);
  const [adminHasMore, setAdminHasMore] = useState(false);
  const [adminLoadingMore, setAdminLoadingMore] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [sweepMsg, setSweepMsg] = useState('');
  const [isSweeping, setIsSweeping] = useState(false);

  // Ground Reality & Telemetry Report Inspection
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportDetailTab, setReportDetailTab] = useState('telemetry'); // 'telemetry' | 'intermediate'
  const [loadingReport, setLoadingReport] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);

  // Student Reviews Moderation
  const [adminReviews, setAdminReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewActionMsg, setReviewActionMsg] = useState('');
  const [newReview, setNewReview] = useState({
    student_name: '',
    exam_target: 'JEE Advanced / Main',
    city: '',
    rating: 5,
    review_text: '',
    verified_student: true,
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Engine routing settings
  const [config, setConfig] = useState(() => getStoredConfig());
  const [customKey, setCustomKey] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('documorph_custom_api_key') || '' : ''));

  const getTargetApiUrl = () => {
    return API_BASE || 'http://localhost:8000';
  };

  const handleViewReport = async (jobId, silent = false) => {
    if (!token) return;
    if (!silent) setLoadingReport(true);
    try {
      const activeNode = await probeBackend();
      const base = activeNode.url || getTargetApiUrl();
      const res = await fetch(`${base}/api/internal/admin/jobs/${jobId}/telemetry`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedReport(data);
        if (!silent) setReportDetailTab('telemetry');
      } else if (!silent) {
        alert('Could not fetch telemetry report for job ' + jobId);
      }
    } catch (e) {
      if (!silent) console.error('Failed to load telemetry report:', e);
    } finally {
      if (!silent) setLoadingReport(false);
    }
  };

  const handleCopyReportMarkdown = () => {
    if (!selectedReport?.report_markdown) return;
    navigator.clipboard.writeText(selectedReport.report_markdown);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  const handleDownloadReport = () => {
    if (!selectedReport?.report_markdown) return;
    const blob = new Blob([selectedReport.report_markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `REPORT_${selectedReport.job_id}_${selectedReport.file_name}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Authenticate Admin
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const activeNode = await probeBackend();
      const base = activeNode.url || getTargetApiUrl();
      const res = await fetch(`${base}/api/internal/admin-auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.detail || 'Authentication failed. Please check credentials.');
        return;
      }

      sessionStorage.setItem('documorph_admin_jwt', data.access_token);
      setToken(data.access_token);
      setPassword('');
    } catch {
      setLoginError('Cannot connect to backend server. Make sure backend is running.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('documorph_admin_jwt');
    setToken('');
    setAdminStatus(null);
    setAdminJobs([]);
  };

  // Load Status with JWT
  const loadStatus = async (authToken = token) => {
    if (!authToken) return;
    try {
      const activeNode = await probeBackend();
      const base = activeNode.url || getTargetApiUrl();
      const res = await fetch(`${base}/api/internal/admin/status`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAdminStatus(data);
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (e) {
      console.error('Failed to load admin status:', e);
    }
  };

  // Load Admin Job Dates
  const loadAdminDates = async (authToken = token) => {
    if (!authToken) return;
    try {
      const activeNode = await probeBackend();
      const base = activeNode.url || getTargetApiUrl();
      const res = await fetch(`${base}/api/internal/admin/jobs/dates`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAdminDates(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Failed to load admin dates:', e);
    }
  };

  // Load Paginated Jobs with JWT and Date Filtering
  const loadJobs = async (authToken = token, targetDate = selectedAdminDate, page = 1, append = false, silent = false) => {
    if (!authToken) return;
    if (!silent) {
      if (append) setAdminLoadingMore(true);
      else setLoadingJobs(true);
    }
    try {
      const activeNode = await probeBackend();
      const base = activeNode.url || getTargetApiUrl();
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (targetDate) params.append('date', targetDate);

      const res = await fetch(`${base}/api/internal/admin/jobs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        const jobsList = Array.isArray(data) ? data : (data.jobs || []);
        const hasMore = data.has_more ?? false;
        setAdminJobs(prev => append ? [...prev, ...jobsList] : jobsList);
        setAdminHasMore(hasMore);
        setAdminPage(page);
        setSelectedAdminDate(targetDate);
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (e) {
      console.error('Failed to load admin jobs:', e);
    } finally {
      if (!silent) {
        setLoadingJobs(false);
        setAdminLoadingMore(false);
      }
    }
  };

  const handleSelectAdminDate = (date) => {
    setSelectedAdminDate(date);
    setAdminPage(1);
    loadJobs(token, date, 1, false);
  };

  const handleLoadMoreAdmin = () => {
    if (adminLoadingMore || !adminHasMore) return;
    const nextPage = adminPage + 1;
    loadJobs(token, selectedAdminDate, nextPage, true);
  };

  // Immediate RAM Sweep with JWT
  const handleReclaimRam = async () => {
    if (!token) return;
    setIsSweeping(true);
    setSweepMsg('');
    try {
      const activeNode = await probeBackend();
      const base = activeNode.url || getTargetApiUrl();
      const res = await fetch(`${base}/api/internal/admin/reclaim-ram`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSweepMsg(`Reclaimed: Before ${data.before_mb || data.rss_before_mb}MB → After ${data.after_mb || data.rss_after_mb}MB`);
        loadStatus(token);
      } else {
        setSweepMsg('Failed to trigger RAM reclamation');
      }
    } catch {
      setSweepMsg('Network error while sweeping RAM');
    } finally {
      setIsSweeping(false);
      setTimeout(() => setSweepMsg(''), 5000);
    }
  };

  // Load Admin Reviews
  const loadAdminReviews = async (authToken = token, silent = false) => {
    if (!authToken) return;
    if (!silent) setLoadingReviews(true);
    try {
      const activeNode = await probeBackend();
      const base = activeNode.url || getTargetApiUrl();
      const res = await fetch(`${base}/api/internal/admin/reviews`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAdminReviews(data.reviews || []);
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (e) {
      console.error('Failed to load admin reviews:', e);
    } finally {
      if (!silent) setLoadingReviews(false);
    }
  };

  // Delete Review
  const handleDeleteReview = async (reviewId) => {
    if (!token) return;
    if (!window.confirm(`Are you sure you want to permanently delete review ${reviewId}?`)) return;
    try {
      const activeNode = await probeBackend();
      const base = activeNode.url || getTargetApiUrl();
      const res = await fetch(`${base}/api/internal/admin/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setReviewActionMsg(`Deleted review ${reviewId} successfully!`);
        setTimeout(() => setReviewActionMsg(''), 4000);
        loadAdminReviews(token, true);
      } else {
        alert('Failed to delete review');
      }
    } catch (e) {
      alert('Network error deleting review: ' + e.message);
    }
  };

  // Emergency Purge Leaked Keys
  const handleEmergencyPurge = async () => {
    if (!token) return;
    if (!window.confirm('Run emergency purge of any reviews containing API keys, mcpServers, or credentials?')) return;
    try {
      const activeNode = await probeBackend();
      const base = activeNode.url || getTargetApiUrl();
      const res = await fetch(`${base}/api/internal/admin/reviews/purge-leaks`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReviewActionMsg(`Purged ${data.purged_count} review(s) containing credentials!`);
        setTimeout(() => setReviewActionMsg(''), 5000);
        loadAdminReviews(token, true);
      } else {
        alert('Failed to run emergency purge');
      }
    } catch (e) {
      alert('Purge error: ' + e.message);
    }
  };

  // Create Review from Admin Panel
  const handleCreateReview = async (e) => {
    if (e) e.preventDefault();
    if (!token || !newReview.student_name || !newReview.review_text) return;
    setIsSubmittingReview(true);
    try {
      const activeNode = await probeBackend();
      const base = activeNode.url || getTargetApiUrl();
      const res = await fetch(`${base}/api/internal/admin/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newReview),
      });
      if (res.ok) {
        setReviewActionMsg(`Added verified review for ${newReview.student_name}!`);
        setNewReview({
          student_name: '',
          exam_target: 'JEE Advanced / Main',
          city: '',
          rating: 5,
          review_text: '',
          verified_student: true,
        });
        setTimeout(() => setReviewActionMsg(''), 4000);
        loadAdminReviews(token, true);
      } else {
        alert('Failed to create review');
      }
    } catch (e) {
      alert('Error creating review: ' + e.message);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Effect when authenticated: load initial data
  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    const fetchInitialData = async () => {
      try {
        await Promise.all([
          loadStatus(token),
          loadAdminDates(token),
          loadJobs(token, null, 1, false)
        ]);
      } catch (e) {
        console.error('Failed to load initial admin data:', e);
      }
    };

    fetchInitialData();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Auto-refresh timer: Real-time telemetry status & jobs queue polling without UI flickering
  useEffect(() => {
    let interval;
    if (token && autoRefresh) {
      interval = setInterval(() => {
        loadStatus(token);
        if (activeTab === 'jobs' && adminPage === 1) {
          loadJobs(token, selectedAdminDate, 1, false, true);
        }
        if (selectedReport && (selectedReport.status === 'PROCESSING' || selectedReport.status === 'QUEUED')) {
          handleViewReport(selectedReport.job_id, true);
        }
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [token, autoRefresh, activeTab, selectedAdminDate, adminPage, selectedReport]);

  const handleSaveEngine = (newPref) => {
    const updated = { ...config, preferred: newPref };
    setConfig(updated);
    localStorage.setItem('documorph_backend_pref', newPref);
    probeBackend(true);
  };

  const handleSaveCustomKey = () => {
    localStorage.setItem('documorph_custom_api_key', customKey.trim());
  };

  return (
    <div
      className={standalone ? "admin-standalone-wrapper" : "admin-modal-overlay"}
      onClick={standalone ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      style={standalone ? { minHeight: '100vh', width: '100%', background: 'var(--bg-main, #0f172a)', padding: '24px 16px', boxSizing: 'border-box' } : undefined}
    >
      <div
        className="admin-modal-window"
        onClick={(e) => e.stopPropagation()}
        style={standalone ? { maxWidth: '1080px', margin: '0 auto', minHeight: '85vh' } : undefined}
      >
        {/* Modal Header */}
        <div className="admin-modal-header">
          <div className="admin-title-group">
            <div className="admin-badge-icon">🛠️</div>
            <div>
              <h2 className="admin-title">DocuMorph Owner &amp; System Control Hub</h2>
              <p className="admin-subtitle">
                {token ? 'Authenticated Session • Real-Time Telemetry & Process Control' : 'Cryptographically Restricted Portal'}
              </p>
            </div>
          </div>
          {!standalone && (
            <button className="admin-close-btn" onClick={onClose} aria-label="Close Admin Modal">✕</button>
          )}
          {standalone && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#cbd5e1',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                ← Back to Site
              </button>
              {token && (
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#f87171',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Sign Out
                </button>
              )}
            </div>
          )}
        </div>

        {/* Not Authenticated: Render Login Form */}
        {!token ? (
          <div className="admin-tab-content" style={{ padding: '32px 24px', maxWidth: '440px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>🔒</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px' }}>System Administrator Access</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary, #94a3b8)', lineHeight: '1.5' }}>
                This portal is strictly segregated from student tools. Enter owner credentials to manage infrastructure and view live queue telemetry.
              </p>
            </div>

            {loginError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '16px',
                color: '#f87171',
                fontSize: '0.85rem'
              }}>
                ⚠️ {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '6px' }}>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  className="admin-input-text"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '6px' }}>Master Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="admin-input-text"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                style={{
                  marginTop: '8px',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  background: 'var(--primary-accent, #3b82f6)',
                  color: '#fff',
                  fontWeight: '600',
                  border: 'none',
                  cursor: isLoggingIn ? 'wait' : 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                {isLoggingIn ? 'Verifying Credentials...' : 'Sign In as Owner 🛡️'}
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Dashboard View */
          <>
            {/* Tab Navigation & Owner Bar */}
            <div className="admin-tabs-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button 
                  className={`admin-tab-btn ${activeTab === 'monitoring' ? 'active' : ''}`}
                  onClick={() => setActiveTab('monitoring')}
                >
                  📊 Live System Monitoring
                </button>
                <button 
                  className={`admin-tab-btn ${activeTab === 'jobs' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('jobs'); loadJobs(); }}
                >
                  📁 Queue & Jobs Audit ({adminJobs.length})
                </button>
                <button 
                  className={`admin-tab-btn ${activeTab === 'engine' ? 'active' : ''}`}
                  onClick={() => setActiveTab('engine')}
                >
                  ⚙️ Server & Routing Controls
                </button>
                <button 
                  className={`admin-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('reviews'); loadAdminReviews(); }}
                >
                  ⭐ Student Reviews ({adminReviews.length})
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', paddingRight: '12px' }}>
                <button
                  type="button"
                  onClick={handleReclaimRam}
                  disabled={isSweeping}
                  style={{
                    background: 'rgba(59, 130, 246, 0.15)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    color: 'var(--primary-accent, #60a5fa)',
                    cursor: isSweeping ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Trigger immediate gc.collect() and Linux glibc malloc_trim(0)"
                >
                  🧹 {isSweeping ? 'Sweeping...' : 'Reclaim RAM'}
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    background: 'none',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    color: '#f87171',
                    cursor: 'pointer'
                  }}
                >
                  Sign Out ↗
                </button>
              </div>
            </div>

            {sweepMsg && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                padding: '6px 16px',
                fontSize: '0.8rem',
                textAlign: 'center',
                borderBottom: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                ✓ {sweepMsg}
              </div>
            )}

            {/* Tab 1: Live Monitoring */}
            {activeTab === 'monitoring' && (
              <div className="admin-tab-content">
                <div className="admin-action-strip">
                  <div className="admin-strip-left">
                    <span className="live-pulse-dot"></span>
                    <span className="live-status-label">
                      Worker: <strong>{adminStatus?.worker_alive ? '🟢 Active Daemon' : '⚪ Standby'}</strong>
                    </span>
                    <span className="live-uptime">
                      Database: <strong>{adminStatus?.database?.engine || 'SQLite WAL'}</strong>
                    </span>
                    <span className="live-uptime">
                      Storage: <strong>{adminStatus?.storage_backend || 'Local FS'}</strong>
                    </span>
                  </div>
                  <div className="admin-strip-right">
                    <label className="admin-toggle-label">
                      <input 
                        type="checkbox" 
                        checked={autoRefresh} 
                        onChange={(e) => setAutoRefresh(e.target.checked)} 
                      />
                      Auto-refresh (3s)
                    </label>
                    <button className="btn-admin-refresh" onClick={() => loadStatus()}>
                      🔄 Refresh
                    </button>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="admin-metrics-grid">
                  <div className="metric-card">
                    <span className="metric-label">Process RAM</span>
                    <span className="metric-val">{adminStatus?.memory?.ram_used_mb || 0} MB</span>
                    <span className="metric-hint">Limit: 512 MB (Render Free)</span>
                  </div>
                  <div className="metric-card">
                    <span className="metric-label">Process Memory %</span>
                    <span className="metric-val">{adminStatus?.memory?.ram_pct || 0}%</span>
                    <span className="metric-hint">Active OS RSS Footprint</span>
                  </div>
                  <div className="metric-card">
                    <span className="metric-label">Active Queue</span>
                    <span className="metric-val highlight">{adminStatus?.queue?.queued || 0} queued</span>
                    <span className="metric-hint">{adminStatus?.queue?.processing || 0} currently processing</span>
                  </div>
                  <div className="metric-card">
                    <span className="metric-label">Completed Jobs</span>
                    <span className="metric-val success">{adminStatus?.queue?.completed || 0} done</span>
                    <span className="metric-hint">{adminStatus?.queue?.failed || 0} failed / aborted</span>
                  </div>
                </div>

                {/* System Infrastructure Details */}
                <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg-secondary, rgba(255,255,255,0.03))', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', fontWeight: '600' }}>🔒 Security & Infrastructure Specs</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)', lineHeight: '1.8' }}>
                    <li><strong>Authentication:</strong> Bcrypt password hash + signed JWT (8h expiry) with rate-limiting lockout guard.</li>
                    <li><strong>Queue Engine:</strong> ACID dual-backend ({adminStatus?.database?.engine || 'SQLite WAL'} with SKIP LOCKED on Postgres).</li>
                    <li><strong>Storage Backend:</strong> Abstract Storage Provider ({adminStatus?.storage_backend || 'Local FS'} with path-traversal sanitization).</li>
                    <li><strong>RAM Sweeper:</strong> Scheduled daemon + manual Linux glibc <code>malloc_trim(0)</code> hook.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Tab 2: Queue & Jobs Audit */}
            {activeTab === 'jobs' && (
              <div className="admin-tab-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #94a3b8)' }}>
                    Showing all jobs from central database repository.
                  </span>
                  <button 
                    type="button" 
                    onClick={() => loadJobs()} 
                    disabled={loadingJobs}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      border: '1px solid var(--border-color, #444)',
                      background: 'none',
                      color: 'var(--text-primary, #fff)'
                    }}
                  >
                    {loadingJobs ? 'Refreshing...' : '🔄 Refresh Jobs'}
                  </button>
                </div>

                {/* Calendar Date Filter Chips */}
                {!selectedReport && adminDates && adminDates.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '14px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #94a3b8)', whiteSpace: 'nowrap' }}>Date:</span>
                    <button
                      type="button"
                      onClick={() => handleSelectAdminDate(null)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '16px',
                        fontSize: '0.75rem',
                        fontWeight: !selectedAdminDate ? '600' : '400',
                        background: !selectedAdminDate ? 'var(--color-primary, #4f46e5)' : 'rgba(255,255,255,0.06)',
                        color: !selectedAdminDate ? '#fff' : 'var(--text-secondary, #94a3b8)',
                        border: !selectedAdminDate ? '1px solid transparent' : '1px solid rgba(255,255,255,0.1)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      All Time
                    </button>
                    {adminDates.map(d => (
                      <button
                        key={d.date}
                        type="button"
                        onClick={() => handleSelectAdminDate(d.date)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '16px',
                          fontSize: '0.75rem',
                          fontWeight: selectedAdminDate === d.date ? '600' : '400',
                          background: selectedAdminDate === d.date ? 'var(--color-primary, #4f46e5)' : 'rgba(255,255,255,0.06)',
                          color: selectedAdminDate === d.date ? '#fff' : 'var(--text-secondary, #94a3b8)',
                          border: selectedAdminDate === d.date ? '1px solid transparent' : '1px solid rgba(255,255,255,0.1)',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        📅 {d.date}
                        <span style={{ fontSize: '0.7rem', opacity: 0.75 }}>({d.count})</span>
                      </button>
                    ))}
                  </div>
                )}

                {selectedReport ? (
                  /* Ground Reality & Telemetry Report & Intermediate Inspection View */
                  <div className="telemetry-report-view" style={{
                    background: 'var(--bg-secondary, rgba(255,255,255,0.03))',
                    border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                    borderRadius: '8px',
                    padding: '20px',
                    color: 'var(--text-primary, #fff)'
                  }}>
                    {/* Header Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.1))', paddingBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedReport(null)}
                        style={{
                          background: 'none',
                          border: '1px solid var(--border-color, rgba(255,255,255,0.2))',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          color: 'var(--text-primary, #fff)',
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        ← Back to Jobs List
                      </button>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {selectedReport.before_after?.download_url && (
                          <a
                            href={`${getTargetApiUrl()}${selectedReport.before_after.download_url}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              background: 'rgba(16, 185, 129, 0.2)',
                              border: '1px solid rgba(16, 185, 129, 0.4)',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              color: '#34d399',
                              textDecoration: 'none',
                              fontSize: '0.8rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            ⬇️ Download Result ({selectedReport.metrics?.out_size_kb} KB)
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={handleCopyReportMarkdown}
                          style={{
                            background: copiedReport ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                            border: '1px solid var(--border-color, rgba(255,255,255,0.2))',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            color: copiedReport ? '#34d399' : '#60a5fa',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                        >
                          {copiedReport ? '✓ Copied Markdown!' : '📋 Copy Report (.md)'}
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadReport}
                          style={{
                            background: 'none',
                            border: '1px solid var(--border-color, rgba(255,255,255,0.2))',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            color: 'var(--text-primary, #fff)',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                        >
                          ⬇️ Download Report (.md)
                        </button>
                      </div>
                    </div>

                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span>📄 {selectedReport.file_name}</span>
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: selectedReport.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: selectedReport.status === 'COMPLETED' ? '#34d399' : '#f87171'
                      }}>
                        {selectedReport.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '16px' }}>
                      <strong>Service Type:</strong> <code style={{ color: '#60a5fa' }}>{selectedReport.service_type}</code> &nbsp;|&nbsp; <strong>Language Mode:</strong> <code style={{ color: '#a78bfa' }}>{selectedReport.language_mode}</code> &nbsp;|&nbsp; <strong>Generated:</strong> {selectedReport.created_at}
                    </div>

                    {/* Per-PDF View Mode Switcher Tabs */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setReportDetailTab('telemetry')}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          border: reportDetailTab === 'telemetry' ? '1px solid var(--color-primary, #2563eb)' : '1px solid rgba(255,255,255,0.15)',
                          background: reportDetailTab === 'telemetry' ? 'var(--color-primary, #2563eb)' : 'transparent',
                          color: '#fff'
                        }}
                      >
                        📊 Ground Reality & Telemetry Report
                      </button>
                      <button
                        type="button"
                        onClick={() => setReportDetailTab('intermediate')}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          border: reportDetailTab === 'intermediate' ? '1px solid var(--color-primary, #2563eb)' : '1px solid rgba(255,255,255,0.15)',
                          background: reportDetailTab === 'intermediate' ? 'var(--color-primary, #2563eb)' : 'transparent',
                          color: '#fff'
                        }}
                      >
                        🖼️ Before / After & Intermediate Data ({selectedReport.pages?.length || 0} Pages, {selectedReport.diagrams?.length || 0} Visuals)
                      </button>
                    </div>

                    {/* Tab 1: Telemetry & Performance */}
                    {reportDetailTab === 'telemetry' && (
                      <div>
                        <h4 style={{ margin: '16px 0 8px 0', fontSize: '1rem' }}>1. Performance & Telemetry</h4>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '16px' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)', textAlign: 'left', color: 'var(--text-secondary, #94a3b8)' }}>
                              <th style={{ padding: '8px 6px' }}>Metric</th>
                              <th style={{ padding: '8px 6px' }}>Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>Original Pages</td>
                              <td style={{ padding: '6px 8px' }}>{selectedReport.metrics?.total_pages}</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>Processed Pages</td>
                              <td style={{ padding: '6px 8px' }}>{selectedReport.metrics?.total_pages}</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>Original File Size</td>
                              <td style={{ padding: '6px 8px' }}>{selectedReport.metrics?.orig_size_kb} KB</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>Output File Size</td>
                              <td style={{ padding: '6px 8px' }}>{selectedReport.metrics?.out_size_kb} KB</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>Physical Space / Data Compaction</td>
                              <td style={{ padding: '6px 8px', color: '#34d399', fontWeight: 'bold' }}>{selectedReport.metrics?.compaction_pct}%</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>Processing Latency</td>
                              <td style={{ padding: '6px 8px' }}>{selectedReport.metrics?.latency_seconds} seconds</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>Status</td>
                              <td style={{ padding: '6px 8px', color: '#34d399' }}>✅ {selectedReport.status}</td>
                            </tr>
                          </tbody>
                        </table>

                        <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '16px 0' }} />

                        <h4 style={{ margin: '16px 0 8px 0', fontSize: '1rem' }}>2. Processing Breakdown</h4>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '16px' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)', textAlign: 'left', color: 'var(--text-secondary, #94a3b8)' }}>
                              <th style={{ padding: '8px 6px' }}>Metric</th>
                              <th style={{ padding: '8px 6px' }}>Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>Total Pages</td>
                              <td style={{ padding: '6px 8px' }}>{selectedReport.metrics?.total_pages}</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>Local CPU Pages (Count)</td>
                              <td style={{ padding: '6px 8px' }}>{selectedReport.metrics?.local_pages_count}</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>Vision AI Pages (Count)</td>
                              <td style={{ padding: '6px 8px' }}>{selectedReport.metrics?.ai_pages_count}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>Total API Calls</td>
                              <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>{selectedReport.metrics?.total_api_calls}</td>
                            </tr>
                          </tbody>
                        </table>

                        <h4 style={{ margin: '16px 0 8px 0', fontSize: '1rem' }}>🪙 Token Usage (Gemini 3.5 Flash-Lite)</h4>
                        <ul style={{ margin: '0 0 16px 0', paddingLeft: '20px', fontSize: '0.85rem', lineHeight: '1.8' }}>
                          <li><strong>Input Tokens (Images + Prompt):</strong> {selectedReport.metrics?.tokens_input} tokens</li>
                          <li><strong>Output Tokens (Markdown Text):</strong> {selectedReport.metrics?.tokens_output} tokens</li>
                          <li><strong>Total Cost Equivalent:</strong> {selectedReport.metrics?.cost_usd} USD (Estimated)</li>
                        </ul>

                        <h4 style={{ margin: '16px 0 8px 0', fontSize: '1rem' }}>⏱️ Timing Calculations (Pure Compute)</h4>
                        <ul style={{ margin: '0 0 16px 0', paddingLeft: '20px', fontSize: '0.85rem', lineHeight: '1.8' }}>
                          <li><strong>Total Compute Time:</strong> {selectedReport.metrics?.compute_time_seconds} Seconds</li>
                          <li style={{ color: 'var(--text-secondary, #94a3b8)', fontStyle: 'italic' }}>
                            (Network dropouts and retry delays have been successfully excluded from this time)
                          </li>
                        </ul>
                      </div>
                    )}

                    {/* Tab 2: Before & After and Intermediate Data */}
                    {reportDetailTab === 'intermediate' && (
                      <div>
                        {/* Section A: Before vs After Overview */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                          gap: '14px',
                          marginBottom: '20px'
                        }}>
                          <div style={{
                            padding: '14px',
                            borderRadius: '8px',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.08)'
                          }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #94a3b8)', textTransform: 'uppercase', marginBottom: '6px' }}>
                              Original Document
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '4px' }}>
                              {selectedReport.file_name}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                              Size: <strong>{selectedReport.metrics?.orig_size_kb} KB</strong> &nbsp;|&nbsp; Pages: <strong>{selectedReport.metrics?.total_pages}</strong>
                            </div>
                          </div>

                          <div style={{
                            padding: '14px',
                            borderRadius: '8px',
                            background: 'rgba(16, 185, 129, 0.05)',
                            border: '1px solid rgba(16, 185, 129, 0.2)'
                          }}>
                            <div style={{ fontSize: '0.75rem', color: '#34d399', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                              <span>Output Document</span>
                              <span>{selectedReport.metrics?.compaction_pct}% Compaction</span>
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: '600', color: '#34d399', marginBottom: '4px' }}>
                              {selectedReport.metrics?.out_size_kb} KB
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                              Status: <strong>{selectedReport.status}</strong> &nbsp;|&nbsp; Service: <strong>{selectedReport.service_type}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Section B: Extracted Diagram Crops Gallery */}
                        <div style={{ marginBottom: '24px' }}>
                          <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>🖼️ Extracted Diagrams & Crops</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)' }}>({selectedReport.diagrams?.length || 0} found)</span>
                          </h4>
                          {selectedReport.diagrams && selectedReport.diagrams.length > 0 ? (
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                              gap: '12px'
                            }}>
                              {selectedReport.diagrams.map((diag, dIdx) => (
                                <div
                                  key={diag.filename || dIdx}
                                  style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '6px',
                                    padding: '10px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center'
                                  }}
                                >
                                  {diag.data_url ? (
                                    <img
                                      src={diag.data_url}
                                      alt={diag.filename}
                                      style={{
                                        maxWidth: '100%',
                                        maxHeight: '140px',
                                        objectFit: 'contain',
                                        borderRadius: '4px',
                                        background: '#fff',
                                        padding: '4px',
                                        marginBottom: '8px'
                                      }}
                                    />
                                  ) : (
                                    <div style={{
                                      height: '100px',
                                      width: '100%',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      background: 'rgba(255,255,255,0.05)',
                                      borderRadius: '4px',
                                      marginBottom: '8px',
                                      color: '#94a3b8',
                                      fontSize: '0.8rem'
                                    }}>
                                      🖼️ Diagram Image
                                    </div>
                                  )}
                                  <div style={{ fontSize: '0.75rem', fontWeight: '500', color: '#e2e8f0', textAlign: 'center', wordBreak: 'break-all' }}>
                                    {diag.filename}
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                                    {diag.size_kb} KB
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #94a3b8)', fontStyle: 'italic', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                              No standalone diagram crops were generated for this document.
                            </div>
                          )}
                        </div>

                        {/* Section C: Intermediate Page-by-Page Markdown Preview */}
                        <div>
                          <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>📝 Intermediate Page Markdown</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)' }}>({selectedReport.pages?.length || 0} Pages)</span>
                          </h4>
                          {selectedReport.pages && selectedReport.pages.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              {selectedReport.pages.map((p) => (
                                <div
                                  key={p.page_number}
                                  style={{
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '6px',
                                    padding: '12px',
                                    background: 'rgba(255,255,255,0.02)'
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>Page {p.page_number}</span>
                                      <span style={{
                                        fontSize: '0.7rem',
                                        padding: '1px 6px',
                                        borderRadius: '3px',
                                        background: p.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                        color: p.status === 'COMPLETED' ? '#34d399' : '#f87171'
                                      }}>
                                        {p.status}
                                      </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px', fontSize: '0.75rem' }}>
                                      {p.has_math && (
                                        <span style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', padding: '1px 6px', borderRadius: '3px' }}>
                                          ∑ Math
                                        </span>
                                      )}
                                      {p.has_tables && (
                                        <span style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '1px 6px', borderRadius: '3px' }}>
                                          📊 Tables
                                        </span>
                                      )}
                                      <span style={{ color: 'var(--text-secondary, #94a3b8)' }}>{p.char_count} chars</span>
                                    </div>
                                  </div>
                                  <div style={{
                                    maxHeight: '120px',
                                    overflowY: 'auto',
                                    background: 'rgba(0,0,0,0.25)',
                                    padding: '8px 10px',
                                    borderRadius: '4px',
                                    fontFamily: 'monospace',
                                    fontSize: '0.75rem',
                                    color: '#cbd5e1',
                                    whiteSpace: 'pre-wrap',
                                    lineHeight: '1.4'
                                  }}>
                                    {p.preview || '(Empty text)'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #94a3b8)', fontStyle: 'italic', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                              No per-page intermediate markdown entries in database.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : adminJobs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary, #94a3b8)' }}>
                    No jobs recorded in database yet.
                  </div>
                ) : (
                  <>
                    <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.1))', color: 'var(--text-secondary, #94a3b8)' }}>
                          <th style={{ padding: '8px 6px' }}>PDF Document</th>
                          <th style={{ padding: '8px 6px' }}>Service</th>
                          <th style={{ padding: '8px 6px' }}>Status</th>
                          <th style={{ padding: '8px 6px' }}>Progress</th>
                          <th style={{ padding: '8px 6px' }}>File Size</th>
                          <th style={{ padding: '8px 6px' }}>Created</th>
                          <th style={{ padding: '8px 6px', textAlign: 'right' }}>Telemetry Report</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminJobs.map((j) => (
                          <tr
                            key={j.id}
                            onClick={() => handleViewReport(j.id)}
                            style={{
                              borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.05))',
                              cursor: 'pointer',
                              transition: 'background 0.15s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                            title="Click to view full Telemetry Report & Intermediate Data for this PDF"
                          >
                            <td style={{ padding: '8px 6px' }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewReport(j.id);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--primary-accent, #60a5fa)',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  padding: 0,
                                  fontFamily: 'inherit',
                                  fontSize: 'inherit',
                                  fontWeight: '600',
                                  textDecoration: 'underline'
                                }}
                                title="Click to view Ground Reality & Telemetry Report"
                              >
                                📄 {j.file_path || j.id}
                              </button>
                            </td>
                            <td style={{ padding: '8px 6px' }}>{j.service_type || 'clean_format'}</td>
                            <td style={{ padding: '8px 6px' }}>
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                background: j.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.2)' : j.status === 'ERROR' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                color: j.status === 'COMPLETED' ? '#34d399' : j.status === 'ERROR' ? '#f87171' : '#60a5fa'
                              }}>
                                {j.status}
                              </span>
                            </td>
                            <td style={{ padding: '8px 6px' }}>{j.progress_pct}%</td>
                            <td style={{ padding: '8px 6px' }}>{j.original_file_size ? `${Math.round(j.original_file_size / 1024)} KB` : '—'}</td>
                            <td style={{ padding: '8px 6px', color: 'var(--text-secondary, #94a3b8)' }}>
                              {j.created_at ? new Date(j.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                            </td>
                            <td style={{ padding: '8px 6px', textAlign: 'right' }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewReport(j.id);
                                }}
                                disabled={loadingReport}
                                style={{
                                  background: 'rgba(59, 130, 246, 0.15)',
                                  border: '1px solid rgba(59, 130, 246, 0.3)',
                                  borderRadius: '4px',
                                  padding: '4px 8px',
                                  fontSize: '0.75rem',
                                  color: '#60a5fa',
                                  cursor: loadingReport ? 'wait' : 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                📊 View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {adminHasMore && (
                    <div style={{ textAlign: 'center', marginTop: '16px', paddingBottom: '8px' }}>
                      <button
                        type="button"
                        onClick={handleLoadMoreAdmin}
                        disabled={adminLoadingMore}
                        style={{
                          padding: '8px 20px',
                          borderRadius: '8px',
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          color: 'var(--text-primary, #fff)',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          cursor: adminLoadingMore ? 'wait' : 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {adminLoadingMore ? 'Loading More Jobs...' : '↓ Load More Jobs'}
                      </button>
                    </div>
                  )}
                </>
                )}
              </div>
            )}

            {/* Tab 3: Server & Routing Controls */}
            {activeTab === 'engine' && (
              <div className="admin-tab-content">
                <div className="engine-controls-card">
                  <h3 className="section-title">Compute Node Routing Strategy</h3>
                  <p className="section-desc">
                    Configure how CleanNotes directs OCR extraction and Playwright compiling workloads.
                  </p>

                  <div className="engine-radio-group">
                    <label className={`engine-radio-card ${config.preferred === 'auto' ? 'selected' : ''}`}>
                      <input 
                        type="radio" 
                        name="routing" 
                        checked={config.preferred === 'auto'}
                        onChange={() => handleSaveEngine('auto')} 
                      />
                      <div>
                        <strong>Auto-Detect (Recommended)</strong>
                        <p>Probes Local Engine first (localhost:8000), falls back to Render Cloud.</p>
                      </div>
                    </label>

                    <label className={`engine-radio-card ${config.preferred === 'render' ? 'selected' : ''}`}>
                      <input 
                        type="radio" 
                        name="routing" 
                        checked={config.preferred === 'render'}
                        onChange={() => handleSaveEngine('render')} 
                      />
                      <div>
                        <strong>Force Render Cloud (24/7 Failover)</strong>
                        <p>Always routes through <code>{config.renderUrl || 'https://documorph-v1.onrender.com'}</code>.</p>
                      </div>
                    </label>

                    <label className={`engine-radio-card ${config.preferred === 'laptop' ? 'selected' : ''}`}>
                      <input 
                        type="radio" 
                        name="routing" 
                        checked={config.preferred === 'laptop'}
                        onChange={() => handleSaveEngine('laptop')} 
                      />
                      <div>
                        <strong>Custom Tunnel / Laptop Node</strong>
                        <p>Directs requests to your active Cloudflare Tunnel URL.</p>
                      </div>
                    </label>
                  </div>

                  {config.preferred === 'laptop' && (
                    <div className="tunnel-input-row" style={{ marginTop: '14px' }}>
                      <label className="field-label">Cloudflare Tunnel URL:</label>
                      <input 
                        type="text" 
                        className="admin-input-text"
                        placeholder="https://your-tunnel.trycloudflare.com" 
                        value={config.laptopUrl}
                        onChange={(e) => {
                          const val = e.target.value;
                          setConfig({ ...config, laptopUrl: val });
                          localStorage.setItem('documorph_tunnel_url', val);
                        }}
                      />
                    </div>
                  )}

                  <hr className="admin-divider" />

                  <h3 className="section-title">Developer Custom API Key Override</h3>
                  <p className="section-desc">
                    Optional: Supply your own Google AI Studio Gemini key for unmetered high-priority processing.
                  </p>
                  <div className="tunnel-input-row">
                    <input 
                      type="password" 
                      className="admin-input-text"
                      placeholder="AIzaSy..." 
                      value={customKey}
                      onChange={(e) => setCustomKey(e.target.value)}
                    />
                    <button className="btn-save-key" onClick={handleSaveCustomKey}>
                      Save Key
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Student Reviews Moderation */}
            {activeTab === 'reviews' && (
              <div className="admin-tab-content">
                {/* Header Action Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 className="section-title" style={{ margin: 0 }}>Student Reviews & Wall of Fame</h3>
                    <p className="section-desc" style={{ margin: '4px 0 0' }}>
                      Inspect, moderate, add, and purge student testimonials live on the website.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={handleEmergencyPurge}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        color: '#f87171',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      🚨 Emergency Purge Leaked Keys
                    </button>
                    <button
                      type="button"
                      onClick={() => loadAdminReviews(token)}
                      disabled={loadingReviews}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#fff',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {loadingReviews ? 'Refreshing...' : '🔄 Refresh'}
                    </button>
                  </div>
                </div>

                {reviewActionMsg && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#34d399',
                    fontSize: '0.85rem',
                    marginBottom: '16px'
                  }}>
                    {reviewActionMsg}
                  </div>
                )}

                {/* Add Review Form */}
                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  marginBottom: '20px'
                }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem', color: '#fff' }}>+ Add Verified Student Review</h4>
                  <form onSubmit={handleCreateReview} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Student Name</label>
                      <input
                        type="text"
                        required
                        className="admin-input-text"
                        placeholder="e.g. Aryan Sharma"
                        value={newReview.student_name}
                        onChange={e => setNewReview({ ...newReview, student_name: e.target.value })}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Exam Target</label>
                      <select
                        className="admin-input-text"
                        value={newReview.exam_target}
                        onChange={e => setNewReview({ ...newReview, exam_target: e.target.value })}
                        style={{ width: '100%', background: '#1e293b', color: '#fff' }}
                      >
                        <option value="JEE Advanced / Main">JEE Advanced / Main</option>
                        <option value="NEET UG">NEET UG</option>
                        <option value="UPSC CSE">UPSC CSE</option>
                        <option value="GATE / ESE">GATE / ESE</option>
                        <option value="College / B.Tech">College / B.Tech</option>
                        <option value="SSC CGL / State PSC">SSC CGL / State PSC</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>City / Institute</label>
                      <input
                        type="text"
                        className="admin-input-text"
                        placeholder="e.g. Kota, Rajasthan"
                        value={newReview.city}
                        onChange={e => setNewReview({ ...newReview, city: e.target.value })}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Rating (Stars)</label>
                      <select
                        className="admin-input-text"
                        value={newReview.rating}
                        onChange={e => setNewReview({ ...newReview, rating: Number(e.target.value) })}
                        style={{ width: '100%', background: '#1e293b', color: '#fff' }}
                      >
                        <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
                        <option value="4">⭐⭐⭐⭐ (4/5)</option>
                        <option value="3">⭐⭐⭐ (3/5)</option>
                      </select>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Review Feedback</label>
                      <textarea
                        required
                        className="admin-input-text"
                        rows={2}
                        placeholder="Genuine aspirant experience with LaTeX formulas, scan cleaning, or page saving..."
                        value={newReview.review_text}
                        onChange={e => setNewReview({ ...newReview, review_text: e.target.value })}
                        style={{ width: '100%', resize: 'vertical' }}
                      />
                    </div>
                    <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="submit"
                        disabled={isSubmittingReview}
                        style={{
                          padding: '8px 20px',
                          borderRadius: '8px',
                          background: 'var(--primary-accent, #3b82f6)',
                          color: '#fff',
                          border: 'none',
                          fontWeight: '600',
                          fontSize: '0.85rem',
                          cursor: isSubmittingReview ? 'wait' : 'pointer'
                        }}
                      >
                        {isSubmittingReview ? 'Adding Review...' : 'Publish Verified Review ✨'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Reviews List Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', textAlign: 'left' }}>
                        <th style={{ padding: '10px' }}>Student</th>
                        <th style={{ padding: '10px' }}>Exam & City</th>
                        <th style={{ padding: '10px' }}>Rating</th>
                        <th style={{ padding: '10px' }}>Review Feedback</th>
                        <th style={{ padding: '10px' }}>Created</th>
                        <th style={{ padding: '10px', textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminReviews.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                            {loadingReviews ? 'Loading reviews...' : 'No student reviews found.'}
                          </td>
                        </tr>
                      ) : (
                        adminReviews.map(rev => (
                          <tr key={rev.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <td style={{ padding: '10px', color: '#fff', fontWeight: '500' }}>
                              {rev.student_name}
                              {rev.verified_student && <span style={{ marginLeft: '4px', color: '#3b82f6' }}>✓</span>}
                            </td>
                            <td style={{ padding: '10px', color: '#cbd5e1' }}>
                              {rev.exam_target}
                              {rev.city && <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>{rev.city}</span>}
                            </td>
                            <td style={{ padding: '10px', color: '#fbbf24' }}>
                              {'★'.repeat(rev.rating)}
                            </td>
                            <td style={{ padding: '10px', color: '#94a3b8', maxWidth: '360px', wordBreak: 'break-word' }}>
                              {rev.review_text}
                            </td>
                            <td style={{ padding: '10px', color: '#64748b', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                              {rev.created_at ? new Date(rev.created_at).toLocaleDateString() : '—'}
                            </td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleDeleteReview(rev.id)}
                                title="Permanently delete review"
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  color: '#f87171',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  fontWeight: '600'
                                }}
                              >
                                🗑️ Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
