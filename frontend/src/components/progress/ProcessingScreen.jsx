import React, { useState, useEffect } from 'react';
import '../../styles/uploadProcessingScreens.css';

const PASSES = [
  {
    id: 1,
    title: 'Layout & Boundary Scan',
    desc: 'Profiles columns, tables & diagrams',
    icon: '📐',
    range: [0, 30]
  },
  {
    id: 2,
    title: 'Neural OCR & Math Siphon',
    desc: 'Extracts formulas & Devanagari text',
    icon: '🧠',
    range: [30, 65]
  },
  {
    id: 3,
    title: 'Smart Layout Polisher',
    desc: 'Cleans photocopy stains & stamps',
    icon: '✨',
    range: [65, 85]
  },
  {
    id: 4,
    title: 'Vector Print Typesetting',
    desc: 'Compiles high-DPI print-ready PDF',
    icon: '📄',
    range: [85, 100]
  },
];

const STUDY_TIPS = [
  { icon: '💡', title: 'Paper Saver Trick', text: 'Using 2-on-1 layout cuts printing paper costs by 50% for 500-page coaching binders.' },
  { icon: '🧠', title: 'Feynman Technique', text: 'After cleaning your notes, try explaining each formula derivation without looking at the solutions.' },
  { icon: '⏱', title: 'Active Recall', text: 'Use the extracted Markdown text in Anki or Quizlet for 3x faster spaced repetition.' },
  { icon: '📚', title: 'Toner Bleaching', text: 'CleanNotes whitening removes 85% of dark background stains, making printed text razor sharp.' },
  { icon: '🎯', title: 'UPSC / JEE Hack', text: 'Store formula sheets in Presentation Slide mode for quick revision on tablets.' },
  { icon: '📌', title: 'Zero Retention', text: 'Your uploaded notes are processed 100% in volatile memory and wiped clean on job completion.' },
];

export default function ProcessingScreen({
  jobStatus,
  fileName,
  tool = 'clean_format',
  onCancel,
}) {
  const [elapsedSec, setElapsedSec] = useState(0);
  const [tipIdx, setTipIdx] = useState(0);

  // Timer
  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Tip Rotator every 4.5s
  useEffect(() => {
    const tipTimer = setInterval(() => {
      setTipIdx((prev) => (prev + 1) % STUDY_TIPS.length);
    }, 4500);
    return () => clearInterval(tipTimer);
  }, []);

  const progressPct = Math.min(100, Math.max(5, jobStatus?.progress ?? 10));
  const currentMsg = jobStatus?.message || 'Processing document through neural pipeline...';

  // Determine current active pass
  let activePassId = 1;
  if (progressPct >= 85) activePassId = 4;
  else if (progressPct >= 65) activePassId = 3;
  else if (progressPct >= 30) activePassId = 2;
  else activePassId = 1;

  const currentTip = STUDY_TIPS[tipIdx];

  return (
    <div className="processing-screen-card" aria-live="polite">
      {/* Header Row */}
      <div className="proc-header-row">
        <div className="proc-file-info">
          <span className="proc-badge-engine">
            <span className="proc-pulse-dot" />
            Neural Engine Active
          </span>
          <h3 className="proc-filename" title={fileName}>
            📄 {fileName || 'Document.pdf'}
          </h3>
        </div>
        <div className="proc-timer-badge">
          <span className="proc-timer-icon">⏱</span>
          <span className="proc-timer-val">{elapsedSec}s</span>
        </div>
      </div>

      {/* Main Laser Progress Track */}
      <div className="proc-progress-block">
        <div className="proc-progress-track">
          <div
            className="proc-progress-fill"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="proc-status-meta">
          <div className="proc-status-msg">
            <span className="proc-spinner-ring" />
            <span>{currentMsg}</span>
          </div>
          <div className="proc-percentage-num">
            {progressPct}%
          </div>
        </div>
      </div>

      {/* 4-Pass Dynamic Pipeline Grid */}
      <div className="proc-pipeline-grid">
        {PASSES.map((p) => {
          const isDone = progressPct >= p.range[1];
          const isCurrent = activePassId === p.id && !isDone;
          const isPending = progressPct < p.range[0];

          return (
            <div
              key={p.id}
              className={`proc-pass-card ${isDone ? 'done' : ''} ${isCurrent ? 'active' : ''} ${isPending ? 'pending' : ''}`}
            >
              <div className="proc-pass-icon-row">
                <span className="proc-pass-icon">{p.icon}</span>
                <span className="proc-pass-status-pill">
                  {isDone ? '✓ Done' : isCurrent ? '⚡ In-Flight' : 'Pending'}
                </span>
              </div>
              <div className="proc-pass-title">Pass {p.id}: {p.title}</div>
              <div className="proc-pass-desc">{p.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Interactive Micro-Tip Card (Keeps user fascinated while waiting) */}
      <div className="proc-tip-banner" key={tipIdx}>
        <div className="proc-tip-icon">{currentTip.icon}</div>
        <div className="proc-tip-content">
          <span className="proc-tip-tag">{currentTip.title}</span>
          <span className="proc-tip-body">{currentTip.text}</span>
        </div>
      </div>

      {/* Cancel Option */}
      {onCancel && (
        <div className="proc-footer-actions">
          <span className="proc-privacy-note">
            🛡️ Encrypted In-Memory Pipeline • No Data Stored
          </span>
          <button
            type="button"
            onClick={onCancel}
            className="btn-cancel-proc"
          >
            Cancel Job
          </button>
        </div>
      )}
    </div>
  );
}
