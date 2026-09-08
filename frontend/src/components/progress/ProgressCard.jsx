import React, { useState } from 'react';
import CircularRing from './CircularRing';
import { API_BASE } from '../../config';

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function ProgressCard({
  jobStatus,
  stageIdx,
  isComplete,
  isError,
  STAGES,
  handleReprocessPage,
  onNewJob,
}) {
  const [reprocessPageNum, setReprocessPageNum] = useState('');
  const [showReprocess, setShowReprocess] = useState(false);

  if (!jobStatus) return null;

  const serviceType = jobStatus.service_type || 'clean_format';
  const outputFormat = jobStatus.output_format || 'pdf';

  const getDownloadButtonLabel = () => {
    if (serviceType === 'compress') return 'Download Compact A4 PDF';
    if (serviceType === 'extract_text') {
      if (outputFormat === 'txt') return 'Download Text (.txt)';
      if (outputFormat === 'json') return 'Download JSON (.json)';
      return 'Download Markdown (.md)';
    }
    if (serviceType === 'translate') {
      if (outputFormat === 'md') return 'Download Translated Markdown (.md)';
      return 'Download Translated PDF';
    }
    return 'Download Cleaned PDF';
  };

  const getStagePercentage = (progress) => {
    if (progress < 20) return Math.min(100, Math.round((progress / 20) * 100));
    if (progress < 40) return Math.min(100, Math.round(((progress - 20) / 20) * 100));
    if (progress < 70) return Math.min(100, Math.round(((progress - 40) / 30) * 100));
    if (progress < 90) return Math.min(100, Math.round(((progress - 70) / 20) * 100));
    return Math.min(100, Math.round(((progress - 90) / 10) * 100));
  };

  const stageProgress = jobStatus.progress > 0 ? getStagePercentage(jobStatus.progress) : 0;

  // Calculate compression statistics
  const origSize = jobStatus.original_file_size || 0;
  const compSize = jobStatus.compressed_file_size || 0;
  const reductionPct = origSize > 0 && compSize > 0 
    ? Math.max(0, Math.round(((origSize - compSize) / origSize) * 100)) 
    : 0;

  const downloadUrl = jobStatus.download_url 
    ? `${API_BASE}${jobStatus.download_url}`
    : `${API_BASE}${jobStatus.result_url}`;

  return (
    <div className="progress-screen-container">
      <div className="progress-card">

        {/* Header */}
        <div className="progress-header">
          <span className="progress-title">
            {isComplete ? 'Processing Complete' : isError ? 'Processing Failed' : 'Processing Document'}
          </span>
          {jobStatus.progress >= 0 && !isComplete && (
            <span className="progress-pct">{Math.round(jobStatus.progress)}%</span>
          )}
        </div>

        {/* Progress Bar (during active processing) */}
        {!isComplete && !isError && (
          <div className="pbar-track">
            <div 
              className="pbar-fill" 
              style={{ width: `${Math.max(5, jobStatus.progress)}%` }} 
            />
          </div>
        )}

        {/* Active Stage Indicators */}
        {!isComplete && !isError && (
          <div className="stages">
            {STAGES.map((s, i) => {
              const isActive = stageIdx === i;
              const isDone = stageIdx > i;
              return (
                <div key={i} className={`stage ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
                  {isActive ? (
                    <>
                      <CircularRing progress={stageProgress} icon={s.icon} />
                      <div className="stage-name active">{s.label}</div>
                      <div className="stage-pct-label">{stageProgress}%</div>
                    </>
                  ) : (
                    <>
                      <div className="stage-bubble">{isDone ? '✓' : s.icon}</div>
                      <div className="stage-name">{s.label}</div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Live Status Message */}
        <div className="status-msg-box">
          {isComplete && (
            <div className="complete-banner">
              <div className="success-icon-badge">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div className="success-text">
                <span className="success-title">Your document is ready!</span>
                <span className="success-desc">Processed with 100% data privacy.</span>
              </div>
            </div>
          )}

          {isError && (
            <div className="error-banner">
              <span className="error-icon">⚠️</span>
              <span className="error-text">{jobStatus.message || 'An error occurred during processing.'}</span>
            </div>
          )}

          {!isComplete && !isError && (
            <div className="active-msg">
              <span className="pulse-dot"></span>
              <span>{jobStatus.message || jobStatus.status}</span>
            </div>
          )}
        </div>

        {/* Compression Statistics Badge */}
        {isComplete && serviceType === 'compress' && origSize > 0 && compSize > 0 && (
          <div className="compression-stat-card">
            <div className="stat-row">
              <div className="stat-col">
                <span className="stat-label">Original</span>
                <span className="stat-val original">{formatBytes(origSize)}</span>
              </div>
              <div className="stat-arrow">→</div>
              <div className="stat-col">
                <span className="stat-label">Compressed</span>
                <span className="stat-val compressed">{formatBytes(compSize)}</span>
              </div>
              <div className="reduction-badge">
                -{reductionPct}%
              </div>
            </div>
          </div>
        )}

        {/* Human-Centered Telemetry & Relief Badges (Phase 3 HCD) */}
        {isComplete && (
          <div className="hcd-telemetry-strip">
            {serviceType === 'clean_format' && (
              <>
                <span className="hcd-metric-badge">🚫 0 Telegram Ads / Watermarks</span>
                <span className="hcd-metric-badge">📐 Vector LaTeX Formulas Intact</span>
                <span className="hcd-metric-badge">🛡️ 100% Private</span>
              </>
            )}
            {serviceType === 'compress' && (
              <>
                <span className="hcd-metric-badge save-green">📉 ~50-60% Pages Compacted</span>
                <span className="hcd-metric-badge save-green">💰 Approx ₹120-₹180 Xerox Saved</span>
                <span className="hcd-metric-badge">🌱 0 Questions Omitted</span>
              </>
            )}
            {serviceType === 'extract_text' && (
              <>
                <span className="hcd-metric-badge">📋 Markdown Tables Structured</span>
                <span className="hcd-metric-badge">⚡ 1-Click Notion Ready</span>
                <span className="hcd-metric-badge">✓ 0 Jitter Formatting</span>
              </>
            )}
            {serviceType === 'translate' && (
              <>
                <span className="hcd-metric-badge">🌐 Fluent Translation</span>
                <span className="hcd-metric-badge">🛡️ Math Formulas Protected</span>
                <span className="hcd-metric-badge">📚 Ready for Print</span>
              </>
            )}
          </div>
        )}

        {/* Completion Actions */}
        {isComplete && (
          <div className="complete-actions">
            <a
              href={downloadUrl}
              download
              className="btn-download-result"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <span>{getDownloadButtonLabel()}</span>
            </a>

            <button 
              type="button" 
              className="btn-new-document"
              onClick={onNewJob}
            >
              Process another document
            </button>
          </div>
        )}

        {/* Broken Page Reprocess Accordion */}
        {isComplete && serviceType === 'clean_format' && (
          <div className="reprocess-accordion">
            <button 
              type="button"
              className="reprocess-toggle-btn"
              onClick={() => setShowReprocess(!showReprocess)}
            >
              <span>Did a specific page break? Fix it in seconds</span>
              <span>{showReprocess ? '▲' : '▼'}</span>
            </button>

            {showReprocess && (
              <div className="reprocess-panel">
                <span className="reprocess-help">
                  Enter the original page number that needs re-extraction. We will re-read and re-stitch just that page without redoing the entire PDF.
                </span>
                <div className="reprocess-input-row">
                  <input
                    type="number"
                    min={1}
                    placeholder="Page #"
                    value={reprocessPageNum}
                    onChange={(e) => setReprocessPageNum(e.target.value)}
                    className="reprocess-input"
                  />
                  <button
                    type="button"
                    className="btn-reprocess-submit"
                    disabled={!reprocessPageNum}
                    onClick={() => {
                      if (reprocessPageNum) handleReprocessPage(reprocessPageNum);
                    }}
                  >
                    Reprocess Page ⚡
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
