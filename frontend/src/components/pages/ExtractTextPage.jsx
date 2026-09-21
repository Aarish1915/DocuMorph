import React, { useState } from 'react';
import DropZone from '../workspace/DropZone';
import StudentExamLanguageSelector from '../common/StudentExamLanguageSelector';

export default function ExtractTextPage({
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
  const activeFormat = config.output_format || 'markdown';
  const tableMode = config.table_mode || 'html';
  const mathDelim = config.math_delim || 'latex';

  return (
    <div className="tool-page-container tool-theme-extract single-column-layout">
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
        <span className="breadcrumb-current" aria-current="page">Extract Text</span>
      </nav>

      {/* Header */}
      <div className="tool-page-header">
        <h1 className="tool-page-title">Extract Text &amp; Tables</h1>
        <p className="tool-card-desc">
          Copy text, tables, and questions with intact math formulas.
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

        {/* Format Selector: 3 Clean Pills */}
        <div className="mini-pills-row centered-row" style={{ marginTop: '16px' }}>
          <button
            type="button"
            className={`mini-pill ${activeFormat === 'markdown' ? 'active' : ''}`}
            onClick={() => onChangeConfig({ ...config, output_format: 'markdown' })}
          >
            📝 Markdown (.md)
          </button>
          <button
            type="button"
            className={`mini-pill ${activeFormat === 'txt' ? 'active' : ''}`}
            onClick={() => onChangeConfig({ ...config, output_format: 'txt' })}
          >
            📄 Plain Text (.txt)
          </button>
          <button
            type="button"
            className={`mini-pill ${activeFormat === 'json' ? 'active' : ''}`}
            onClick={() => onChangeConfig({ ...config, output_format: 'json' })}
          >
            ⚙️ JSON Data (.json)
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
              <label className="settings-label">Table Formatting:</label>
              <div className="mini-pills-row">
                <button
                  type="button"
                  className={`mini-pill ${tableMode === 'html' ? 'active' : ''}`}
                  onClick={() => onChangeConfig({ ...config, table_mode: 'html' })}
                >
                  Clean HTML Grid
                </button>
                <button
                  type="button"
                  className={`mini-pill ${tableMode === 'pipes' ? 'active' : ''}`}
                  onClick={() => onChangeConfig({ ...config, table_mode: 'pipes' })}
                >
                  Simple Text Pipes
                </button>
                <button
                  type="button"
                  className={`mini-pill ${mathDelim === 'latex' ? 'active' : ''}`}
                  onClick={() => onChangeConfig({ ...config, math_delim: 'latex' })}
                >
                  LaTeX ($...$)
                </button>
              </div>
            </div>

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
              <span>Select a PDF Above to Extract</span>
            </button>
          ) : (
            <button
              type="button"
              className="tool-execute-btn-active"
              disabled={isProcessing}
              onClick={onProcess}
            >
              <span>{isProcessing ? '⏳' : '📋'}</span>
              <span>
                {isProcessing
                  ? 'Extracting Text & Tables...'
                  : `Extract Text (${activeFormat.toUpperCase()}) Now`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
