import React, { useState } from 'react';
import DropZone from './DropZone';
import SuperpowersCustomizer from '../config/SuperpowersCustomizer';

export default function HomeWorkspace({
  serviceType,
  config,
  onChangeConfig,
  file,
  setFile,
  isDragging,
  setIsDragging,
  handleDrop,
  isProcessing,
  handleProcess,
}) {
  const [showCustomDrawer, setShowCustomDrawer] = useState(false);

  const getPrimaryBtnLabel = () => {
    switch (serviceType) {
      case 'extract_text': return 'Extract Text & Tables (Auto)';
      case 'translate': return 'Translate Document (Auto)';
      case 'compress': return 'Compact to Fewer Pages (Auto)';
      case 'clean_format':
      default: return 'Clean & Beautify Notes (Auto)';
    }
  };

  const getActivePills = () => {
    const pills = [];
    if (config.clean_watermarks ?? true) {
      pills.push('🚫 Ad Eraser ON');
    }
    const lang = config.language_mode || 'bilingual';
    if (lang === 'bilingual') pills.push('🇮🇳 Bilingual Guard');
    else if (lang === 'only_hindi') pills.push('हिंदी Only');
    else if (lang === 'only_english') pills.push('English Only');

    const density = config.quality || 'balanced';
    if (density === 'max') pills.push('📉 60% Paper Saver');
    else if (density === 'balanced') pills.push('📑 40% Compact');

    return pills;
  };

  return (
    <div className="home-workspace-card">
      <div className="home-dropzone-header">
        <h3 className="home-dropzone-title">Universal Document Dropzone</h3>
        <p className="home-dropzone-subtitle">
          Drop any messy PDF here to auto-clean ads and restore formulas, or click a dedicated tool above.
        </p>
      </div>

      {/* PROMINENT DROPZONE (Fitts's Law - Immediate Action) */}
      <DropZone
        file={file}
        setFile={setFile}
        isDragging={isDragging}
        setIsDragging={setIsDragging}
        handleDrop={handleDrop}
      />

      {/* PRIMARY ACTION & CUSTOMIZE TOGGLE */}
      <div className="action-and-options-bar">
        <div className="primary-action-container">
          <button
            type="button"
            className="btn-primary-process"
            disabled={!file || isProcessing}
            onClick={handleProcess}
          >
            <span className="btn-process-text">{getPrimaryBtnLabel()}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
          {!file && (
            <span className="process-hint">Drop a PDF above to start transforming immediately</span>
          )}
        </div>

        {/* Superpowers Options Trigger */}
        <div className="customize-toggle-row">
          <button
            type="button"
            className={`btn-toggle-customize ${showCustomDrawer ? 'active-drawer-btn' : ''}`}
            onClick={() => setShowCustomDrawer(!showCustomDrawer)}
          >
            <span className="sparkle-gold">✨</span>
            <span className="customize-btn-title">Advanced Options</span>
            <div className="active-pills-row">
              {getActivePills().map((pill) => (
                <span key={pill} className="superpower-active-chip">{pill}</span>
              ))}
            </div>
            <svg
              className={`chevron-icon ${showCustomDrawer ? 'open' : ''}`}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </div>

      {/* SUPERPOWERS PANEL */}
      {showCustomDrawer && (
        <div className="custom-options-drawer">
          <SuperpowersCustomizer
            config={config}
            onChangeConfig={onChangeConfig}
            serviceType={serviceType}
          />
        </div>
      )}
    </div>
  );
}
