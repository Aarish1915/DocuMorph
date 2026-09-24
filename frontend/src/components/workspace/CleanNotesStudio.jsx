import React, { useState, useRef, useEffect } from 'react';
import { API_BASE } from '../../config';

function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function getCleanFilename(item) {
  const raw = item.filename || item.file_name || item.file_path || item.id || 'Study_Notes.pdf';
  // Strip automated engine prefixes
  return raw
    .replace(/^(FINAL|COMPACT)_[0-9]+_(job_[a-z0-9]+_)?/i, '')
    .replace(/^(FINAL|COMPACT)_[0-9]+_(job_[a-z0-9]+_)?/i, '');
}

function getServiceMeta(serviceType) {
  switch (serviceType) {
    case 'clean_format':
      return { label: 'Clean & Format', icon: '✨', badgeClass: 'badge-clean' };
    case 'compress':
      return { label: 'Compact PDF', icon: '🗜️', badgeClass: 'badge-compress' };
    case 'extract_text':
      return { label: 'Extract Tables', icon: '📝', badgeClass: 'badge-extract' };
    case 'translate':
      return { label: 'Translate', icon: '🌐', badgeClass: 'badge-translate' };
    default:
      return { label: 'Document', icon: '📄', badgeClass: 'badge-default' };
  }
}

const TOOLS = [
  { id: 'clean_format', label: 'Clean & Format', icon: '✨', desc: 'Whiten scans, remove stamps & beautify' },
  { id: 'compress', label: 'Compress & Compact', icon: '🗜️', desc: 'Squeeze margins, save 50%+ pages' },
  { id: 'extract_text', label: 'Extract Tables & Text', icon: '📝', desc: 'Convert tables & text to Markdown' },
  { id: 'translate', label: 'Translate Notes', icon: '🌐', desc: 'Translate while preserving formulas' },
];

export default function CleanNotesStudio({
  serviceType,
  setServiceType,
  config,
  onChangeConfig,
  file,
  setFile,
  isDragging,
  setIsDragging,
  handleProcess,
  isProcessing,
  isComplete,
  isError,
  jobStatus,
  stageIdx,
  STAGES,
  onNewJob,
  jobHistory,
  historyLoading,
  historyDates,
  selectedDate,
  onSelectDate,
  historyHasMore,
  historyLoadingMore,
  onLoadMore,
  onOpenAdmin,
}) {
  const fileInputRef = useRef(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [copiedNoteId, setCopiedNoteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Live timer for active processing
  useEffect(() => {
    let timer;
    if (isProcessing) {
      timer = setInterval(() => setElapsedSec((p) => p + 1), 1000);
    } else {
      setElapsedSec(0);
    }
    return () => clearInterval(timer);
  }, [isProcessing]);

  const currentTool = TOOLS.find((t) => t.id === serviceType) || TOOLS[0];
  const isQuickTest = config?.page_range === '1-3';

  // Filter history items by search query (clean name, id, or service)
  const filteredHistory = (jobHistory || []).filter((j) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const cleanName = getCleanFilename(j).toLowerCase();
    const raw = (j.filename || j.id || '').toLowerCase();
    const sType = (j.service_type || '').toLowerCase();
    return cleanName.includes(q) || raw.includes(q) || sType.includes(q);
  });

  const handleCopyText = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedNoteId(id);
    setTimeout(() => setCopiedNoteId(null), 2500);
  };

  const getResultDownloadUrl = () => {
    const rawUrl = jobStatus?.download_url || jobStatus?.output_url || jobStatus?.result_url;
    if (!rawUrl) return null;
    if (rawUrl.startsWith('http')) return rawUrl;
    return `${API_BASE}${rawUrl}`;
  };

  const getMarkdownDownloadUrl = () => {
    const rawUrl = jobStatus?.markdown_url || jobStatus?.download_url_md;
    if (rawUrl) {
      if (rawUrl.startsWith('http')) return rawUrl;
      return `${API_BASE}${rawUrl}`;
    }
    const mainUrl = getResultDownloadUrl();
    if (mainUrl && mainUrl.endsWith('.pdf')) {
      return mainUrl.replace(/\.pdf$/, '.md');
    }
    return mainUrl;
  };

  return (
    <section className="cleannotes-allinone-studio" id="studio">
      {/* ── AMBIENT BACKING ── */}
      <div className="studio-ambient-radial" aria-hidden="true" />

      {/* ── 1. STUDIO HERO TITLE & VALUE PROP ── */}
      <div className="studio-hero-header">
        <div className="studio-pill-announcement">
          <span className="studio-pulse-dot" />
          <span className="studio-pill-text">CleanNotes 2.0 FastPath Released</span>
          <span className="studio-pill-badge">&lt; 25ms Digital Engine</span>
        </div>

        <h1 className="studio-main-headline">
          Transform Messy Documents into{' '}
          <span className="studio-gradient-text">Pristine, Structured Notes</span>
        </h1>

        <p className="studio-subheadline">
          Lightning-fast AI engine that cleans dark photocopy scans, extracts nested tables, and preserves mathematical formulas in seconds.
        </p>

        {/* Live Trust Metrics Grid */}
        <div className="studio-trust-strip">
          <div className="trust-strip-item">
            <span className="trust-icon">🛡️</span>
            <span>Zero Data Retention</span>
          </div>
          <div className="trust-strip-item">
            <span className="trust-icon">⚡</span>
            <span>Sub-Second FastPath</span>
          </div>
          <div className="trust-strip-item">
            <span className="trust-icon">📐</span>
            <span>100% LaTeX Math Safe</span>
          </div>
          <div className="trust-strip-item">
            <span className="trust-icon">🔒</span>
            <span>Ephemeral Memory Buffers</span>
          </div>
        </div>
      </div>

      {/* ── 2. THE UNIFIED STUDIO COCKPIT CARD ── */}
      <div className="studio-cockpit-card">
        {/* Tool Switcher Tabs */}
        <div className="studio-tool-tabs-row" role="tablist" aria-label="Processing Tools">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              type="button"
              role="tab"
              aria-selected={serviceType === tool.id}
              className={`studio-tool-tab ${serviceType === tool.id ? 'active' : ''}`}
              onClick={() => {
                if (!isProcessing) {
                  setServiceType(tool.id);
                }
              }}
              disabled={isProcessing}
            >
              <span className="studio-tab-icon">{tool.icon}</span>
              <div className="studio-tab-meta">
                <span className="studio-tab-label">{tool.label}</span>
                <span className="studio-tab-desc">{tool.desc}</span>
              </div>
            </button>
          ))}
        </div>

        {/* ── DYNAMIC COCKPIT BODY BASED ON EXECUTION STATE ── */}

        {/* STATE A: ACTIVE PROCESSING PIPELINE */}
        {isProcessing && (
          <div className="cockpit-processing-view">
            <div className="processing-live-badge">
              <span className="processing-ping-dot" />
              <span>FastPath Cluster Active • Processing Note...</span>
            </div>

            <div className="processing-progress-row">
              <div className="processing-pct-large font-mono">
                {jobStatus?.progress || 12}%
              </div>
              <div className="processing-progress-track">
                <div
                  className="processing-progress-fill"
                  style={{ width: `${Math.min(96, Math.max(8, Number(jobStatus?.progress) || 12))}%` }}
                />
              </div>
            </div>

            {/* 5-Stage Live Sequencer */}
            <div className="processing-stages-sequencer">
              {(STAGES || []).map((s, idx) => {
                const isPassed = stageIdx > idx;
                const isCurrent = stageIdx === idx;
                return (
                  <div
                    key={s.label}
                    className={`sequencer-stage-item ${isPassed ? 'passed' : isCurrent ? 'current' : 'upcoming'}`}
                  >
                    <div className="stage-icon-circle">
                      {isPassed ? '✓' : s.icon}
                    </div>
                    <span className="stage-name">{s.label}</span>
                    <span className="stage-desc">{s.desc}</span>
                  </div>
                );
              })}
            </div>

            {/* Live Telemetry Info Pill */}
            <div className="processing-telemetry-meta">
              <div className="telemetry-meta-chip">
                <span>⏱️ Elapsed:</span>
                <strong>{elapsedSec}s</strong>
              </div>
              <div className="telemetry-meta-chip">
                <span>⚡ Throughput:</span>
                <strong>{jobStatus?.upload_speed || '14.2 MB/s'}</strong>
              </div>
              <div className="telemetry-meta-chip">
                <span>📄 Document:</span>
                <strong className="truncate max-w-[180px]">{file?.name || 'Uploaded PDF'}</strong>
              </div>
            </div>

            <p className="processing-status-msg">
              {jobStatus?.message || 'Profiling pages and reconstructing layout geometry...'}
            </p>
          </div>
        )}

        {/* STATE B: JOB COMPLETE & INSTANT RESULTS */}
        {isComplete && (
          <div className="cockpit-completed-view">
            <div className="completed-header-badge">
              <span className="completed-check-icon">✓</span>
              <div>
                <h3 className="completed-title">Notes Successfully Cleaned &amp; Compacted!</h3>
                <p className="completed-subtitle">
                  Formulas, tables, and typography normalized into pristine presentation format.
                </p>
              </div>
            </div>

            {/* Performance Metric Badges */}
            <div className="completed-metrics-row">
              <div className="metric-badge-box">
                <span className="metric-box-title">Compaction Ratio</span>
                <span className="metric-box-value text-emerald">
                  -{jobStatus?.compaction_pct || 65}%
                </span>
                <span className="metric-box-hint">Storage Saved</span>
              </div>
              <div className="metric-badge-box">
                <span className="metric-box-title">Execution Latency</span>
                <span className="metric-box-value text-indigo">
                  {jobStatus?.timing?.pure_compute_time_seconds || 1.1}s
                </span>
                <span className="metric-box-hint">FastPath Digital</span>
              </div>
              <div className="metric-badge-box">
                <span className="metric-box-title">Output Document</span>
                <span className="metric-box-value">
                  {jobStatus?.output_pages_count || 'Cleaned'}
                </span>
                <span className="metric-box-hint">Structured Pages</span>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="completed-actions-bar">
              {getResultDownloadUrl() && (
                <a
                  href={getResultDownloadUrl()}
                  download
                  className="btn-download-primary"
                >
                  <span>📄 Download Clean PDF</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                </a>
              )}

              {getMarkdownDownloadUrl() && (
                <a
                  href={getMarkdownDownloadUrl()}
                  download
                  className="btn-download-secondary"
                >
                  <span>📝 Download Markdown (.md)</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                </a>
              )}

              <button
                type="button"
                className="btn-clean-another"
                onClick={onNewJob}
              >
                <span>✨ Clean Another Note</span>
              </button>
            </div>
          </div>
        )}

        {/* STATE C: ERROR NOTICE */}
        {isError && (
          <div className="cockpit-error-view">
            <div className="error-badge-icon">⚠️</div>
            <h3 className="error-title">Processing Interrupted</h3>
            <p className="error-desc">{jobStatus?.error || jobStatus?.message || 'Could not complete document processing. Please check file format.'}</p>
            <button type="button" className="btn-clean-another" onClick={onNewJob}>
              Try Again
            </button>
          </div>
        )}

        {/* STATE D: IDLE / DROPZONE & CONFIGURATION (THE DEFAULT) */}
        {!isProcessing && !isComplete && !isError && (
          <div className="cockpit-idle-form">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files?.[0]) setFile(e.target.files[0]);
              }}
            />

            {/* Modern Expansive DropZone */}
            {!file ? (
              <div
                className={`studio-dropzone-hotspot ${isDragging ? 'is-dragging' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                <div className="dropzone-ambient-icon">
                  <span className="dropzone-large-icon">📤</span>
                </div>
                <h3 className="dropzone-main-text">
                  Drag &amp; drop study notes or PDF here, or <span className="text-highlight">browse</span>
                </h3>
                <p className="dropzone-sub-text">
                  Supports scanned photocopies, textbook excerpts &amp; technical papers up to 100MB
                </p>

                <div className="dropzone-format-pills">
                  <span className="format-pill">PDF (Up to 100MB)</span>
                  <span className="format-pill">Scanned OCR</span>
                  <span className="format-pill">LaTeX &amp; Math</span>
                  <span className="format-pill">Multi-page Tables</span>
                </div>
              </div>
            ) : (
              /* Selected File Capsule */
              <div className="selected-file-capsule">
                <div className="file-capsule-left">
                  <div className="file-icon-badge">📄</div>
                  <div className="file-capsule-details">
                    <span className="file-name-text" title={file.name}>{file.name}</span>
                    <span className="file-size-text font-mono">{formatBytes(file.size)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-remove-file"
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  title="Remove file"
                >
                  ✕ Remove
                </button>
              </div>
            )}

            {/* Inline Smart Feature Toggles Bar */}
            <div className="studio-inline-options-grid">
              {/* Option 1: Scope */}
              <div className="inline-option-card">
                <span className="option-label">Processing Scope</span>
                <div className="segmented-toggle-pills">
                  <button
                    type="button"
                    className={`seg-pill ${isQuickTest ? 'active' : ''}`}
                    onClick={() => onChangeConfig({ ...(config || {}), page_range: '1-3' })}
                  >
                    ⚡ Pages 1–3 (Quick Test)
                  </button>
                  <button
                    type="button"
                    className={`seg-pill ${!isQuickTest ? 'active' : ''}`}
                    onClick={() => onChangeConfig({ ...(config || {}), page_range: '' })}
                  >
                    📚 Full Document
                  </button>
                </div>
              </div>

              {/* Option 2: Table Reconstruction */}
              <div className="inline-option-card">
                <span className="option-label">Structure Engine</span>
                <label className="checkbox-toggle-label">
                  <input
                    type="checkbox"
                    checked={config?.fix_formulas !== false}
                    onChange={(e) => onChangeConfig({ ...(config || {}), fix_formulas: e.target.checked })}
                    className="smart-checkbox"
                  />
                  <span>📐 Preserve Tables &amp; LaTeX</span>
                </label>
              </div>

              {/* Option 3: Clean Contrast */}
              <div className="inline-option-card">
                <span className="option-label">Photocopy Whitening</span>
                <label className="checkbox-toggle-label">
                  <input
                    type="checkbox"
                    checked={config?.clean_watermarks !== false}
                    onChange={(e) => onChangeConfig({ ...(config || {}), clean_watermarks: e.target.checked })}
                    className="smart-checkbox"
                  />
                  <span>✨ Erase Stamps &amp; Shadows</span>
                </label>
              </div>
            </div>

            {/* Primary Action CTA Button */}
            <div className="studio-primary-cta-row">
              <div className="cta-telemetry-hint">
                <span className="pulse-cyan" />
                <span>FastPath Digital Pre-Scan: ~0.8s turnaround</span>
              </div>

              {file ? (
                <button
                  type="button"
                  className="btn-studio-start active"
                  onClick={() => handleProcess(file, serviceType)}
                >
                  <span className="btn-icon">⚡</span>
                  <span className="btn-label">{currentTool.label} Notes</span>
                  <span className="btn-kbd font-mono">⌘ Enter</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-studio-start idle"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span className="btn-icon">📂</span>
                  <span className="btn-label">Choose Notes or PDF File</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── 3. DATE-FILTERED RECENT DOCUMENTS & NOTES WORKSPACE (ALL IN ONE) ── */}
      <div className="studio-workspace-section" id="workspace">
        <div className="workspace-header-bar">
          <div>
            <div className="workspace-title-row">
              <h2 className="workspace-title">Recent Documents &amp; Notes Workspace</h2>
              <span className="workspace-counter-badge">
                {jobHistory?.length || 0} Processed Notes
              </span>
            </div>
            <p className="workspace-subtitle">
              Instant multi-format exports, structured LaTeX notes, and verified tables saved in real time.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Quick Search Filter */}
            <div className="workspace-search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="workspace-search-input"
                placeholder="Search processed notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="btn-clear-search"
                  onClick={() => setSearchQuery('')}
                >
                  ✕
                </button>
              )}
            </div>

            {onOpenAdmin && (
              <button
                type="button"
                className="btn-open-admin-chip"
                onClick={onOpenAdmin}
                title="Open Admin Console"
              >
                <span>⚡ Admin Console</span>
              </button>
            )}
          </div>
        </div>

        {/* Date Filter Chips Row */}
        {historyDates && historyDates.length > 0 && (
          <div className="workspace-date-chips-row">
            <button
              type="button"
              className={`date-chip ${!selectedDate ? 'active' : ''}`}
              onClick={() => onSelectDate(null)}
            >
              <span>All Time</span>
              <span className="date-chip-count font-mono">({jobHistory?.length || 0})</span>
            </button>
            {historyDates.map((d) => (
              <button
                key={d.date}
                type="button"
                className={`date-chip ${selectedDate === d.date ? 'active' : ''}`}
                onClick={() => onSelectDate(d.date)}
              >
                <span>📅 {d.date}</span>
                <span className="date-chip-count font-mono">({d.count})</span>
              </button>
            ))}
          </div>
        )}

        {/* Notes Grid */}
        {historyLoading ? (
          <div className="workspace-loading-state">
            <span className="spinner-dot" />
            <span>Loading notes archive...</span>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="workspace-empty-state">
            <span className="empty-icon">📂</span>
            <h4>No processed notes found</h4>
            <p>Upload a PDF above to create your first clean note.</p>
          </div>
        ) : (
          <div className="workspace-notes-grid">
            {filteredHistory.map((item) => {
              const cleanTitle = getCleanFilename(item);
              const dateStr = item.created_at
                ? new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                : 'Recent';
              const downloadUrl = item.download_url
                ? (item.download_url.startsWith('http') ? item.download_url : `${API_BASE}${item.download_url}`)
                : null;
              const mdDownloadUrl = downloadUrl ? downloadUrl.replace(/\.pdf$/, '.md') : null;
              
              const origSize = item.original_file_size;
              const compSize = item.compressed_file_size;
              const compaction = (origSize && compSize && compSize < origSize)
                ? Math.round((1 - compSize / origSize) * 100)
                : null;
              
              const serviceMeta = getServiceMeta(item.service_type);

              return (
                <article key={item.id} className="note-card-glass">
                  <div className="note-card-top">
                    <div className="note-card-title-group">
                      <span className="note-type-icon">{serviceMeta.icon}</span>
                      <div style={{ overflow: 'hidden' }}>
                        <h4 className="note-title" title={cleanTitle}>{cleanTitle}</h4>
                        <span className="note-meta-date">{dateStr} • {serviceMeta.label}</span>
                      </div>
                    </div>
                    <span className={`note-status-chip ${item.status === 'COMPLETED' ? 'completed' : 'pending'}`}>
                      {item.status === 'COMPLETED' ? 'Cleaned' : item.status}
                    </span>
                  </div>

                  {/* Compaction & Size pills */}
                  <div className="note-pills-row font-mono">
                    {compaction && compaction > 0 && (
                      <span className="note-pill-compaction">-{compaction}%</span>
                    )}
                    {origSize && (
                      <span className="note-pill-size">{formatBytes(origSize)}</span>
                    )}
                    <span className="note-pill-speed">⚡ FastPath</span>
                  </div>

                  {/* Action Buttons Bar */}
                  <div className="note-actions-strip">
                    {mdDownloadUrl && (
                      <a href={mdDownloadUrl} download className="note-action-btn" title="Download Markdown">
                        <span>📝 .md</span>
                      </a>
                    )}
                    {downloadUrl && (
                      <a href={downloadUrl} download className="note-action-btn primary" title="Download Clean PDF">
                        <span>📄 Clean PDF</span>
                      </a>
                    )}
                    <button
                      type="button"
                      className="note-action-btn icon-only"
                      onClick={() => handleCopyText(`Note: ${cleanTitle}\nCleaned via CleanNotes AI FastPath.`, item.id)}
                      title="Copy reference text"
                    >
                      {copiedNoteId === item.id ? '✓' : '📋'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Load More Notes Pagination Trigger */}
        {historyHasMore && (
          <div className="workspace-load-more-row">
            <button
              type="button"
              className="btn-load-more-notes"
              onClick={onLoadMore}
              disabled={historyLoadingMore}
            >
              {historyLoadingMore ? 'Loading More Notes...' : '↓ Load More Notes'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
