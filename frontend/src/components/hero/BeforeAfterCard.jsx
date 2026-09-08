import React, { useState, useEffect, useRef, useCallback } from 'react';
import { animate } from 'animejs';

const SCENARIOS = [
  {
    id: 'clean_format',
    shortTab: '✨ Clean & Beautify',
    title: 'Physics & JEE Notes',
    tag: '0 Ads • Crisp A4',
    tagColor: '#2563eb',
    tagBg: '#eff6ff',
    icon: '✨',
    beforeImg: '/samples/doc_1_before.jpg',
    afterImg: '/samples/doc_1_after.jpg',
    footerBefore: 'Telegram Ads & Watermark',
    footerAfter: 'Pristine A4 & Vector Math',
  },
  {
    id: 'compress_space',
    shortTab: '📉 Compact & Save',
    title: 'UPSC Economy Booklet',
    tag: 'Save 64% Paper',
    tagColor: '#16a34a',
    tagBg: '#f0fdf4',
    icon: '📉',
    beforeImg: '/samples/doc_2_before.jpg',
    afterImg: '/samples/doc_2_after.jpg',
    footerBefore: '50 Loose Pages (₹250)',
    footerAfter: '18 Dense Sheets (₹90)',
  },
  {
    id: 'extract_table',
    shortTab: '📋 Copy Tables',
    title: 'Constitutional Rights Table',
    tag: 'Notion & Excel Ready',
    tagColor: '#0284c7',
    tagBg: '#f0f9ff',
    icon: '📋',
    beforeImg: '/samples/doc_3_before.jpg',
    afterImg: '/samples/doc_3_after.jpg',
    footerBefore: 'Locked in Scan Image',
    footerAfter: 'Clean Markdown Table',
  },
  {
    id: 'translate_math',
    shortTab: '🌐 Translate PDF',
    title: 'Optics & Physics Translation',
    tag: '10+ Indic Languages',
    tagColor: '#ea580c',
    tagBg: '#fff7ed',
    icon: '🌐',
    beforeImg: '/samples/doc_4_before.jpg',
    afterImg: '/samples/doc_4_after.jpg',
    footerBefore: 'English Technical Scan',
    footerAfter: 'Fluent Hindi + Math Intact',
  },
  {
    id: 'photocopy_clean',
    shortTab: '⚡ Remove Smudges',
    title: 'Handwritten Exam Sheet',
    tag: 'Edge Shadows Erased',
    tagColor: '#7c3aed',
    tagBg: '#f5f3ff',
    icon: '⚡',
    beforeImg: '/samples/sample1_before.png',
    afterImg: '/samples/sample1_after.png',
    footerBefore: 'Dark Photocopy Margins',
    footerAfter: 'Whiter Background A4',
  },
];

export default function BeforeAfterCard() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'before' | 'after'
  const [phase, setPhase] = useState('before'); // 'before' -> 'sweeping' -> 'hold_after'

  const cardSurfaceRef = useRef(null);
  const activeCardViewportRef = useRef(null);
  const currentSplitRef = useRef(8);
  const sweepAnimRef = useRef(null);
  const idleResumeTimerRef = useRef(null);
  const cycleTimeoutRef = useRef(null);

  // Preload all benchmark images
  useEffect(() => {
    SCENARIOS.forEach((s) => {
      const imgB = new Image();
      imgB.src = s.beforeImg;
      const imgA = new Image();
      imgA.src = s.afterImg;
    });
  }, []);

  // Set split percentage directly on DOM CSS variable
  const setSplitDOM = useCallback((pct) => {
    currentSplitRef.current = pct;
    if (activeCardViewportRef.current) {
      activeCardViewportRef.current.style.setProperty('--split-pct', `${pct}%`);
    }
  }, []);

  // 3D Perspective Tilt on Active Center Card via Anime.js
  const handleCardMouseMove = (e) => {
    if (!cardSurfaceRef.current || isInteracting) return;
    const rect = cardSurfaceRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotX = (y / (rect.height / 2)) * -5;
    const rotY = (x / (rect.width / 2)) * 5;

    animate(cardSurfaceRef.current, {
      rotateX: rotX,
      rotateY: rotY,
      duration: 160,
      ease: 'outQuad',
    });
  };

  const handleCardMouseLeave = () => {
    if (!cardSurfaceRef.current) return;
    animate(cardSurfaceRef.current, {
      rotateX: 0,
      rotateY: 0,
      duration: 500,
      ease: 'outElastic(1, .5)',
    });
  };

  // Scrubbing handler
  const handleMove = useCallback((clientX) => {
    if (!activeCardViewportRef.current) return;
    const rect = activeCardViewportRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const targetPct = Math.max(5, Math.min(95, (x / rect.width) * 100));

    setViewMode('split');
    const tracker = { pct: currentSplitRef.current };
    animate(tracker, {
      pct: targetPct,
      duration: 60,
      ease: 'outQuad',
      onUpdate: () => setSplitDOM(tracker.pct),
    });
  }, [setSplitDOM]);

  const startInteraction = (clientX) => {
    setIsInteracting(true);
    if (cycleTimeoutRef.current) clearTimeout(cycleTimeoutRef.current);
    if (idleResumeTimerRef.current) clearTimeout(idleResumeTimerRef.current);
    if (sweepAnimRef.current && sweepAnimRef.current.pause) sweepAnimRef.current.pause();
    handleMove(clientX);
  };

  const endInteraction = () => {
    setIsInteracting(false);
    if (idleResumeTimerRef.current) clearTimeout(idleResumeTimerRef.current);
    idleResumeTimerRef.current = setTimeout(() => {
      setPhase('sweeping');
    }, 4000);
  };

  const onTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  // One-click mode toggle
  const handleModeToggle = (mode, e) => {
    if (e) e.stopPropagation();
    setViewMode(mode);
    if (cycleTimeoutRef.current) clearTimeout(cycleTimeoutRef.current);
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
    }, 5000);
  };

  // Auto-sweep cycle
  useEffect(() => {
    if (isInteracting) return;

    if (phase === 'before') {
      setSplitDOM(8);
      cycleTimeoutRef.current = setTimeout(() => {
        setPhase('sweeping');
      }, 1000);
      return () => clearTimeout(cycleTimeoutRef.current);
    }

    if (phase === 'sweeping') {
      const splitObj = { pct: currentSplitRef.current };
      sweepAnimRef.current = animate(splitObj, {
        pct: 92,
        duration: 2600,
        ease: 'inOutQuad',
        onUpdate: () => {
          setSplitDOM(splitObj.pct);
        },
        onComplete: () => {
          setPhase('hold_after');
        },
      });

      return () => {
        if (sweepAnimRef.current && sweepAnimRef.current.pause) {
          sweepAnimRef.current.pause();
        }
      };
    }

    if (phase === 'hold_after') {
      setSplitDOM(94);
      cycleTimeoutRef.current = setTimeout(() => {
        setActiveIdx((prev) => (prev + 1) % SCENARIOS.length);
        setPhase('before');
      }, 3000);
      return () => clearTimeout(cycleTimeoutRef.current);
    }
  }, [phase, isInteracting, setSplitDOM]);

  const handleNext = () => {
    if (cycleTimeoutRef.current) clearTimeout(cycleTimeoutRef.current);
    if (idleResumeTimerRef.current) clearTimeout(idleResumeTimerRef.current);
    if (sweepAnimRef.current && sweepAnimRef.current.pause) sweepAnimRef.current.pause();
    setActiveIdx((prev) => (prev + 1) % SCENARIOS.length);
    setPhase('before');
  };

  const handlePrev = () => {
    if (cycleTimeoutRef.current) clearTimeout(cycleTimeoutRef.current);
    if (idleResumeTimerRef.current) clearTimeout(idleResumeTimerRef.current);
    if (sweepAnimRef.current && sweepAnimRef.current.pause) sweepAnimRef.current.pause();
    setActiveIdx((prev) => (prev - 1 + SCENARIOS.length) % SCENARIOS.length);
    setPhase('before');
  };

  // Normalize position offset in 5-card carousel: -2, -1, 0, 1, 2
  const getCardClass = (index) => {
    let diff = index - activeIdx;
    const total = SCENARIOS.length;
    while (diff > total / 2) diff -= total;
    while (diff < -total / 2) diff += total;

    if (diff === 0) return 'coverflow-card pos-center';
    if (diff === -1) return 'coverflow-card pos-left-1';
    if (diff === -2) return 'coverflow-card pos-left-2';
    if (diff === 1) return 'coverflow-card pos-right-1';
    if (diff === 2) return 'coverflow-card pos-right-2';
    return 'coverflow-card pos-hidden';
  };

  return (
    <div className="card-stack-3d-wrapper">
      {/* ── TOP SCENARIO CHIPS ── */}
      <div className="card-stack-tabs-bar" role="tablist" aria-label="Proof Scenarios">
        {SCENARIOS.map((s, idx) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={activeIdx === idx}
            className={`stack-tab-chip ${activeIdx === idx ? 'active' : ''}`}
            onClick={() => {
              if (activeIdx !== idx) {
                if (cycleTimeoutRef.current) clearTimeout(cycleTimeoutRef.current);
                if (idleResumeTimerRef.current) clearTimeout(idleResumeTimerRef.current);
                if (sweepAnimRef.current && sweepAnimRef.current.pause) sweepAnimRef.current.pause();
                setActiveIdx(idx);
                setPhase('before');
              }
            }}
          >
            {s.shortTab}
          </button>
        ))}
      </div>

      {/* ── 3D COVERFLOW STAGE ── */}
      <div className="coverflow-3d-stage">
        {/* Navigation Arrows */}
        <button
          type="button"
          className="coverflow-nav-arrow arrow-left"
          aria-label="Previous scenario"
          onClick={handlePrev}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <button
          type="button"
          className="coverflow-nav-arrow arrow-right"
          aria-label="Next scenario"
          onClick={handleNext}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {/* 3D Track hosting the 5-card arc */}
        <div className="coverflow-3d-track">
          {SCENARIOS.map((scenario, index) => {
            const cardClass = getCardClass(index);
            const isCenter = cardClass.includes('pos-center');

            return (
              <div
                key={scenario.id}
                className={cardClass}
                onClick={() => {
                  if (!isCenter) {
                    if (cycleTimeoutRef.current) clearTimeout(cycleTimeoutRef.current);
                    if (idleResumeTimerRef.current) clearTimeout(idleResumeTimerRef.current);
                    if (sweepAnimRef.current && sweepAnimRef.current.pause) sweepAnimRef.current.pause();
                    setActiveIdx(index);
                    setPhase('before');
                  }
                }}
              >
                {isCenter ? (
                  /* ── CENTER ACTIVE CARD (INTERACTIVE SPLIT PROOF) ── */
                  <div
                    className="card-surface center-surface"
                    ref={cardSurfaceRef}
                    onMouseMove={handleCardMouseMove}
                    onMouseLeave={handleCardMouseLeave}
                  >
                    {/* Top Header */}
                    <div className="card-surface-top">
                      <div className="top-title-wrap">
                        <span className="card-top-icon">{scenario.icon}</span>
                        <h4 className="card-title">{scenario.title}</h4>
                      </div>

                      {/* Quick Mode Switcher Pills */}
                      <div className="quick-mode-pills" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className={`mode-btn ${viewMode === 'before' ? 'active' : ''}`}
                          onClick={(e) => handleModeToggle('before', e)}
                          title="View 100% Raw Scan"
                        >
                          Scan
                        </button>
                        <button
                          type="button"
                          className={`mode-btn ${viewMode === 'split' ? 'active' : ''}`}
                          onClick={(e) => handleModeToggle('split', e)}
                          title="Interactive Split Comparison"
                        >
                          Split
                        </button>
                        <button
                          type="button"
                          className={`mode-btn ${viewMode === 'after' ? 'active' : ''}`}
                          onClick={(e) => handleModeToggle('after', e)}
                          title="View 100% Clean A4"
                        >
                          Clean
                        </button>
                      </div>
                    </div>

                    {/* Canvas Viewport (Complete A4 Portrait Page) */}
                    <div
                      className="card-canvas-viewport"
                      ref={activeCardViewportRef}
                      style={{ '--split-pct': '8%' }}
                      onMouseDown={(e) => startInteraction(e.clientX)}
                      onMouseMove={(e) => isInteracting && handleMove(e.clientX)}
                      onMouseUp={endInteraction}
                      onMouseLeave={() => isInteracting && endInteraction()}
                      onTouchStart={(e) => e.touches[0] && startInteraction(e.touches[0].clientX)}
                      onTouchMove={onTouchMove}
                      onTouchEnd={endInteraction}
                    >
                      {/* Floating Status Dots */}
                      <div className="canvas-status-overlay">
                        <span className="mini-badge before">
                          <span className="dot red"></span> Scan
                        </span>
                        <span className="mini-badge after">
                          <span className="dot green"></span> Clean A4
                        </span>
                      </div>

                      {/* Under Layer: Scanned Document Page */}
                      <div className="sync-layer layer-before">
                        <img
                          src={scenario.beforeImg}
                          alt={`${scenario.title} - Scanned`}
                          className="real-proof-img"
                          draggable="false"
                        />
                      </div>

                      {/* Reveal Layer: Clean A4 Document Page */}
                      <div className="sync-layer layer-after">
                        <img
                          src={scenario.afterImg}
                          alt={`${scenario.title} - Clean A4`}
                          className="real-proof-img"
                          draggable="false"
                        />
                      </div>

                      {/* Laser Split Divider with Draggable Knob */}
                      <div className="canvas-split-line">
                        <div className="laser-beam"></div>
                        <div className="laser-handle" title="Drag to compare">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="7 8 3 12 7 16" />
                            <polyline points="17 8 21 12 17 16" />
                            <line x1="3" y1="12" x2="21" y2="12" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Compact Footer */}
                    <div className="card-surface-footer">
                      <span className="footer-label before">{scenario.footerBefore}</span>
                      <span className="footer-arrow">➔</span>
                      <span className="footer-label after">{scenario.footerAfter}</span>
                    </div>
                  </div>
                ) : (
                  /* ── FLANKING 3D PERSPECTIVE CARDS (COVERFLOW EFFECT) ── */
                  <div className="card-surface flanking-surface">
                    <div className="flanking-header">
                      <span className="flanking-icon">{scenario.icon}</span>
                      <span className="flanking-tag" style={{ color: scenario.tagColor, backgroundColor: scenario.tagBg }}>
                        {scenario.tag}
                      </span>
                    </div>

                    <h5 className="flanking-title">{scenario.title}</h5>

                    {/* Visual Document Preview in Perspective */}
                    <div className="flanking-preview-box">
                      <img
                        src={scenario.afterImg}
                        alt={scenario.title}
                        className="flanking-img"
                        draggable="false"
                      />
                      <div className="flanking-overlay">
                        <span className="flanking-click-hint">Click to inspect</span>
                      </div>
                    </div>

                    <div className="flanking-footer">
                      <span className="flanking-pill">{scenario.shortTab}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── STEPPER PILLS ── */}
      <div className="coverflow-stepper" aria-hidden="true">
        {SCENARIOS.map((_, idx) => (
          <button
            key={idx}
            type="button"
            aria-label={`Go to scenario ${idx + 1}`}
            className={`stepper-dot ${activeIdx === idx ? 'active' : ''}`}
            onClick={() => {
              if (cycleTimeoutRef.current) clearTimeout(cycleTimeoutRef.current);
              if (idleResumeTimerRef.current) clearTimeout(idleResumeTimerRef.current);
              if (sweepAnimRef.current && sweepAnimRef.current.pause) sweepAnimRef.current.pause();
              setActiveIdx(idx);
              setPhase('before');
            }}
          />
        ))}
      </div>
    </div>
  );
}
