import React, { useState } from 'react';
import DropZone from '../workspace/DropZone';

export default function CompressPage({
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
  const compactMode = config.compact_mode || 'smart_dense';
  const diagramDpi = config.diagram_dpi || '200';

  return (
    <div className="tool-page-container tool-theme-compress single-column-layout">
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
        <span className="breadcrumb-current" aria-current="page">Compress PDF</span>
      </nav>

      {/* Header */}
      <div className="tool-page-header">
        <h1 className="tool-page-title">Compress &amp; Save Paper</h1>
        <p className="tool-card-desc">
          Remove wasted margins and pack notes onto fewer sheets for printing.
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

        {/* Compaction Mode Pills: 3 Clean Choices */}
        <div className="mini-pills-row centered-row" style={{ marginTop: '16px' }}>
          <button
            type="button"
            className={`mini-pill ${compactMode === 'smart_dense' ? 'active' : ''}`}
            onClick={() => onChangeConfig({ ...config, compact_mode: 'smart_dense' })}
          >
            ⚡ Smart Fit A4 (~48% paper saved)
          </button>
          <button
            type="button"
            className={`mini-pill ${compactMode === 'two_up' ? 'active' : ''}`}
            onClick={() => onChangeConfig({ ...config, compact_mode: 'two_up' })}
          >
            📑 2 Pages / Sheet
          </button>
          <button
            type="button"
            className={`mini-pill ${compactMode === 'max_compression' ? 'active' : ''}`}
            onClick={() => onChangeConfig({ ...config, compact_mode: 'max_compression' })}
          >
            🗜️ Ultra Small MB
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
              <label className="settings-label">Image Resolution:</label>
              <div className="mini-pills-row">
                {[
                  { id: '150', label: '150 DPI (Fast)' },
                  { id: '200', label: '200 DPI (Balanced)' },
                  { id: '300', label: '300 DPI (Print HD)' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`mini-pill ${diagramDpi === opt.id ? 'active' : ''}`}
                    onClick={() => onChangeConfig({ ...config, diagram_dpi: opt.id })}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
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
              <span>Select a PDF Above to Compress</span>
            </button>
          ) : (
            <button
              type="button"
              className="tool-execute-btn-active"
              disabled={isProcessing}
              onClick={onProcess}
            >
              <span>{isProcessing ? '⏳' : '⚡'}</span>
              <span>
                {isProcessing ? 'Compacting Pages...' : 'Compress PDF Now'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
