import React, { useState, useEffect, useRef, useCallback } from 'react';
import { animate } from 'animejs';

export default function InteractiveProofViewer({
  title = 'Document Transformation Proof',
  badge = 'Verified Benchmark',
  badgeColor = '#2563eb',
  badgeBg = '#eff6ff',
  beforeImg,
  afterImg,
  beforeLabel = 'Original Scan (Ads & Smudges)',
  afterLabel = 'DocuMorph Clean A4',
  highlights = ['Ads Removed', 'LaTeX Restored'],
}) {
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'before' | 'after'
  const [isInteracting, setIsInteracting] = useState(false);
  const [phase, setPhase] = useState('sweeping');

  const viewportRef = useRef(null);
  const currentSplitRef = useRef(50);
  const sweepAnimRef = useRef(null);
  const idleResumeTimerRef = useRef(null);

  // Check if user prefers reduced motion (WCAG accessibility compliance)
  const prefersReducedMotion = typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Update CSS variable directly on the DOM for 60fps hardware acceleration
  const setSplitDOM = useCallback((pct) => {
    currentSplitRef.current = pct;
    if (viewportRef.current) {
      viewportRef.current.style.setProperty('--split-pct', `${pct}%`);
    }
  }, []);

  // Scrubbing handler
  const handleMove = useCallback((clientX) => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const targetPct = Math.max(2, Math.min(98, (x / rect.width) * 100));

    setViewMode('split');
    const tracker = { pct: currentSplitRef.current };
    animate(tracker, {
      pct: targetPct,
      duration: 50,
      ease: 'outQuad',
      onUpdate: () => setSplitDOM(tracker.pct),
    });
  }, [setSplitDOM]);

  const startInteraction = (clientX) => {
    setIsInteracting(true);
    if (idleResumeTimerRef.current) clearTimeout(idleResumeTimerRef.current);
    if (sweepAnimRef.current && sweepAnimRef.current.pause) sweepAnimRef.current.pause();
    handleMove(clientX);
  };

  const endInteraction = () => {
    setIsInteracting(false);
    if (idleResumeTimerRef.current) clearTimeout(idleResumeTimerRef.current);
    idleResumeTimerRef.current = setTimeout(() => {
      setPhase('sweeping');
    }, 4500);
  };

  const onTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  // One-click mode toggle
  const handleModeToggle = (mode) => {
    setViewMode(mode);
    if (idleResumeTimerRef.current) clearTimeout(idleResumeTimerRef.current);
    if (sweepAnimRef.current && sweepAnimRef.current.pause) sweepAnimRef.current.pause();

    if (mode === 'before') {
      setSplitDOM(4);
    } else if (mode === 'after') {
      setSplitDOM(96);
    } else {
      setSplitDOM(50);
    }

    idleResumeTimerRef.current = setTimeout(() => {
      setPhase('sweeping');
    }, 5500);
  };

  // Anime.js auto-sweep animation
  useEffect(() => {
    if (isInteracting || viewMode !== 'split' || prefersReducedMotion) return;

    if (phase === 'sweeping') {
      const splitObj = { pct: currentSplitRef.current };
      sweepAnimRef.current = animate(splitObj, {
        pct: 88,
        duration: 2400,
        ease: 'inOutQuad',
        onUpdate: () => setSplitDOM(splitObj.pct),
        onComplete: () => {
          setTimeout(() => {
            if (!isInteracting) {
              const backObj = { pct: 88 };
              sweepAnimRef.current = animate(backObj, {
                pct: 12,
                duration: 2400,
                ease: 'inOutQuad',
                onUpdate: () => setSplitDOM(backObj.pct),
                onComplete: () => {
                  setTimeout(() => setPhase('sweeping'), 1000);
                },
              });
            }
          }, 1800);
        },
      });

      return () => {
        if (sweepAnimRef.current && sweepAnimRef.current.pause) {
          sweepAnimRef.current.pause();
        }
      };
    }
  }, [phase, isInteracting, viewMode, prefersReducedMotion, setSplitDOM]);

  return (
    <div className="proof-viewer-card">
      {/* Header */}
      <div className="proof-viewer-header">
        <div>
          <div className="proof-viewer-title">{title}</div>
          <div className="proof-highlights-row">
            {highlights.map((h, i) => (
              <span key={i} className="proof-highlight-pill">✓ {h}</span>
            ))}
          </div>
        </div>
        <span
          className="proof-badge-pill"
          style={{ color: badgeColor, backgroundColor: badgeBg }}
        >
          {badge}
        </span>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="proof-mode-tabs-bar">
        <button
          type="button"
          className={`proof-mode-btn ${viewMode === 'before' ? 'active' : ''}`}
          onClick={() => handleModeToggle('before')}
        >
          <span className="dot red"></span> Original Scan
        </button>
        <button
          type="button"
          className={`proof-mode-btn ${viewMode === 'split' ? 'active' : ''}`}
          onClick={() => handleModeToggle('split')}
        >
          <span>⚡</span> Split Comparison
        </button>
        <button
          type="button"
          className={`proof-mode-btn ${viewMode === 'after' ? 'active' : ''}`}
          onClick={() => handleModeToggle('after')}
        >
          <span className="dot green"></span> Clean A4
        </button>
      </div>

      {/* Interactive Split Canvas */}
      <div
        className="proof-canvas-stage"
        ref={viewportRef}
        style={{ '--split-pct': '50%' }}
        onMouseDown={(e) => startInteraction(e.clientX)}
        onMouseMove={(e) => isInteracting && handleMove(e.clientX)}
        onMouseUp={endInteraction}
        onMouseLeave={() => isInteracting && endInteraction()}
        onTouchStart={(e) => e.touches[0] && startInteraction(e.touches[0].clientX)}
        onTouchMove={onTouchMove}
        onTouchEnd={endInteraction}
      >
        {/* Floating Badges */}
        <div className="proof-status-overlay">
          <span className="status-chip before">
            <span className="dot red"></span> Scan
          </span>
          <span className="status-chip after">
            <span className="dot green"></span> Clean A4
          </span>
        </div>

        {/* Layer Before: Scanned Page */}
        <div className="proof-layer layer-before">
          <img
            src={beforeImg}
            alt="Original scanned document"
            className="proof-img"
            draggable="false"
          />
        </div>

        {/* Layer After: Clean Vector A4 */}
        <div className="proof-layer layer-after">
          <img
            src={afterImg}
            alt="DocuMorph cleaned document"
            className="proof-img"
            draggable="false"
          />
        </div>

        {/* Draggable Laser Split Divider */}
        <div className="proof-split-divider">
          <div className="divider-laser"></div>
          <div className="divider-knob" title="Drag to compare">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
              <polyline points="7 8 3 12 7 16" />
              <polyline points="17 8 21 12 17 16" />
              <line x1="3" y1="12" x2="21" y2="12" />
            </svg>
          </div>
        </div>
      </div>

      {/* Footer Info Bar */}
      <div className="proof-viewer-footer">
        <span className="footer-side before">{beforeLabel}</span>
        <span className="footer-arrow">➔</span>
        <span className="footer-side after">{afterLabel}</span>
      </div>
    </div>
  );
}
