import React, { useState } from 'react';
import DropZone from '../workspace/DropZone';
import StudentExamLanguageSelector from '../common/StudentExamLanguageSelector';

export default function CleanFormatPage({
  onNavigateHome,
  file,
  setFile,
  isDragging,
  setIsDragging,
  config = {},
  onChangeConfig = () => {},
  onProcess,
  isProcessing = false,
}) {
  const [showSettings, setShowSettings] = useState(false);
  
  const whiteningLevel = config.whitening_level || 'high';
  const cleanWatermarks = config.clean_watermarks !== false;
  const fixFormulas = config.fix_formulas !== false;
  const printMargins = config.print_margins !== false;
  const isQuickTest = config.page_range === '1-3';

  return (
    <div className="tool-page-container tool-theme-clean single-column-layout">
      {/* Top Breadcrumb */}
      <nav aria-label="Breadcrumb" className="tool-page-breadcrumb">
        <button
          type="button"
          onClick={onNavigateHome}
          className="breadcrumb-back-btn"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>All Tools</span>
        </button>
        <span className="breadcrumb-separator" aria-hidden="true">/</span>
        <span className="breadcrumb-current" aria-current="page">Clean &amp; Format</span>
      </nav>

      {/* Header */}
      <div className="tool-page-header">
        <h1 className="tool-page-title">Clean &amp; Format Notes</h1>
        <p className="tool-card-desc">
          Whiten dark photocopies, erase stamps, and enhance text contrast.
        </p>
      </div>

      {/* Centered Cockpit Card */}
      <div className="tool-action-card centered-cockpit">
        {/* DropZone */}
        <DropZone
          file={file}
          setFile={setFile}
          isDragging={isDragging}
          setIsDragging={setIsDragging}
          handleDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
          }}
        />

        {/* Scope Selector: 2 Clean Pills */}
        <div className="scope-segmented-control">
          <button
            type="button"
            className={`scope-segment ${isQuickTest ? 'active' : ''}`}
            onClick={() => onChangeConfig({ ...config, page_range: '1-3' })}
          >
            ⚡ Pages 1–3 (Quick Test)
          </button>
          <button
            type="button"
            className={`scope-segment ${!isQuickTest ? 'active' : ''}`}
            onClick={() => onChangeConfig({ ...config, page_range: '' })}
          >
            📚 Full Document
          </button>
        </div>

        {/* Settings Toggle Link */}
        <div className="settings-toggle-bar">
          <button
            type="button"
            className="btn-settings-toggle"
            onClick={() => setShowSettings(!showSettings)}
            aria-expanded={showSettings}
          >
            <span>⚙️ Options</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: showSettings ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>

        {/* Collapsible Settings */}
        {showSettings && (
          <div className="minimal-settings-box">
            <div className="settings-row">
              <label className="settings-label">Paper Brightness:</label>
              <div className="mini-pills-row">
                <button
                  type="button"
                  className={`mini-pill ${whiteningLevel === 'natural' ? 'active' : ''}`}
                  onClick={() => onChangeConfig({ ...config, whitening_level: 'natural' })}
                >
                  Natural
                </button>
                <button
                  type="button"
                  className={`mini-pill ${whiteningLevel === 'high' ? 'active' : ''}`}
                  onClick={() => onChangeConfig({ ...config, whitening_level: 'high' })}
                >
                  Bright White
                </button>
                <button
                  type="button"
                  className={`mini-pill ${whiteningLevel === 'ultra' ? 'active' : ''}`}
                  onClick={() => onChangeConfig({ ...config, whitening_level: 'ultra' })}
                >
                  Deep Clean
                </button>
              </div>
            </div>

            <div className="settings-checkboxes">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={cleanWatermarks}
                  onChange={(e) => onChangeConfig({ ...config, clean_watermarks: e.target.checked })}
                  className="clean-check"
                />
                <span>Erase coaching stamps &amp; ads</span>
              </label>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={fixFormulas}
                  onChange={(e) => onChangeConfig({ ...config, fix_formulas: e.target.checked })}
                  className="clean-check"
                />
                <span>Protect math formulas</span>
              </label>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={printMargins}
                  onChange={(e) => onChangeConfig({ ...config, print_margins: e.target.checked })}
                  className="clean-check"
                />
                <span>Add 12mm binding margin</span>
              </label>
            </div>

            {cleanWatermarks && (
              <input
                type="text"
                className="clean-input-inline"
                placeholder="Specific words to erase: e.g. ALLEN, Sir Name (optional)"
                value={config.spam_words || ''}
                onChange={(e) => onChangeConfig({ ...config, spam_words: e.target.value })}
              />
            )}

            <StudentExamLanguageSelector
              selectedMode={config.doc_type || 'auto'}
              onChangeMode={(mode) => onChangeConfig({ ...config, doc_type: mode })}
            />
          </div>
        )}

        {/* Tool Execution CTA Dock */}
        <div className="tool-cta-dock">
          {!file ? (
            <button
              type="button"
              className="tool-execute-btn-idle"
              onClick={() => {
                const dropEl = document.querySelector('.modern-dropzone');
                if (dropEl) dropEl.click();
              }}
            >
              <span>📄</span>
              <span>Select a PDF Above to Clean</span>
            </button>
          ) : (
            <button
              type="button"
              className="tool-execute-btn-active"
              disabled={isProcessing}
              onClick={onProcess}
            >
              <span>{isProcessing ? '⏳' : '✨'}</span>
              <span>
                {isProcessing
                  ? 'Cleaning Your Notes...'
                  : `Clean PDF Now ${isQuickTest ? '(Pages 1–3)' : ''}`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
