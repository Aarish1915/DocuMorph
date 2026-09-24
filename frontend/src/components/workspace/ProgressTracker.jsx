import React, { useState, useEffect } from 'react';

const STAGES = [
  { icon: '📄', label: 'Reading' },
  { icon: '🔍', label: 'Layout' },
  { icon: '🧠', label: 'AI OCR' },
  { icon: 'T',  label: 'Format' },
  { icon: '✅', label: 'Done' },
];

export default function ProgressTracker({
  jobStatus,
  stageIdx = 0,
  fileName,
  onCancel,
}) {
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const progressPct = jobStatus?.progress ?? 5;
  const isUploading = jobStatus?.status === 'UPLOADING';
  const displayMsg = jobStatus?.message || (isUploading ? 'Uploading file...' : 'Running pipeline...');

  return (
    <div className="progress-tracker-card" aria-live="polite">
      <div className="progress-header-row">
        <span className="progress-filename" title={fileName}>
          📄 {fileName || 'Document.pdf'}
        </span>
        <span className="progress-timer">
          ⏱ {elapsedSec}s elapsed
        </span>
      </div>

      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{ width: `${Math.min(100, Math.max(3, progressPct))}%` }}
        />
      </div>

      <div className="progress-msg-row">
        <span>{displayMsg}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
          {progressPct}%
        </span>
      </div>

      <div className="progress-pipeline-steps">
        {STAGES.map((s, idx) => {
          const isCompleted = idx < stageIdx;
          const isActive = idx === stageIdx;
          return (
            <div
              key={s.label}
              className={`pipeline-step-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
            >
              <span style={{ fontSize: '15px' }}>{s.icon}</span>
              <span>{s.label}</span>
            </div>
          );
        })}
      </div>

      {onCancel && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-3)',
              fontSize: '12px',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Cancel processing
          </button>
        </div>
      )}
    </div>
  );
}
