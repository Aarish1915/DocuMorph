import React, { useState } from 'react';

export default function QuickSettingsToggles({
  config,
  onChangeConfig,
}) {
  const [showAdvancedInputs, setShowAdvancedInputs] = useState(false);

  const handleLanguageChange = (mode) => {
    onChangeConfig({
      ...config,
      language_mode: mode
    });
  };

  const handleToggleAds = () => {
    onChangeConfig({
      ...config,
      clean_watermarks: !config.clean_watermarks
    });
  };

  const handlePageRangeChange = (mode) => {
    onChangeConfig({
      ...config,
      page_range: mode
    });
  };

  return (
    <div className="quick-settings-container">
      <div className="quick-settings-header">
        <label className="section-step-label">Step 2: Quick Refinements (Optional)</label>
        <span className="section-step-sub">Pre-configured by your preset. Tweak only if you have a special requirement.</span>
      </div>

      <div className="quick-controls-grid">

        {/* 1. LANGUAGE MODE CHIPS */}
        <div className="quick-control-card">
          <span className="control-label">🌐 Language &amp; Math Equations:</span>
          <div className="chips-row" style={{ flexWrap: 'wrap', gap: '6px' }}>
            {[
              { id: 'auto', label: '🌐 Dual (Hindi + Eng) + Maths' },
              { id: 'en+math', label: '🇬🇧+📐 English + Maths (JEE/NEET)' },
              { id: 'math+hindi', label: '🇮🇳+📐 Hindi + Maths' },
              { id: 'only_english', label: '🇬🇧 Only English (Law/Text)' },
              { id: 'only_hindi', label: '🇮🇳 Only Hindi' },
              { id: 'only_math', label: '📐 Only Maths' }
            ].map((lang) => {
              const active = (config.language_mode || 'auto') === lang.id;
              return (
                <button
                  key={lang.id}
                  type="button"
                  className={`refinement-chip ${active ? 'active' : ''}`}
                  onClick={() => handleLanguageChange(lang.id)}
                >
                  {lang.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. AD REMOVAL TOGGLE */}
        <div className="quick-control-card">
          <div className="control-header-toggle">
            <span className="control-label">🛡️ Coaching Ads & Watermarks:</span>
            <button
              type="button"
              className={`toggle-switch-btn ${config.clean_watermarks !== false ? 'on' : 'off'}`}
              onClick={handleToggleAds}
            >
              {config.clean_watermarks !== false ? 'Strip Ads (Active ✓)' : 'Keep Ads (Off)'}
            </button>
          </div>
          <span className="control-micro-hint">
            Auto-detects phone numbers, helpline banners, and Telegram channel stamps.
          </span>
        </div>

        {/* 3. PAGE RANGE SELECTION */}
        <div className="quick-control-card">
          <span className="control-label">📄 Pages to Process:</span>
          <div className="chips-row">
            <button
              type="button"
              className={`refinement-chip ${config.page_range !== 'custom' ? 'active' : ''}`}
              onClick={() => handlePageRangeChange('all')}
            >
              All Pages
            </button>
            <button
              type="button"
              className={`refinement-chip ${config.page_range === 'custom' ? 'active' : ''}`}
              onClick={() => handlePageRangeChange('custom')}
            >
              Select Pages Range
            </button>
          </div>

          {config.page_range === 'custom' && (
            <div className="quick-range-inputs">
              <div className="range-num-box">
                <span>From Page:</span>
                <input
                  type="number"
                  min={1}
                  value={config.page_from || 1}
                  onChange={(e) => onChangeConfig({ ...config, page_from: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="quick-num-input"
                />
              </div>
              <div className="range-num-box">
                <span>To Page:</span>
                <input
                  type="number"
                  min={1}
                  value={config.page_to || 10}
                  onChange={(e) => onChangeConfig({ ...config, page_to: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="quick-num-input"
                />
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Optional custom coaching institute names expander */}
      <div className="institute-phrase-expander">
        <button
          type="button"
          className="btn-text-link"
          onClick={() => setShowAdvancedInputs(!showAdvancedInputs)}
        >
          {showAdvancedInputs ? '▾ Hide specific coaching name filter' : '▸ Filter specific coaching academy name (Optional)'}
        </button>

        {showAdvancedInputs && (
          <div className="custom-phrase-box">
            <label>Specific Coaching Name or Text to Wipe:</label>
            <input
              type="text"
              placeholder="e.g. Drishti IAS, Allen Kota, PhysicsWallah, Khan Global Studies..."
              value={config.custom_spam_words || ''}
              onChange={(e) => onChangeConfig({ ...config, custom_spam_words: e.target.value })}
              className="quick-text-input"
            />
            <span className="phrase-hint">
              Any matching lines or banners containing these institute names will be strictly erased.
            </span>
          </div>
        )}
      </div>

    </div>
  );
}
