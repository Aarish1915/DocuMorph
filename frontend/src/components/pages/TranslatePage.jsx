import React, { useState } from 'react';
import DropZone from '../workspace/DropZone';

const ALL_LANGUAGES = [
  { id: 'Hindi', label: 'Hindi', script: 'हिन्दी' },
  { id: 'Marathi', label: 'Marathi', script: 'मराठी' },
  { id: 'Gujarati', label: 'Gujarati', script: 'ગુજરાતી' },
  { id: 'Tamil', label: 'Tamil', script: 'தமிழ்' },
  { id: 'Telugu', label: 'Telugu', script: 'తెలుగు' },
  { id: 'Bengali', label: 'Bengali', script: 'বাংলা' },
  { id: 'Kannada', label: 'Kannada', script: 'ಕನ್ನಡ' },
  { id: 'Malayalam', label: 'Malayalam', script: 'മലയാളം' },
  { id: 'Punjabi', label: 'Punjabi', script: 'ਪੰਜਾਬੀ' },
  { id: 'Urdu', label: 'Urdu', script: 'اردو' },
  { id: 'English', label: 'English', script: 'English' },
  { id: 'Spanish', label: 'Spanish', script: 'Español' },
  { id: 'French', label: 'French', script: 'Français' },
  { id: 'German', label: 'German', script: 'Deutsch' },
];

export default function TranslatePage({
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
  const selectedTarget = config.to_language || 'Hindi';
  const protectMath = config.protect_math !== false;
  const translateDiagramLabels = config.translate_diagram_labels !== false;
  const outputFormat = config.output_format || 'pdf';

  const handleSelectLanguage = (langId) => {
    onChangeConfig({
      ...config,
      to_language: langId,
      language_mode: langId,
    });
  };

  return (
    <div className="tool-page-container tool-theme-translate single-column-layout">
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
        <span className="breadcrumb-current" aria-current="page">Translate PDF</span>
      </nav>

      {/* Header */}
      <div className="tool-page-header">
        <h1 className="tool-page-title">Translate PDF Notes</h1>
        <p className="tool-card-desc">
          Translate study notes into 14 languages with formulas untouched.
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

        {/* Clean Language Target Selector: 1 Row */}
        <div className="clean-context-row" style={{ marginTop: '16px' }}>
          <label htmlFor="target-language-select" className="clean-context-label">Translate Into:</label>
          <select
            id="target-language-select"
            className="clean-context-select"
            value={selectedTarget}
            onChange={(e) => handleSelectLanguage(e.target.value)}
          >
            {ALL_LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.script} ({l.label})
              </option>
            ))}
          </select>
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
            <div className="settings-checkboxes">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={protectMath}
                  onChange={(e) => onChangeConfig({ ...config, protect_math: e.target.checked })}
                  className="clean-check"
                />
                <span>Protect math &amp; physics formulas</span>
              </label>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={translateDiagramLabels}
                  onChange={(e) => onChangeConfig({ ...config, translate_diagram_labels: e.target.checked })}
                  className="clean-check"
                />
                <span>Translate scientific diagram words</span>
              </label>
            </div>

            <div className="settings-row" style={{ marginTop: '12px' }}>
              <label className="settings-label">Output Format:</label>
              <div className="mini-pills-row">
                <button
                  type="button"
                  className={`mini-pill ${outputFormat === 'pdf' ? 'active' : ''}`}
                  onClick={() => onChangeConfig({ ...config, output_format: 'pdf' })}
                >
                  📄 PDF File
                </button>
                <button
                  type="button"
                  className={`mini-pill ${outputFormat === 'md' ? 'active' : ''}`}
                  onClick={() => onChangeConfig({ ...config, output_format: 'md' })}
                >
                  📝 Markdown (.md)
                </button>
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
              <span>Select a PDF Above to Translate</span>
            </button>
          ) : (
            <button
              type="button"
              className="tool-execute-btn-active"
              disabled={isProcessing}
              onClick={onProcess}
            >
              <span>{isProcessing ? '⏳' : '🌐'}</span>
              <span>
                {isProcessing
                  ? `Translating into ${selectedTarget}...`
                  : `Translate PDF into ${selectedTarget} Now`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
