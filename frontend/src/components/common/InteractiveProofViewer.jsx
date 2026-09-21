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
    <div className="studio-specimen-desk">
      {/* Floating Glass Pill Switcher */}
      <div className="specimen-floating-toolbar">
        <div className="specimen-pill-group" role="group" aria-label="Specimen view modes">
          <button
            type="button"
            className={`specimen-pill ${viewMode === 'before' ? 'active' : ''}`}
            onClick={() => handleModeToggle('before')}
            title="View original scanned photocopy"
          >
            <span className="specimen-dot dot-scan" />
            <span>Scan</span>
          </button>
          <button
            type="button"
            className={`specimen-pill ${viewMode === 'split' ? 'active' : ''}`}
            onClick={() => handleModeToggle('split')}
            title="Interactive 50/50 Split Lens"
          >
            <span>50/50 Lens</span>
          </button>
          <button
            type="button"
            className={`specimen-pill specimen-pill--highlight ${viewMode === 'after' ? 'active' : ''}`}
            onClick={() => handleModeToggle('after')}
            title="View cleaned, bright printable notes"
          >
            <span className="specimen-dot dot-clean" />
            <span>Clean ✨</span>
          </button>
        </div>
      </div>

      {/* Frameless A4 Illuminated Stage */}
      <div
        className="specimen-a4-viewport"
        ref={viewportRef}
        style={{ '--split-pct': '50%' }}
        onMouseDown={(e) => startInteraction(e.clientX)}
        onMouseMove={(e) => isInteracting && handleMove(e.clientX)}
        onMouseUp={endInteraction}
        onMouseLeave={() => isInteracting && endInteraction()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        title="Slide or drag across to inspect clean note quality"
      >
        {/* Layer Before: Scanned Photocopy */}
        <div className="specimen-layer layer-before">
          <img
            src={beforeImg}
            alt="Original scan"
            className="specimen-img"
            draggable="false"
          />
        </div>

        {/* Layer After: Cleaned Note */}
        <div className="specimen-layer layer-after">
          <img
            src={afterImg}
            alt="Cleaned note"
            className="specimen-img"
            draggable="false"
          />
        </div>

        {/* 1px Neon Laser Sweep Divider */}
        <div className="specimen-laser-divider">
          <div className="laser-beam" />
          <div className="laser-handle" title="Drag to inspect">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" aria-hidden="true">
              <polyline points="7 8 3 12 7 16" />
              <polyline points="17 8 21 12 17 16" />
            </svg>
          </div>
        </div>
      </div>

      {/* Micro Caption Hint */}
      <div className="specimen-caption-hint">
        <span>Drag laser to inspect text sharpness &amp; stamp removal</span>
      </div>
    </div>
  );
}
