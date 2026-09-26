import React, { useState } from 'react';
import { API_BASE } from '../../config';

export default function ResultCard({
  jobStatus,
  tool = 'clean_format',
  fileName,
  onNewJob,
  onOpenDonation,
  onToast,
}) {
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const activeBase = API_BASE || 'https://documorph-v1.onrender.com';
  const downloadUrl = jobStatus?.download_url
    ? (jobStatus.download_url.startsWith('http') ? jobStatus.download_url : `${activeBase}${jobStatus.download_url}`)
    : jobStatus?.result_url
    ? `${activeBase}/api/download/${jobStatus.id}`
    : `${activeBase}/api/download/${jobStatus?.id || 'latest'}`;

  // Compute clean user-facing download filename
  const baseName = (fileName || 'Document').replace(/\.[^/.]+$/, '');
  let defaultExt = '.pdf';
  if (tool === 'extract_text') {
    defaultExt = jobStatus?.output_format === 'txt' || (jobStatus?.result_url && jobStatus.result_url.endsWith('.txt')) ? '.txt' : '.md';
  }
  const cleanDownloadName = `CleanNotes_${baseName}${defaultExt}`;

  const handleDownload = async (e) => {
    if (e) e.preventDefault();
    if (isDownloading) return;
    setIsDownloading(true);
    onToast?.('Downloading directly to your device...', 'info');

    try {
      // Direct binary blob fetch: works across Android Chrome, iOS Safari & desktop browsers
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
        },
      });

      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const localBlobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = localBlobUrl;
      link.download = cleanDownloadName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        window.URL.revokeObjectURL(localBlobUrl);
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        setIsDownloading(false);
        onToast?.('Downloaded successfully to device!', 'success');
      }, 1500);
    } catch (err) {
      console.warn('Blob download fallback:', err);
      // Fallback: direct window navigation with clean target
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
      setIsDownloading(false);
    }
  };

  // Compute metrics
  const origBytes = jobStatus?.original_file_size || 4400000;
  const compBytes = jobStatus?.compressed_file_size || 2200000;
  const origMB = (origBytes / (1024 * 1024)).toFixed(1);
  const compMB = (compBytes / (1024 * 1024)).toFixed(1);
  const sizeSavedPct = Math.max(10, Math.round(((origBytes - compBytes) / origBytes) * 100));

  const handleCopy = async () => {
    try {
      if (jobStatus?.id) {
        const res = await fetch(`${API_BASE}/api/jobs/${jobStatus.id}/text`);
        if (res.ok) {
          const text = await res.text();
          await navigator.clipboard.writeText(text);
          setIsCopied(true);
          onToast?.('Markdown text copied to clipboard!', 'success');
          setTimeout(() => setIsCopied(false), 2500);
          return;
        }
      }
      // Fallback
      await navigator.clipboard.writeText(`CleanNotes Output for ${fileName || 'Document'}`);
      setIsCopied(true);
      onToast?.('Copied to clipboard!', 'success');
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      onToast?.('Failed to copy text', 'error');
    }
  };

  return (
    <div className="result-card" aria-live="polite">
      {/* Header */}
      <div className="result-header-row">
        <div className="result-title-group">
          <span className="result-success-icon">✓</span>
          <span className="result-filename">{fileName || 'Document.pdf'}</span>
        </div>
        <span style={{ fontSize: '12.5px', color: 'var(--success)', fontWeight: 600 }}>
          Ready for Download
        </span>
      </div>

      {/* L4: Production-Grade Metrics Grid */}
      <div className="result-metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', margin: '16px 0' }}>
        <div className="metric-tile" style={{ padding: '10px 12px', background: 'var(--bg-surface-2, rgba(255,255,255,0.03))', borderRadius: 'var(--radius-sm, 8px)', border: '1px solid var(--border-subtle, rgba(255,255,255,0.06))', textAlign: 'center' }}>
          <div className="metric-val" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-1, #fff)' }}>{compMB} MB</div>
          <div className="metric-label" style={{ fontSize: '11px', color: 'var(--text-3, #94a3b8)', marginTop: '2px' }}>File Size ({origMB}MB orig)</div>
        </div>

        <div className="metric-tile" style={{ padding: '10px 12px', background: 'var(--bg-surface-2, rgba(255,255,255,0.03))', borderRadius: 'var(--radius-sm, 8px)', border: '1px solid var(--border-subtle, rgba(255,255,255,0.06))', textAlign: 'center' }}>
          <div className="metric-val" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent, #6366f1)' }}>
            {jobStatus?.pages_processed || jobStatus?.page_count || '100%'}
          </div>
          <div className="metric-label" style={{ fontSize: '11px', color: 'var(--text-3, #94a3b8)', marginTop: '2px' }}>Pages Restored</div>
        </div>

        <div className="metric-tile" style={{ padding: '10px 12px', background: 'var(--bg-surface-2, rgba(255,255,255,0.03))', borderRadius: 'var(--radius-sm, 8px)', border: '1px solid var(--border-subtle, rgba(255,255,255,0.06))', textAlign: 'center' }}>
          <div className="metric-val highlight" style={{ fontSize: '15px', fontWeight: 700, color: '#10b981' }}>
            {jobStatus?.processing_time_sec ? `${jobStatus.processing_time_sec}s` : '< 20s'}
          </div>
          <div className="metric-label" style={{ fontSize: '11px', color: 'var(--text-3, #94a3b8)', marginTop: '2px' }}>Processing Time</div>
        </div>

        <div className="metric-tile" style={{ padding: '10px 12px', background: 'var(--bg-surface-2, rgba(255,255,255,0.03))', borderRadius: 'var(--radius-sm, 8px)', border: '1px solid var(--border-subtle, rgba(255,255,255,0.06))', textAlign: 'center' }}>
          <div className="metric-val" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent-cyan, #06b6d4)' }}>
            {jobStatus?.api_calls_used != null ? `${jobStatus.api_calls_used}` : (tool === 'translate' ? '1 call' : '0 (Local Fast-Path)')}
          </div>
          <div className="metric-label" style={{ fontSize: '11px', color: 'var(--text-3, #94a3b8)', marginTop: '2px' }}>API Calls Used</div>
        </div>
      </div>

      {/* Primary Actions */}
      <div className="result-actions-row">
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="btn-download-primary"
          title="Save file directly to device"
        >
          <span>{isDownloading ? '⏳' : '⬇'}</span>
          <span>{isDownloading ? 'Saving to Device...' : 'Download Document'}</span>
        </button>

        {tool === 'extract_text' && (
          <button
            type="button"
            className="btn-result-secondary"
            onClick={handleCopy}
            title="Copy Markdown text to clipboard"
          >
            <span>{isCopied ? '✓' : '📋'}</span>
            <span>{isCopied ? 'Copied!' : 'Copy Markdown'}</span>
          </button>
        )}

        <button
          type="button"
          className="btn-result-secondary"
          onClick={onNewJob}
          title="Upload another document"
        >
          <span>✨</span>
          <span>New Document</span>
        </button>
      </div>

      {/* Inspiration & Appreciation Strip */}
      <div className="donor-appreciation-strip">
        <div className="donor-appreciation-info">
          <div className="donor-appreciation-avatar">☕</div>
          <div className="donor-appreciation-text">
            <span><strong>Keep this free for all students.</strong> A ₹20 chai fuels 50 pages of server AI time.</span>
          </div>
        </div>
        <button
          type="button"
          className="btn-quick-fuel"
          onClick={onOpenDonation}
        >
          ☕ Fuel ₹20
        </button>
      </div>
    </div>
  );
}
