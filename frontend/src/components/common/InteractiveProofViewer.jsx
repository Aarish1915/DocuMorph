import React, { useState, useEffect, useRef, useCallback } from 'react';
import { animate } from 'animejs';

export default function InteractiveProofViewer({
  title = 'Quality Comparison',
  beforeImg,
  afterImg,
  beforeLabel = 'Scan with Ads & Watermarks',
  afterLabel = 'Clean Printable Note',
}) {
  const [displayMode, setDisplayMode] = useState('split'); // 'split' | 'side'
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'before' | 'after'
  const [isInteracting, setIsInteracting] = useState(false);
  const [phase, setPhase] = useState('sweeping');

  const viewportRef = useRef(null);
  const currentSplitRef = useRef(50);
  const sweepAnimRef = useRef(null);
  const idleResumeTimerRef = useRef(null);

  // Check if user prefers reduced motion (WCAG compliance)
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
      duration: 45,
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

  const touchStartPos = useRef({ x: 0, y: 0 });
  const isDraggingSlider = useRef(false);

  const onTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      isDraggingSlider.current = false;
    }
  };

  const onTouchMove = (e) => {
    if (!e.touches || !e.touches[0]) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = Math.abs(currentX - touchStartPos.current.x);
    const deltaY = Math.abs(currentY - touchStartPos.current.y);

    // If vertical movement dominates, allow native page scroll
    if (!isDraggingSlider.current) {
      if (deltaY > deltaX && deltaY > 8) {
        return; // Don't block vertical scrolling on mobile
      }
      if (deltaX > deltaY && deltaX > 8) {
        isDraggingSlider.current = true;
        setIsInteracting(true);
        if (idleResumeTimerRef.current) clearTimeout(idleResumeTimerRef.current);
        if (sweepAnimRef.current && sweepAnimRef.current.pause) sweepAnimRef.current.pause();
      }
    }

    if (isDraggingSlider.current) {
      handleMove(currentX);
    }
  };

  const onTouchEnd = () => {
    isDraggingSlider.current = false;
    endInteraction();
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
    if (isInteracting || viewMode !== 'split' || displayMode !== 'split' || prefersReducedMotion) return;

    if (phase === 'sweeping') {
      const splitObj = { pct: currentSplitRef.current };
      sweepAnimRef.current = animate(splitObj, {
        pct: 92,
        duration: 2500,
        ease: 'inOutQuad',
        onUpdate: () => setSplitDOM(splitObj.pct),
        onComplete: () => {
          setTimeout(() => {
            if (!isInteracting) {
              const backObj = { pct: 92 };
              sweepAnimRef.current = animate(backObj, {
                pct: 8,
                duration: 2500,
                ease: 'inOutQuad',
                onUpdate: () => setSplitDOM(backObj.pct),
                onComplete: () => {
                  setTimeout(() => setPhase('sweeping'), 1200);
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
  }, [phase, isInteracting, viewMode, displayMode, prefersReducedMotion, setSplitDOM]);

  return (
    <div className="proof-viewer-card">
      {/* Top Bar with Mode Controls */}
      <div className="proof-viewer-top-bar">
        <div className="proof-status-indicator">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: 'var(--color-primary, #2563eb)' }}>
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <span className="proof-title-text">{title}</span>
        </div>

        <div className="proof-controls-right">
          {/* Comparison Mode: Split Slider vs Side-by-Side */}
          <div className="proof-display-mode-switch" role="radiogroup" aria-label="Comparison View Mode">
            <button
              type="button"
              className={`proof-mode-btn ${displayMode === 'split' ? 'active' : ''}`}
              onClick={() => setDisplayMode('split')}
              title="Interactive Draggable Split Slider"
              aria-checked={displayMode === 'split'}
              role="radio"
            >
              <span>⚡</span> Split Slider
            </button>
            <button
              type="button"
              className={`proof-mode-btn ${displayMode === 'side' ? 'active' : ''}`}
              onClick={() => setDisplayMode('side')}
              title="View Both Full Pages Side by Side"
              aria-checked={displayMode === 'side'}
              role="radio"
            >
              <span>⊞</span> Side-by-Side
            </button>
          </div>

          {displayMode === 'split' && (
            <div className="proof-preset-bar" role="group" aria-label="Slider Position Presets">
              <button
                type="button"
                className={`proof-preset-chip ${viewMode === 'before' ? 'selected' : ''}`}
                onClick={() => handleModeToggle('before')}
                title="Show full original scan"
              >
                <span className="dot red" /> {beforeLabel ? beforeLabel.split(' ')[0] : 'Before'}
              </button>
              <button
                type="button"
                className={`proof-preset-chip ${viewMode === 'split' ? 'selected' : ''}`}
                onClick={() => handleModeToggle('split')}
                title="Reset split position to 50/50"
              >
                50/50
              </button>
              <button
                type="button"
                className={`proof-preset-chip proof-preset-chip--highlight ${viewMode === 'after' ? 'selected' : ''}`}
                onClick={() => handleModeToggle('after')}
                title="Show full cleaned document"
                aria-pressed={viewMode === 'after'}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ marginRight: '2px' }}>
                  <path d="M12 2l2.4 7.2L21.6 12l-7.2 2.8L12 22l-2.4-7.2L2.4 12l7.2-2.8L12 2z"/>
                </svg>
                {afterLabel ? afterLabel.split(' ')[0] : 'Clean'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── MODE 1: INTERACTIVE SPLIT SLIDER (True A4 Ratio, Zero Cropping) ── */}
      {displayMode === 'split' ? (
        <div className="proof-split-container">
          <div
            className="proof-canvas-stage true-a4-canvas"
            ref={viewportRef}
            style={{ '--split-pct': '50%' }}
            onMouseDown={(e) => startInteraction(e.clientX)}
            onMouseMove={(e) => isInteracting && handleMove(e.clientX)}
            onMouseUp={endInteraction}
            onMouseLeave={() => isInteracting && endInteraction()}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            title="Drag left or right to compare full page"
          >
            {/* Floating Badges */}
            <div className="proof-status-overlay">
              <span className="status-chip before">
                <span className="dot red" /> {beforeLabel || 'Before'}
              </span>
              <span className="status-chip after">
                <span className="dot green" /> {afterLabel || 'After'}
              </span>
            </div>

            {/* Layer Before: Whole Scanned Page */}
            <div className="proof-layer layer-before">
              <img
                src={beforeImg}
                alt="Original scan full page"
                className="proof-full-page-img"
                draggable="false"
              />
            </div>

            {/* Layer After: Whole Cleaned Page */}
            <div className="proof-layer layer-after">
              <img
                src={afterImg}
                alt="Cleaned full page"
                className="proof-full-page-img"
                draggable="false"
              />
            </div>

            {/* Draggable Laser Split Divider */}
            <div className="proof-split-divider">
              <div className="divider-laser" />
              <div className="divider-knob" title="Drag to compare full page">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
                  <polyline points="7 8 3 12 7 16" />
                  <polyline points="17 8 21 12 17 16" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── MODE 2: DUAL FULL-PAGE SIDE-BY-SIDE (CamScanner & vFlat Standard) ── */
        <div className="proof-side-by-side-grid">
          {/* Left: Original Scan Document */}
          <div className="side-doc-card">
            <div className="side-doc-header before">
              <span className="dot red" />
              <span className="side-doc-title">{beforeLabel || 'Before'}</span>
            </div>
            <div className="side-doc-stage">
              <img
                src={beforeImg}
                alt="Original full scan"
                className="proof-full-page-img"
                draggable="false"
              />
            </div>
          </div>

          {/* Right: Cleaned Document */}
          <div className="side-doc-card">
            <div className="side-doc-header after">
              <span className="dot green" />
              <span className="side-doc-title">{afterLabel || 'After'}</span>
            </div>
            <div className="side-doc-stage">
              <img
                src={afterImg}
                alt="Cleaned full page"
                className="proof-full-page-img"
                draggable="false"
              />
            </div>
          </div>
        </div>
      )}

      {/* Proof Viewer Bottom Value Strip */}
      <div className="proof-viewer-footer">
        <div className="proof-labels-row">
          <span className="footer-side before">{beforeLabel}</span>
          <span className="footer-arrow">➔</span>
          <span className="footer-side after">{afterLabel}</span>
        </div>
      </div>
    </div>
  );
}
