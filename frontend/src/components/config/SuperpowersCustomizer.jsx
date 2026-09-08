import React, { useState } from 'react';

const POPULAR_COACHINGS = [
  'Drishti IAS',
  'Allen',
  'PhysicsWallah',
  'Khan Sir',
  'Vision IAS',
  'Next IAS',
];

export default function SuperpowersCustomizer({
  config = {},
  onChangeConfig,
  serviceType = 'clean_format',
}) {
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const update = (key, val) => {
    onChangeConfig({ ...config, [key]: val });
  };

  // State extraction with safe defaults
  const cleanWatermarks = config.clean_watermarks ?? true;
  const currentLanguage = config.language_mode || 'bilingual';
  const currentDensity = config.quality || 'balanced';
  const currentPageRange = config.page_range || 'all';
  const fixFormulas = config.fix_formulas ?? true;
  const outputFormat = config.output_format || 'markdown';
  const toLanguage = config.to_language || 'Hindi';
  const _fromLanguage = config.from_language || 'English';
  const protectMath = config.protect_math ?? true;
  const stripMargins = config.strip_margins ?? true;
  const customSpam = config.custom_spam_words || '';

  const selectedCoachings = customSpam
    ? customSpam.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const handleToggleCoaching = (name) => {
    let updated;
    if (selectedCoachings.includes(name)) {
      updated = selectedCoachings.filter((n) => n !== name);
    } else {
      updated = [...selectedCoachings, name];
    }
    update('custom_spam_words', updated.join(', '));
    if (!cleanWatermarks && updated.length > 0) {
      update('clean_watermarks', true);
    }
  };

  const handleAddCustom = (e) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    handleToggleCoaching(customInput.trim());
    setCustomInput('');
    setShowCustomInput(false);
  };

  // Dynamic header based on selected feature
  const getHeaderInfo = () => {
    switch (serviceType) {
      case 'compress':
        return {
          tag: '📉 SPACE & PAPER SAVING TUNING',
          title: 'Paper Reduction & Layout Density',
          sub: 'Condense wide margins and loose coaching spacing into fewer physical A4 sheets.'
        };
      case 'extract_text':
        return {
          tag: '📋 TEXT & TABLE EXPORT TUNING',
          title: 'Document Export & Table Settings',
          sub: 'Extract clean markdown, tables, and text for copying into Notion, Word, or Sheets.'
        };
      case 'translate':
        return {
          tag: '🌐 TRANSLATION & LANGUAGE SHIELD',
          title: 'Language Direction & Formula Shield',
          sub: 'Translate prose while protecting formulas, code blocks, and diagrams from distortion.'
        };
      case 'clean_format':
      default:
        return {
          tag: '✨ CLEAN & BEAUTIFY TUNING',
          title: 'Watermark Removal & Layout Restoration',
          sub: 'Erase coaching stamps, restore LaTeX equations, and compile pristine A4 notes.'
        };
    }
  };

  const header = getHeaderInfo();

  return (
    <div className="minimal-customizer-box">
      <div className="minimal-customizer-header">
        <div className="customizer-header-left">
          <span className="sparkle-tag">{header.tag}</span>
          <h4 className="customizer-title">{header.title}</h4>
          <span className="customizer-sub">{header.sub}</span>
        </div>
      </div>

      <div className="minimal-controls-stack">

        {/* ═════════════════════════════════════════════════════════════
            FEATURE 1: CLEAN & BEAUTIFY (clean_format)
            ═════════════════════════════════════════════════════════════ */}
        {serviceType === 'clean_format' && (
          <>
            {/* Watermark Cleaner with 1-Tap Chips */}
            <div className="minimal-row">
              <div className="row-label-group">
                <span className="row-icon">🚫</span>
                <span className="row-title">Erase Coaching Watermarks & Ads</span>
                <label className="mini-toggle-switch">
                  <input
                    type="checkbox"
                    checked={cleanWatermarks}
                    onChange={(e) => update('clean_watermarks', e.target.checked)}
                  />
                  <span className="mini-slider"></span>
                </label>
              </div>

              {cleanWatermarks && (
                <div className="mini-chips-wrap">
                  <span className="chips-hint">Tap coaching to auto-erase:</span>
                  <div className="chips-row">
                    {POPULAR_COACHINGS.map((name) => {
                      const isSelected = selectedCoachings.includes(name);
                      return (
                        <button
                          key={name}
                          type="button"
                          className={`mini-chip ${isSelected ? 'active' : ''}`}
                          onClick={() => handleToggleCoaching(name)}
                        >
                          {isSelected ? '✓ ' : '+ '}{name}
                        </button>
                      );
                    })}
                    {!showCustomInput ? (
                      <button
                        type="button"
                        className="mini-chip add-chip"
                        onClick={() => setShowCustomInput(true)}
                      >
                        + Other
                      </button>
                    ) : (
                      <form onSubmit={handleAddCustom} className="mini-custom-form">
                        <input
                          type="text"
                          className="mini-input"
                          placeholder="Coaching name..."
                          value={customInput}
                          onChange={(e) => setCustomInput(e.target.value)}
                          autoFocus
                        />
                        <button type="submit" className="mini-add-btn">Add</button>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Language & Math Modes */}
            <div className="minimal-row">
              <div className="row-label-group">
                <span className="row-icon">🇮🇳</span>
                <span className="row-title">Language & Mnemonics Mode</span>
              </div>
              <div className="segmented-pill-group">
                <button
                  type="button"
                  className={`segmented-pill ${currentLanguage === 'bilingual' ? 'active' : ''}`}
                  onClick={() => update('language_mode', 'bilingual')}
                >
                  Bilingual (Hindi + English)
                </button>
                <button
                  type="button"
                  className={`segmented-pill ${currentLanguage === 'only_english' ? 'active' : ''}`}
                  onClick={() => update('language_mode', 'only_english')}
                >
                  English Only
                </button>
                <button
                  type="button"
                  className={`segmented-pill ${currentLanguage === 'only_hindi' ? 'active' : ''}`}
                  onClick={() => update('language_mode', 'only_hindi')}
                >
                  Hindi Only (शुद्ध हिंदी)
                </button>
              </div>
            </div>

            {/* Math Formula Toggle */}
            <div className="minimal-row">
              <div className="row-label-group">
                <span className="row-icon">📐</span>
                <span className="row-title">LaTeX Equation Restoration</span>
                <label className="mini-toggle-switch">
                  <input
                    type="checkbox"
                    checked={fixFormulas}
                    onChange={(e) => update('fix_formulas', e.target.checked)}
                  />
                  <span className="mini-slider"></span>
                </label>
              </div>
              <span className="mini-note">Turns distorted handwriting into crisp vector fraction bars and symbols</span>
            </div>
          </>
        )}

        {/* ═════════════════════════════════════════════════════════════
            FEATURE 2: COMPACT TO FEWER PAGES (compress)
            ═════════════════════════════════════════════════════════════ */}
        {serviceType === 'compress' && (
          <>
            {/* Density Selection */}
            <div className="minimal-row">
              <div className="row-label-group">
                <span className="row-icon">📉</span>
                <span className="row-title">Paper Reduction Target</span>
              </div>
              <div className="segmented-pill-group">
                <button
                  type="button"
                  className={`segmented-pill ${currentDensity === 'balanced' ? 'active' : ''}`}
                  onClick={() => update('quality', 'balanced')}
                >
                  <strong>Compact 2-Column</strong>
                  <span className="pill-sub">Save ~40% Xerox Paper</span>
                </button>
                <button
                  type="button"
                  className={`segmented-pill ${currentDensity === 'max' ? 'active' : ''}`}
                  onClick={() => update('quality', 'max')}
                >
                  <strong>Ultra-Dense Notes</strong>
                  <span className="pill-sub">Save ~60% (50 pgs → 18)</span>
                </button>
                <button
                  type="button"
                  className={`segmented-pill ${currentDensity === 'high' ? 'active' : ''}`}
                  onClick={() => update('quality', 'high')}
                >
                  <strong>Standard A4</strong>
                  <span className="pill-sub">Normal Spacing</span>
                </button>
              </div>
            </div>

            {/* Strip Margin Gaps */}
            <div className="minimal-row">
              <div className="row-label-group">
                <span className="row-icon">✂️</span>
                <span className="row-title">Strip 3-Inch Margin Waste & Headers</span>
                <label className="mini-toggle-switch">
                  <input
                    type="checkbox"
                    checked={stripMargins}
                    onChange={(e) => update('strip_margins', e.target.checked)}
                  />
                  <span className="mini-slider"></span>
                </label>
              </div>
              <span className="mini-note">Removes repeated coaching promo banners from top/bottom of every page</span>
            </div>

            {/* Watermark Removal in Compaction */}
            <div className="minimal-row">
              <div className="row-label-group">
                <span className="row-icon">🚫</span>
                <span className="row-title">Clean Background Watermarks</span>
                <label className="mini-toggle-switch">
                  <input
                    type="checkbox"
                    checked={cleanWatermarks}
                    onChange={(e) => update('clean_watermarks', e.target.checked)}
                  />
                  <span className="mini-slider"></span>
                </label>
              </div>
            </div>
          </>
        )}

        {/* ═════════════════════════════════════════════════════════════
            FEATURE 3: EXTRACT TEXT & TABLES (extract_text)
            ═════════════════════════════════════════════════════════════ */}
        {serviceType === 'extract_text' && (
          <>
            {/* Export Format */}
            <div className="minimal-row">
              <div className="row-label-group">
                <span className="row-icon">💾</span>
                <span className="row-title">Result Export Format</span>
              </div>
              <div className="segmented-pill-group">
                <button
                  type="button"
                  className={`segmented-pill ${outputFormat === 'markdown' || outputFormat === 'md' ? 'active' : ''}`}
                  onClick={() => update('output_format', 'markdown')}
                >
                  <strong>Markdown (.md)</strong>
                  <span className="pill-sub">For Notion, Obsidian & Word</span>
                </button>
                <button
                  type="button"
                  className={`segmented-pill ${outputFormat === 'txt' ? 'active' : ''}`}
                  onClick={() => update('output_format', 'txt')}
                >
                  <strong>Plain Text (.txt)</strong>
                  <span className="pill-sub">Clean Raw Text</span>
                </button>
                <button
                  type="button"
                  className={`segmented-pill ${outputFormat === 'json' ? 'active' : ''}`}
                  onClick={() => update('output_format', 'json')}
                >
                  <strong>Structured JSON</strong>
                  <span className="pill-sub">Questions & Tables Array</span>
                </button>
              </div>
            </div>

            {/* Table Preservation Switch */}
            <div className="minimal-row">
              <div className="row-label-group">
                <span className="row-icon">📊</span>
                <span className="row-title">Preserve Tables with Pipes (|)</span>
                <label className="mini-toggle-switch">
                  <input
                    type="checkbox"
                    checked={config.preserve_structure ?? true}
                    onChange={(e) => update('preserve_structure', e.target.checked)}
                  />
                  <span className="mini-slider"></span>
                </label>
              </div>
              <span className="mini-note">Extracts multi-column tables into copy-pasteable markdown grid</span>
            </div>
          </>
        )}

        {/* ═════════════════════════════════════════════════════════════
            FEATURE 4: TRANSLATE LANGUAGE (translate)
            ═════════════════════════════════════════════════════════════ */}
        {serviceType === 'translate' && (
          <>
            {/* Target Language */}
            <div className="minimal-row">
              <div className="row-label-group">
                <span className="row-icon">🔄</span>
                <span className="row-title">Target Translation Language</span>
              </div>
              <div className="segmented-pill-group">
                <button
                  type="button"
                  className={`segmented-pill ${toLanguage === 'English' ? 'active' : ''}`}
                  onClick={() => update('to_language', 'English')}
                >
                  <strong>Translate to English</strong>
                  <span className="pill-sub">Prose to standard English</span>
                </button>
                <button
                  type="button"
                  className={`segmented-pill ${toLanguage === 'Hindi' ? 'active' : ''}`}
                  onClick={() => update('to_language', 'Hindi')}
                >
                  <strong>Translate to Hindi (हिंदी)</strong>
                  <span className="pill-sub">Devanagari textbook prose</span>
                </button>
              </div>
            </div>

            {/* Shield Formulas from Translation */}
            <div className="minimal-row">
              <div className="row-label-group">
                <span className="row-icon">🛡️</span>
                <span className="row-title">Math & Code Block Shield</span>
                <label className="mini-toggle-switch">
                  <input
                    type="checkbox"
                    checked={protectMath}
                    onChange={(e) => update('protect_math', e.target.checked)}
                  />
                  <span className="mini-slider"></span>
                </label>
              </div>
              <span className="mini-note">Prevents formulas, variables (e.g. v=dr/dt), and code from being translated into gibberish</span>
            </div>
          </>
        )}

        {/* ═════════════════════════════════════════════════════════════
            COMMON ROW: PAGE RANGE (RELEVANT TO ALL SERVICES)
            ═════════════════════════════════════════════════════════════ */}
        <div className="minimal-row">
          <div className="row-label-group">
            <span className="row-icon">📑</span>
            <span className="row-title">Pages to Process</span>
          </div>
          <div className="mini-pages-controls">
            <button
              type="button"
              className={`mini-chip ${currentPageRange === 'all' ? 'active' : ''}`}
              onClick={() => update('page_range', 'all')}
            >
              All Pages (Default)
            </button>
            <button
              type="button"
              className={`mini-chip ${currentPageRange === 'first10' ? 'active' : ''}`}
              onClick={() => {
                update('page_range', 'custom');
                update('page_from', 1);
                update('page_to', 10);
              }}
            >
              ⚡ First 10 Pages
            </button>
            <button
              type="button"
              className={`mini-chip ${currentPageRange === 'custom' ? 'active' : ''}`}
              onClick={() => update('page_range', 'custom')}
            >
              Custom Range
            </button>
            {currentPageRange === 'custom' && (
              <div className="mini-range-inputs">
                <span>From:</span>
                <input
                  type="number"
                  min="1"
                  className="tiny-page-input"
                  value={config.page_from || 1}
                  onChange={(e) => update('page_from', Math.max(1, parseInt(e.target.value) || 1))}
                />
                <span>to:</span>
                <input
                  type="number"
                  min="1"
                  className="tiny-page-input"
                  value={config.page_to || 10}
                  onChange={(e) => update('page_to', Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
