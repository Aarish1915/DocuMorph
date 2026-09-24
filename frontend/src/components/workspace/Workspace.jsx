import React, { useState, useEffect } from 'react';
import ToolTabs from './ToolTabs';
import DropZone from './DropZone';
import SettingsPanel from './SettingsPanel';
import ProcessButton from './ProcessButton';
import UploadingScreen from './UploadingScreen';
import ProcessingScreen from './ProcessingScreen';
import ResultCard from './ResultCard';
import { API_BASE } from '../../config';

export default function Workspace({
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
  onNewJob,
  onOpenDonation,
  onToast,
}) {
  const [pageInfo, setPageInfo] = useState(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [confirmed50, setConfirmed50] = useState(false);

  useEffect(() => {
    if (!file) {
      setPageInfo(null);
      setConfirmed50(false);
      return;
    }

    let isMounted = true;
    const inspect = async () => {
      setIsInspecting(true);
      try {
        const sliceBuf = await file.slice(0, Math.min(file.size, 1500000)).arrayBuffer();
        const latinText = new TextDecoder('latin1').decode(new Uint8Array(sliceBuf));
        const countMatches = [...latinText.matchAll(/\/Count\s+(\d+)/g)];
        let detectedCount = 0;
        if (countMatches.length > 0) {
          const counts = countMatches.map((m) => parseInt(m[1], 10)).filter((n) => !isNaN(n));
          if (counts.length > 0) detectedCount = Math.max(...counts);
        }
        if (!detectedCount) {
          const pageMatches = latinText.match(/\/Type\s*\/Page\b/g);
          if (pageMatches) detectedCount = pageMatches.length;
        }

        if (detectedCount > 0 && isMounted) {
          setPageInfo({ pageCount: detectedCount, exceeds: detectedCount > 50 });
          setIsInspecting(false);
          return;
        }

        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch(`${API_BASE}/api/inspect-pdf`, { method: 'POST', body: fd });
        if (res.ok && isMounted) {
          const data = await res.json();
          setPageInfo({ pageCount: data.page_count, exceeds: data.exceeds_limit });
        }
      } catch (err) {
        console.debug('PDF inspection notice:', err);
      } finally {
        if (isMounted) setIsInspecting(false);
      }
    };

    inspect();
    return () => {
      isMounted = false;
    };
  }, [file]);

  const onProcessClick = () => {
    if (!file) return;
    if (pageInfo?.exceeds && !confirmed50) {
      const ok = window.confirm(
        `Large Document Detected: ${pageInfo.pageCount} Pages\n\nTo ensure fast turnaround (<30s), CleanNotes will automatically process the first 50 pages (Pages 1–50).\n\nClick OK to proceed with Pages 1–50.`
      );
      if (ok) {
        setConfirmed50(true);
        handleProcess(file, serviceType);
      }
      return;
    }
    handleProcess(file, serviceType);
  };

  const isUploading = Boolean(jobStatus && (jobStatus.status === 'UPLOADING' || jobStatus.status === 'CONNECTING'));
  const isActuallyProcessing = Boolean(
    jobStatus && ['QUEUED', 'PROCESSING', 'QUEUED_REPROCESS'].includes(jobStatus.status)
  );

  return (
    <div className="workspace-container">
      {/* Workspace Ambient Hero (Only on Upload State) */}
      {!isUploading && !isActuallyProcessing && !isComplete && (
        <div className="workspace-hero">
          <div className="status-pill-ambient">
            <span className="live-indicator-dot" />
            <span>AI Academic Restoration • Zero Retention</span>
          </div>
          <h1 className="workspace-hero-title">
            Transform Messy Scans into Pristine Study Notes
          </h1>
          <p className="workspace-hero-sub">
            Whiten dark photocopy stains, squeeze margins, extract LaTeX formulas, and translate without losing formatting.
          </p>
          <div className="trust-badges-row">
            <span className="trust-badge-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>100% In-Memory (No Storage)</span>
            </span>
            <span className="trust-badge-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <span>&lt; 3s High-Speed OCR</span>
            </span>
            <span className="trust-badge-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
              <span>Direct Mobile Download</span>
            </span>
          </div>
        </div>
      )}

      {/* Tool Tabs Segmented Switcher */}
      <ToolTabs
        activeTool={serviceType}
        onSelectTool={(toolId) => {
          setServiceType(toolId);
        }}
        disabled={isUploading || isActuallyProcessing}
      />

      {/* State Machine */}
      {isUploading ? (
        /* State 2A: Dedicated Uploading Screen */
        <UploadingScreen
          jobStatus={jobStatus}
          fileName={file?.name}
          onCancel={onNewJob}
        />
      ) : isActuallyProcessing ? (
        /* State 2B: Brand New High-Speed Processing Screen */
        <ProcessingScreen
          jobStatus={jobStatus}
          fileName={file?.name}
          tool={serviceType}
          onCancel={onNewJob}
        />
      ) : isComplete ? (
        /* State 3: Result State */
        <ResultCard
          jobStatus={jobStatus}
          tool={serviceType}
          fileName={file?.name}
          onNewJob={onNewJob}
          onOpenDonation={onOpenDonation}
          onToast={onToast}
        />
      ) : (
        /* State 1: Upload & Configure */
        <>
          <DropZone
            file={file}
            setFile={setFile}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
            disabled={isProcessing}
          />

          <SettingsPanel
            tool={serviceType}
            config={config}
            onChangeConfig={onChangeConfig}
            disabled={isProcessing}
          />

          {pageInfo?.exceeds && (
            <div
              style={{
                padding: '14px 18px',
                borderRadius: 'var(--radius-sm, 8px)',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                color: '#fbbf24',
                fontSize: '13.5px',
                lineHeight: '1.5',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <span>Large Document Detected: {pageInfo.pageCount} Pages</span>
              </div>
              <div style={{ color: 'var(--text-secondary, #cbd5e1)', fontSize: '13px' }}>
                To guarantee lightning-fast turnaround (&lt;30s), CleanNotes will automatically process the <strong>first 50 pages (Pages 1–50)</strong>.
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setConfirmed50(true)}
                  style={{
                    background: confirmed50 ? '#10b981' : '#f59e0b',
                    color: '#000',
                    fontWeight: 600,
                    fontSize: '12.5px',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {confirmed50 ? '✓ Ready (Pages 1–50 Confirmed)' : 'Confirm First 50 Pages'}
                </button>
              </div>
            </div>
          )}

          <ProcessButton
            hasFile={Boolean(file)}
            isProcessing={isProcessing}
            onClick={onProcessClick}
          />

          {isError && (
            <div
              style={{
                padding: '14px 18px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--danger-soft)',
                border: '1px solid var(--danger-border)',
                color: 'var(--danger)',
                fontSize: '13.5px',
                textAlign: 'center',
                fontWeight: 500
              }}
            >
              ⚠️ {jobStatus?.message || 'Processing encountered an error. Please try again.'}
            </div>
          )}
        </>
      )}
    </div>
  );
}
