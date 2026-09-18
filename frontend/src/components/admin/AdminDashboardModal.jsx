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
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [sweepMsg, setSweepMsg] = useState('');
  const [isSweeping, setIsSweeping] = useState(false);

  // Ground Reality & Telemetry Report Inspection
  const [selectedReport, setSelectedReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);

  // Engine routing settings
  const [config, setConfig] = useState(() => getStoredConfig());
  const [customKey, setCustomKey] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('documorph_custom_api_key') || '' : ''));

  const getTargetApiUrl = () => {
    return API_BASE || 'http://localhost:8000';
  };

  const handleViewReport = async (jobId) => {
    if (!token) return;
    setLoadingReport(true);
    try {
      const activeNode = await probeBackend();
      const base = activeNode.url || getTargetApiUrl();
      const res = await fetch(`${base}/api/internal/admin/jobs/${jobId}/telemetry`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedReport(data);
      } else {
        alert('Could not fetch telemetry report for job ' + jobId);
      }
    } catch (e) {
      console.error('Failed to load telemetry report:', e);
    } finally {
      setLoadingReport(false);
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

  // Load All Jobs with JWT
  const loadJobs = async (authToken = token) => {
    if (!authToken) return;
    setLoadingJobs(true);
    try {
      const activeNode = await probeBackend();
      const base = activeNode.url || getTargetApiUrl();
      const res = await fetch(`${base}/api/internal/admin/jobs`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAdminJobs(data.jobs || []);
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (e) {
      console.error('Failed to load admin jobs:', e);
    } finally {
      setLoadingJobs(false);
    }
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
        setSweepMsg(`Reclaimed: Before ${data.rss_before_mb}MB → After ${data.rss_after_mb}MB`);
        loadStatus();
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

  // Effect when authenticated: load initial data
  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    const fetchInitialData = async () => {
      try {
        const activeNode = await probeBackend();
        const base = activeNode.url || getTargetApiUrl();
        const [resStatus, resJobs] = await Promise.all([
          fetch(`${base}/api/internal/admin/status`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${base}/api/internal/admin/jobs`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (cancelled) return;

        if (resStatus.ok) {
          const data = await resStatus.json();
          setAdminStatus(data);
        } else if (resStatus.status === 401) {
          handleLogout();
          return;
        }

        if (resJobs.ok) {
          const data = await resJobs.json();
          setAdminJobs(data.jobs || []);
        }
      } catch (e) {
        console.error('Failed to load initial admin data:', e);
      }
    };

    fetchInitialData();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Auto-refresh timer
  useEffect(() => {
    let interval;
    if (token && autoRefresh && activeTab === 'monitoring') {
      interval = setInterval(() => {
        loadStatus(token);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [token, autoRefresh, activeTab]);

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

                {selectedReport ? (
                  /* Ground Reality & Telemetry Report Detailed View */
                  <div className="telemetry-report-view" style={{
                    background: 'var(--bg-secondary, rgba(255,255,255,0.03))',
                    border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                    borderRadius: '8px',
                    padding: '20px',
                    color: 'var(--text-primary, #fff)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.1))', paddingBottom: '12px' }}>
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
                      <div style={{ display: 'flex', gap: '8px' }}>
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
                          ⬇️ Download (.md)
                        </button>
                      </div>
                    </div>

                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '8px' }}>
                      📊 Ground Reality & Telemetry Report: {selectedReport.file_name}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '16px' }}>
                      <strong>Service Type:</strong> <code style={{ color: '#60a5fa' }}>{selectedReport.service_type}</code> &nbsp;|&nbsp; <strong>Language Mode:</strong> <code style={{ color: '#a78bfa' }}>{selectedReport.language_mode}</code> &nbsp;|&nbsp; <strong>Generated:</strong> {selectedReport.created_at}
                    </div>

                    <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '16px 0' }} />

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
                          <td style={{ padding: '6px 8px', color: '#34d399' }}>{selectedReport.metrics?.compaction_pct}%</td>
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
                ) : adminJobs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary, #94a3b8)' }}>
                    No jobs recorded in database yet.
                  </div>
                ) : (
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
                          <tr key={j.id} style={{ borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.05))' }}>
                            <td style={{ padding: '8px 6px' }}>
                              <button
                                type="button"
                                onClick={() => handleViewReport(j.id)}
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
                                onClick={() => handleViewReport(j.id)}
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
                                📊 Telemetry Report
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Server & Routing Controls */}
            {activeTab === 'engine' && (
              <div className="admin-tab-content">
                <div className="engine-controls-card">
                  <h3 className="section-title">Compute Node Routing Strategy</h3>
                  <p className="section-desc">
                    Configure how DocuMorph directs OCR extraction and Playwright compiling workloads.
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
          </>
        )}
      </div>
    </div>
  );
}
