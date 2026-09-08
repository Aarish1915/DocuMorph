import React, { useState, useEffect } from 'react';
import { getStoredConfig, probeBackend } from '../../config';

export default function SettingsModal({
  isOpen,
  onClose,
  customApiKey,
  setCustomApiKey,
  customPrompt,
  setCustomPrompt,
}) {
  const [tunnelUrl, setTunnelUrl] = useState('');
  const [renderUrl, setRenderUrl] = useState('');
  const [backendPref, setBackendPref] = useState('auto');
  const [probeStatus, setProbeStatus] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const cfg = getStoredConfig();
      setTunnelUrl(cfg.laptopUrl);
      setRenderUrl(cfg.renderUrl);
      setBackendPref(cfg.preferred);
      runProbe();
    }
  }, [isOpen]);

  const runProbe = async () => {
    setIsTesting(true);
    try {
      const res = await probeBackend(true);
      setProbeStatus(res);
    } catch {
      setProbeStatus({ node: 'none', online: false });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveBackend = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('documorph_tunnel_url', tunnelUrl.trim());
      localStorage.setItem('documorph_render_url', renderUrl.trim());
      localStorage.setItem('documorph_backend_pref', backendPref);
      runProbe();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="settings-modal-backdrop" onClick={onClose}>
      <div className="settings-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="settings-modal-header">
          <h3>Advanced Settings</h3>
          <button
            type="button"
            className="settings-modal-close"
            onClick={onClose}
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>
        <div className="settings-modal-body">
          {/* Dual Failover Routing Section */}
          <div className="settings-section-divider">
            <span className="section-badge">Dual-Backend Routing</span>
          </div>

          <div className="backend-status-card">
            <div className="status-row">
              <span className="status-label">Active Processing Node:</span>
              <span className={`status-pill ${probeStatus?.online ? 'online' : 'offline'}`}>
                <span className="dot" />
                {probeStatus?.node === 'laptop'
                  ? '💻 Laptop Node (High Speed · 8GB RAM)'
                  : probeStatus?.node === 'render'
                  ? '☁️ Render Cloud (Failover Active)'
                  : 'Local Machine'}
              </span>
            </div>
            <p className="status-desc">
              When your laptop is on, heavy PDF OCR processes on your i3 laptop at zero cost. When offline or sleeping, traffic automatically shifts to Render.
            </p>
          </div>

          <div className="settings-field">
            <label>Primary: Laptop Tunnel URL (Cloudflare)</label>
            <input
              type="text"
              placeholder="https://...trycloudflare.com"
              value={tunnelUrl}
              onChange={(e) => setTunnelUrl(e.target.value)}
              onBlur={handleSaveBackend}
            />
            <span className="field-hint">Your current Cloudflare Tunnel pointing to localhost:8000.</span>
          </div>

          <div className="settings-field">
            <label>Fallback: Cloud Backend URL (Render)</label>
            <input
              type="text"
              placeholder="https://documorph-backend.onrender.com"
              value={renderUrl}
              onChange={(e) => setRenderUrl(e.target.value)}
              onBlur={handleSaveBackend}
            />
            <span className="field-hint">Always-on 24/7 cloud fallback when your laptop is turned off.</span>
          </div>

          <div className="settings-field">
            <label>Routing Strategy</label>
            <select
              value={backendPref}
              onChange={(e) => {
                setBackendPref(e.target.value);
                if (typeof window !== 'undefined') {
                  localStorage.setItem('documorph_backend_pref', e.target.value);
                  setTimeout(runProbe, 100);
                }
              }}
              className="settings-select"
            >
              <option value="auto">Automatic Failover (Prefer Laptop, fallback to Render)</option>
              <option value="laptop">Force Laptop Node Only</option>
              <option value="render">Force Render Cloud Only</option>
            </select>
          </div>

          <div className="settings-test-row">
            <button
              type="button"
              className="btn-test-connection"
              onClick={runProbe}
              disabled={isTesting}
            >
              {isTesting ? 'Pinging Nodes...' : '⚡ Test Connection Now'}
            </button>
          </div>

          {/* AI Credentials */}
          <div className="settings-section-divider">
            <span className="section-badge">AI Engine Credentials</span>
          </div>

          <div className="settings-field">
            <label>Custom Gemini API Key</label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={customApiKey}
              onChange={(e) => setCustomApiKey(e.target.value)}
            />
            <span className="field-hint">Optional personal Google AI key to bypass default limits.</span>
          </div>

          <div className="settings-field">
            <label>Custom Vision Prompt</label>
            <textarea
              rows={2}
              placeholder="e.g. Strictly transcribe formulas into LaTeX..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
            />
            <span className="field-hint">Inject custom instructions into the Vision extractor.</span>
          </div>
        </div>

        <div className="settings-modal-footer">
          <button
            type="button"
            className="btn-settings-save"
            onClick={() => {
              handleSaveBackend();
              onClose();
            }}
          >
            Save &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
}
