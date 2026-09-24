import React from 'react';

export default function UploadingScreen({
  jobStatus,
  fileName,
  onCancel,
}) {
  const uploadPct = jobStatus?.upload_pct ?? jobStatus?.progress ?? 15;
  const loadedMB = jobStatus?.loaded_mb || '0.0';
  const totalMB = jobStatus?.total_mb || '0.0';
  const speed = jobStatus?.upload_speed || 'Connecting...';
  const statusMsg = jobStatus?.message || `Streaming ${fileName || 'document'} to secure memory...`;

  return (
    <div className="upload-screen-card" aria-live="polite">
      {/* Upload Visual Pulse Ring */}
      <div className="upload-visual-zone">
        <div className="upload-pulse-ring">
          <div className="upload-pulse-inner">
            <svg
              className="upload-cloud-icon"
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
              <path d="M12 12v9" />
              <path d="m16 16-4-4-4 4" />
            </svg>
          </div>
        </div>
        <div className="upload-title-block">
          <h3 className="upload-title">Uploading Document</h3>
          <p className="upload-filename" title={fileName}>
            📄 {fileName || 'Document.pdf'}
          </p>
        </div>
      </div>

      {/* Upload Progress Bar */}
      <div className="upload-progress-wrapper">
        <div className="upload-progress-bar-track">
          <div
            className="upload-progress-bar-fill"
            style={{ width: `${Math.min(100, Math.max(5, uploadPct))}%` }}
          />
        </div>
        <div className="upload-meta-row">
          <span className="upload-stats">
            {loadedMB} MB / {totalMB} MB transferred • {speed}
          </span>
          <span className="upload-percentage-val">
            {uploadPct}%
          </span>
        </div>
      </div>

      {/* Dynamic Status Pill */}
      <div className="upload-status-banner">
        <span className="upload-spinner" />
        <span className="upload-status-text">{statusMsg}</span>
      </div>

      {/* Security & Memory Guarantee */}
      <div className="upload-security-strip">
        <span className="security-badge-shield">🔒</span>
        <span>100% In-Memory Transfer • Zero Disk Persistence • SSL 256-Bit</span>
      </div>

      {/* Cancel Option */}
      {onCancel && (
        <div className="upload-cancel-row">
          <button
            type="button"
            onClick={onCancel}
            className="btn-cancel-upload"
          >
            Cancel Upload
          </button>
        </div>
      )}
    </div>
  );
}
