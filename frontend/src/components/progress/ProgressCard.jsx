import React, { useState, useEffect } from 'react';
import CircularRing from './CircularRing';
import { API_BASE } from '../../config';

const COMPILING_TIPS = [
  "📐 Typesetting mathematical formulas with MathJax...",
  "🖼️ Assembling high-resolution vector diagrams...",
  "📄 Formatting clean A4 print geometry...",
  "✨ Compiling print-ready PDF pages with Playwright...",
  "🗜️ Optimizing byte streams to ensure compact file size...",
  "⏳ Large 30–50 page documents take ~30–45s to typeset with precision. Almost ready!",
];

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
  const [elapsedSec, setElapsedSec] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const isIOS = typeof navigator !== 'undefined' && (
    /iPad|iPhone|iPod/.test(navigator.userAgent || '') ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );

  const [canShare] = useState(() => {
    if (isIOS) return true;
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.canShare === 'function' && typeof File === 'function') {
        const dummyFile = new File([''], 'doc.pdf', { type: 'application/pdf' });
        return Boolean(navigator.canShare({ files: [dummyFile] }));
      }
    } catch {
      return false;
    }
    return false;
  });

  // Live timer for active jobs
  useEffect(() => {
    let timer;
    if (jobStatus && !isComplete && !isError) {
      timer = setInterval(() => {
        setElapsedSec((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [jobStatus, isComplete, isError]);

  // Rotate reassuring tips during final compile stage
  useEffect(() => {
    let tipInterval;
    if (jobStatus && jobStatus.progress >= 80 && !isComplete && !isError) {
      tipInterval = setInterval(() => {
        setTipIndex((prev) => (prev + 1) % COMPILING_TIPS.length);
      }, 3500);
    }
    return () => clearInterval(tipInterval);
  }, [jobStatus, isComplete, isError]);

  // Smooth micro-stepping / synthetic lerp state: strictly cap at 92% until complete
  const targetProgress = Math.max(0, Math.min(100, Number(jobStatus?.progress) || 0));
  const [displayProgress, setDisplayProgress] = useState(targetProgress);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayProgress((prev) => {
        if (isComplete) return 100;
        // Freeze guard: never exceed 92% until status === 'COMPLETED'
        const cappedTarget = Math.min(92, targetProgress);
        if (prev < cappedTarget) {
          const step = Math.max(0.3, (cappedTarget - prev) * 0.15);
          return Math.min(cappedTarget, prev + step);
        }
        // Micro-creep while backend typesets
        if (!isComplete && !isError && prev < 92) {
          return Math.min(92, prev + 0.1);
        }
        return prev;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [targetProgress, isComplete, isError]);

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

  const currentDisplayPct = Math.round(displayProgress);
  const stageProgress = (jobStatus.status === 'UPLOADING' || jobStatus.status === 'QUEUED')
    ? 0
    : (displayProgress > 0 ? getStagePercentage(displayProgress) : 0);

  // Calculate compression statistics
  const origSize = jobStatus.original_file_size || 0;
  const compSize = jobStatus.compressed_file_size || 0;
  const reductionPct = origSize > 0 && compSize > 0 
    ? Math.max(0, Math.round(((origSize - compSize) / origSize) * 100)) 
    : 0;

  const activeBase = (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
    ? 'https://documorph-v1.onrender.com'
    : API_BASE;
  const rawDownloadUrl = jobStatus.download_url || jobStatus.result_url;
  const downloadUrl = rawDownloadUrl ? `${activeBase}${rawDownloadUrl}` : '#';

  const getTargetFilename = () => {
    if (serviceType === 'compress') return 'compressed_document.pdf';
    if (outputFormat === 'txt') return 'extracted_text.txt';
    if (outputFormat === 'json') return 'extracted_data.json';
    if (outputFormat === 'md') return 'extracted_document.md';
    return 'cleaned_document.pdf';
  };

  const handleDownload = (e) => {
    if (e) e.preventDefault();
    if (!downloadUrl) return;

    // Direct HTTP download trigger:
    // With our clean RFC-compliant Content-Disposition attachment header,
    // window.location.assign(downloadUrl) triggers the device's native download manager
    // (iOS Safari "Do you want to download 'cleaned_document.pdf'?", Android Chrome download manager,
    // and desktop browsers), saving directly into device storage without blob detachment errors.
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = getTargetFilename();
    link.target = '_self';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (link.parentNode) link.parentNode.removeChild(link);
    }, 2000);
  };

  const handleNativeShare = async () => {
    if (!downloadUrl) return;
    try {
      setDownloading(true);
      const res = await fetch(downloadUrl);
      if (!res.ok) throw new Error('Share fetch failed');
      const blob = await res.blob();
      const filename = getTargetFilename();
      const file = new File([blob], filename, { type: blob.type || 'application/pdf' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: filename,
        });
      } else {
        handleDownload();
      }
    } catch (err) {
      console.warn('Native share cancelled or failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleRatingSubmit = async (stars, commentText) => {
    setRating(stars);
    setReviewSubmitted(true);
    try {
      await fetch(`${API_BASE}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobStatus?.id || '',
          rating: stars,
          comment: commentText || ''
        })
      });
    } catch {
      // Offline graceful ignore
    }
  };

  const getServicePresetLabel = () => {
    if (serviceType === 'compress') return '📉 Smart Page Compaction';
    if (serviceType === 'extract_text') return '📋 Text & Table Extraction';
    if (serviceType === 'translate') return '🌐 Multilingual Translation';
    return '✨ Clean & Print Beautify';
  };

  const getDocDisplayName = () => {
    return jobStatus.file_name || jobStatus.original_filename || 'Active_Lecture_Notes.pdf';
  };

  return (
    <div className="progress-screen-container cockpit-stage-container">
      <div className="cockpit-ambient-aura" />
      <div className="progress-card progress-cockpit-card">

        {/* 1. Document Telemetry Status Strip */}
        <div className="cockpit-telemetry-bar">
          <div className="telemetry-item file-item" title={getDocDisplayName()}>
            <span className="telemetry-icon">📄</span>
            <span className="telemetry-label">{getDocDisplayName()}</span>
          </div>
          <div className="telemetry-divider" />
          <div className="telemetry-item">
            <span className="telemetry-icon">📑</span>
            <span className="telemetry-val">
              {jobStatus.total_pages ? `${jobStatus.total_pages} Pages` : 'Multi-Page PDF'}
            </span>
          </div>
          <div className="telemetry-divider" />
          <div className="telemetry-item mode-item">
            <span className="telemetry-val">{getServicePresetLabel()}</span>
          </div>
          {!isComplete && !isError && (
            <>
              <div className="telemetry-divider" />
              <div className="telemetry-item timer-item">
                <span className="telemetry-icon">⏱️</span>
                <span className="telemetry-val timer-val">
                  {Math.floor(elapsedSec / 60)}:{(elapsedSec % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </>
          )}
        </div>

        {/* 2. Cockpit Hero Header */}
        <div className="cockpit-hero-header">
          <div className="cockpit-hero-left">
            <div className={`cockpit-pulse-ring-wrap ${isComplete ? 'complete' : isError ? 'error' : 'active'}`}>
              <span className="pulse-ring-wave"></span>
              <span className="pulse-ring-core">
                {isComplete ? '✓' : isError ? '!' : '⚡'}
              </span>
            </div>
            <div className="cockpit-title-group">
              <h2 className="cockpit-main-title">
                {isComplete
                  ? 'Document Ready for Download'
                  : isError
                  ? 'Processing Interrupted'
                  : jobStatus.status === 'UPLOADING'
                  ? 'Uploading Document to Engine...'
                  : 'AI Transformation Cockpit'}
              </h2>
              <span className="cockpit-sub-title">
                {isComplete
                  ? 'Processed with zero-retention privacy & LaTeX formula preservation.'
                  : isError
                  ? 'We encountered an issue during document transformation.'
                  : 'Multi-part vision reading, layout profiling & typesetting active.'}
              </span>
            </div>
          </div>

          {jobStatus.progress >= 0 && !isComplete && (
            <div className="cockpit-pct-badge">
              <span className="cockpit-pct-num">
                {jobStatus.status === 'UPLOADING' ? (jobStatus.upload_pct ?? currentDisplayPct) : currentDisplayPct}
              </span>
              <span className="cockpit-pct-sym">%</span>
            </div>
          )}
        </div>

        {/* Real-Time Upload Bandwidth Badge (when uploading) */}
        {jobStatus.status === 'UPLOADING' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: 'var(--surface-selected, #eff6ff)',
              borderRadius: '12px',
              border: '1px solid var(--border-default)',
              marginBottom: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
              <span>📡</span>
              <span>
                Uploaded {jobStatus.loaded_mb || '0.0'} MB of {jobStatus.total_mb || '0.0'} MB ({jobStatus.upload_pct || 0}%)
              </span>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 750, color: 'var(--color-primary)' }}>
              ⚡ {jobStatus.upload_speed || 'Uploading...'}
            </div>
          </div>
        )}

        {/* 3. Progress Bar (during active processing) */}
        {!isComplete && !isError && (
          <div className="pbar-track cockpit-pbar-track">
            <div 
              className={`pbar-fill ${displayProgress >= 80 ? 'pbar-fill--pulsing' : ''}`} 
              style={{ width: `${Math.max(5, displayProgress)}%`, transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} 
            />
          </div>
        )}

        {/* 4. Connected Stages Pipeline */}
        {!isComplete && !isError && (
          <div className="stages-cockpit-track">
            <div className="stages-beam-line">
              <div 
                className="stages-beam-fill" 
                style={{ width: `${Math.min(100, Math.max(0, (stageIdx / (STAGES.length - 1)) * 100))}%` }} 
              />
            </div>
            <div className="stages">
              {STAGES.map((s, i) => {
                const isActive = stageIdx === i;
                const isDone = stageIdx > i;
                return (
                  <div key={i} className={`stage ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
                    {isActive ? (
                      <div className="stage-active-container">
                        <CircularRing progress={stageProgress} icon={s.icon} />
                        <div className="stage-name active">{s.label}</div>
                        <div className="stage-pct-label">{stageProgress}%</div>
                      </div>
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
          </div>
        )}

        {/* 5. Live Status Message */}
        <div className="status-msg-box">
          {isComplete && (
            <div className="complete-banner">
              <div className="success-icon-badge">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div className="success-text">
                <span className="success-title">Your document is completely transformed!</span>
                <span className="success-desc">Processed with 100% data privacy • Zero file retention.</span>
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
            <div className="cockpit-live-console">
              <span className="console-radar-dot"></span>
              <div className="console-body">
                <span className="console-prefix">ENGINE STATE:</span>
                <span className="console-text">{jobStatus.message || jobStatus.status || 'Profiling layout & math equations...'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Final Typesetting Reassurance Card */}
        {!isComplete && !isError && jobStatus.progress >= 80 && (
          <div className="compiling-reassurance-card">
            <div className="reassurance-header">
              <div className="reassurance-left">
                <span className="reassurance-spinner"></span>
                <span className="reassurance-title">Typesetting Engine Active</span>
              </div>
              <span className="reassurance-timer">⏱️ {Math.floor(elapsedSec / 60)}:{(elapsedSec % 60).toString().padStart(2, '0')}</span>
            </div>
            <div className="reassurance-tip-text">
              {COMPILING_TIPS[tipIndex % COMPILING_TIPS.length]}
            </div>
          </div>
        )}

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
            <button
              type="button"
              onClick={handleDownload}
              className="btn-download-result"
              style={{ border: 'none', cursor: 'pointer' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <span>{getDownloadButtonLabel()}</span>
            </button>

            {canShare && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="btn-share-result"
                disabled={downloading}
                title="Share via WhatsApp, AirDrop or other apps"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <polyline points="16 6 12 2 8 6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
                <span>Share Document</span>
              </button>
            )}

            <button 
              type="button" 
              className="btn-new-document"
              onClick={onNewJob}
            >
              Process another document
            </button>
          </div>
        )}

        {/* Student Satisfaction Review Widget */}
        {isComplete && (
          <div className="cockpit-review-strip" style={{ marginTop: '20px', padding: '16px 20px', background: 'var(--surface-subtle)', borderRadius: '14px', border: '1px solid var(--border-default)', textAlign: 'center' }}>
            {reviewSubmitted ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13.5px', color: 'var(--color-success)', fontWeight: 600 }}>
                <span>🎉</span>
                <span>Thank you! Your feedback helps us keep DocuMorph sharp for all students.</span>
              </div>
            ) : (
              <div>
                <span style={{ display: 'block', fontSize: '13px', fontWeight: 650, color: 'var(--text-main)', marginBottom: '8px' }}>
                  How did your cleaned document turn out?
                </span>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: rating > 0 ? '12px' : '0' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => {
                        setRating(star);
                        if (star === 5) handleRatingSubmit(5, '');
                      }}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '24px',
                        cursor: 'pointer',
                        color: (hoverRating || rating) >= star ? '#f59e0b' : 'var(--text-subtle, #cbd5e1)',
                        transition: 'transform 0.15s ease, color 0.15s ease',
                        transform: (hoverRating || rating) >= star ? 'scale(1.15)' : 'scale(1)',
                        padding: '2px'
                      }}
                      aria-label={`Rate ${star} stars`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                {rating > 0 && !reviewSubmitted && (
                  <div style={{ display: 'flex', gap: '8px', maxWidth: '400px', margin: '0 auto' }}>
                    <input
                      type="text"
                      placeholder="Quick note (e.g. formulas intact, clean text)..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', fontSize: '12.5px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--surface-card)' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRatingSubmit(rating, reviewComment)}
                      style={{ padding: '8px 14px', fontSize: '12.5px', fontWeight: 600, borderRadius: '8px', background: 'var(--color-primary)', color: '#ffffff', border: 'none', cursor: 'pointer' }}
                    >
                      Submit
                    </button>
                  </div>
                )}
              </div>
            )}
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
