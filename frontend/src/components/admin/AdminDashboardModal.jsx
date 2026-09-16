import React, { useState, useEffect } from 'react';
import { getStoredConfig, probeBackend, API_BASE } from '../../config';

export default function AdminDashboardModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('monitoring'); // 'monitoring' | 'vault' | 'engine'
  const [adminStatus, setAdminStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [audits, setAudits] = useState([]);
  const [loadingAudits, setLoadingAudits] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Engine routing settings
  const [config, setConfig] = useState({ laptopUrl: '', renderUrl: '', preferred: 'auto' });
  const [customKey, setCustomKey] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredConfig();
      setConfig(stored);
      setCustomKey(localStorage.getItem('documorph_custom_api_key') || '');
      loadStatus();
      loadAudits();
    }
  }, [isOpen]);

  useEffect(() => {
    let interval;
    if (isOpen && autoRefresh && activeTab === 'monitoring') {
      interval = setInterval(() => {
        loadStatus(false);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [isOpen, autoRefresh, activeTab]);

  const getTargetApiUrl = () => {
    return API_BASE || 'http://localhost:8000';
  };

  const loadStatus = async (showSpinner = true) => {
    if (showSpinner) setLoadingStatus(true);
    try {
      const activeNode = await probeBackend();
      const base = activeNode.url || getTargetApiUrl();
      const res = await fetch(`${base}/api/admin/status`);
      if (res.ok) {
        const data = await res.json();
        setAdminStatus(data);
      }
    } catch (e) {
      console.error('Failed to load admin status:', e);
    } finally {
      if (showSpinner) setLoadingStatus(false);
    }
  };

  const loadAudits = async () => {
    setLoadingAudits(true);
    try {
      const activeNode = await probeBackend();
      const base = activeNode.url || getTargetApiUrl();
      const res = await fetch(`${base}/api/admin/audits`);
      if (res.ok) {
        const data = await res.json();
        setAudits(data.audits || []);
      }
    } catch (e) {
      console.error('Failed to load audit vault:', e);
    } finally {
      setLoadingAudits(false);
    }
  };

  const loadAuditDetail = async (jobId) => {
    try {
      const activeNode = await probeBackend();
      const base = activeNode.url || getTargetApiUrl();
      const res = await fetch(`${base}/api/admin/audits/${jobId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedAudit(data);
      }
    } catch (e) {
      console.error('Failed to load audit detail:', e);
    }
  };

  const handleSaveEngine = (newPref) => {
    const updated = { ...config, preferred: newPref };
    setConfig(updated);
    localStorage.setItem('documorph_backend_pref', newPref);
    probeBackend(true);
  };

  const handleSaveCustomKey = () => {
    localStorage.setItem('documorph_custom_api_key', customKey.trim());
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="admin-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="admin-modal-window" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="admin-modal-header">
          <div className="admin-title-group">
            <div className="admin-badge-icon">🛠️</div>
            <div>
              <h2 className="admin-title">DocuMorph Developer & Admin Hub</h2>
              <p className="admin-subtitle">Live Monitoring, Quality Audit Vault & Infrastructure</p>
            </div>
          </div>
          <button className="admin-close-btn" onClick={onClose} aria-label="Close Admin Modal">✕</button>
        </div>

        {/* Tab Navigation */}
        <div className="admin-tabs-bar">
          <button 
            className={`admin-tab-btn ${activeTab === 'monitoring' ? 'active' : ''}`}
            onClick={() => setActiveTab('monitoring')}
          >
            📊 Live System Monitoring
          </button>
          <button 
            className={`admin-tab-btn ${activeTab === 'vault' ? 'active' : ''}`}
            onClick={() => setActiveTab('vault')}
          >
            📁 Quality Audit Vault ({audits.length})
          </button>
          <button 
            className={`admin-tab-btn ${activeTab === 'engine' ? 'active' : ''}`}
            onClick={() => setActiveTab('engine')}
          >
            ⚙️ Server & Routing Controls
          </button>
        </div>

        {/* Tab 1: Live Monitoring */}
        {activeTab === 'monitoring' && (
          <div className="admin-tab-content">
            <div className="admin-action-strip">
              <div className="admin-strip-left">
                <span className="live-pulse-dot"></span>
                <span className="live-status-label">
                  Worker: <strong>{adminStatus?.worker === 'active' ? '🟢 Active Daemon' : '⚪ Standby'}</strong>
                </span>
                <span className="live-uptime">
                  ⏱️ Uptime: <strong>{adminStatus?.uptime_formatted || '0m'}</strong>
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
                <button className="btn-admin-refresh" onClick={() => loadStatus(true)}>
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
                <span className="metric-label">System Memory</span>
                <span className="metric-val">{adminStatus?.memory?.ram_pct || 0}%</span>
                <span className="metric-hint">Total: {adminStatus?.memory?.ram_total_mb || 0} MB</span>
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

            {/* In-Memory Real-Time Logs Console */}
            <div className="admin-logs-section">
              <div className="logs-header">
                <span className="logs-title">Backend Event Stream & Diagnostics (Last 60 Events)</span>
                <span className="logs-count">{adminStatus?.recent_logs?.length || 0} logs</span>
              </div>
              <div className="logs-terminal">
                {adminStatus?.recent_logs?.length > 0 ? (
                  adminStatus.recent_logs.map((l, i) => (
                    <div key={i} className={`log-line log-${l.level?.toLowerCase()}`}>
                      <span className="log-time">[{l.time_str}]</span>
                      <span className={`log-badge log-badge-${l.level?.toLowerCase()}`}>{l.level}</span>
                      <span className="log-logger">[{l.logger}]</span>
                      <span className="log-msg">{l.message}</span>
                    </div>
                  ))
                ) : (
                  <div className="logs-empty">No recent backend events captured in ring buffer.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Quality Audit Vault */}
        {activeTab === 'vault' && (
          <div className="admin-tab-content">
            <div className="vault-intro-banner">
              <p>
                <strong>Quality Improvement Vault:</strong> Every student document processed records the user's custom instructions, page count, and generated Markdown. Use this data to audit OCR quality, catch MathJax formatting edge-cases, and fine-tune system prompts.
              </p>
            </div>

            {selectedAudit ? (
              <div className="audit-detail-view">
                <div className="audit-detail-header">
                  <button className="btn-back-vault" onClick={() => setSelectedAudit(null)}>
                    ← Back to All Audit Records
                  </button>
                  <div className="audit-detail-actions">
                    <button 
                      className="btn-copy-markdown"
                      onClick={() => copyToClipboard(selectedAudit.final_markdown || '')}
                    >
                      {copied ? '✓ Copied!' : '📋 Copy Clean Markdown'}
                    </button>
                  </div>
                </div>

                <div className="audit-meta-card">
                  <div className="meta-grid">
                    <div><strong>Job ID:</strong> {selectedAudit.job_id}</div>
                    <div><strong>File:</strong> {selectedAudit.file_name}</div>
                    <div><strong>Pages:</strong> {selectedAudit.total_pages}</div>
                    <div><strong>Service:</strong> {selectedAudit.service_type}</div>
                    <div><strong>Language:</strong> {selectedAudit.language_mode}</div>
                    <div><strong>Date:</strong> {selectedAudit.datetime_iso}</div>
                  </div>
                  {selectedAudit.custom_prompt && (
                    <div className="user-prompt-box">
                      <strong>User Instruction / Custom Prompt:</strong>
                      <p>{selectedAudit.custom_prompt}</p>
                    </div>
                  )}
                </div>

                <div className="audit-markdown-preview">
                  <span className="preview-label">Generated Markdown Output:</span>
                  <pre className="markdown-pre">{selectedAudit.final_markdown || 'No markdown recorded.'}</pre>
                </div>
              </div>
            ) : (
              <div className="vault-table-container">
                {loadingAudits ? (
                  <div className="vault-loading">Loading audit records from server...</div>
                ) : audits.length > 0 ? (
                  <table className="vault-table">
                    <thead>
                      <tr>
                        <th>Job ID</th>
                        <th>Document</th>
                        <th>Service</th>
                        <th>Pages</th>
                        <th>Instruction / Prompt</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {audits.map((a, i) => (
                        <tr key={i}>
                          <td><code>{a.job_id}</code></td>
                          <td><strong>{a.file_name}</strong></td>
                          <td><span className="badge-service">{a.service_type}</span></td>
                          <td>{a.total_pages || '-'}</td>
                          <td className="cell-prompt">
                            {a.custom_prompt ? a.custom_prompt.slice(0, 45) + '...' : <span className="text-muted">Standard</span>}
                          </td>
                          <td>
                            <button 
                              className="btn-inspect-audit"
                              onClick={() => loadAuditDetail(a.job_id)}
                            >
                              Inspect Output
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="vault-empty">
                    <span>📁 No audit vault records found yet. Process a PDF to automatically save audit data.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Server Routing Controls */}
        {activeTab === 'engine' && (
          <div className="admin-tab-content">
            <div className="engine-settings-card">
              <h3 className="section-title">Backend Server Routing</h3>
              <p className="section-desc">
                Select which computing node handles PDF conversions for your sessions.
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
                <div className="tunnel-input-row">
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
      </div>
    </div>
  );
}
