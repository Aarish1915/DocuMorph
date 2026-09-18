import React, { useRef } from 'react';
import DropZone from '../workspace/DropZone';
import InteractiveProofViewer from '../common/InteractiveProofViewer';
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
  const hiddenFileInputRef = useRef(null);
  const whiteningLevel = config.whitening_level || 'high';
  const cleanWatermarks = config.clean_watermarks !== false;
  const fixFormulas = config.fix_formulas !== false;
  const printMargins = config.print_margins !== false;

  const handleChooseFileClick = () => {
    if (hiddenFileInputRef.current) {
      hiddenFileInputRef.current.click();
    }
  };

  return (
    <div className="tool-page-container tool-theme-clean">
      {/* Hidden file input for one-click CTA upload */}
      <input
        ref={hiddenFileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
          }
        }}
      />

      {/* Top back breadcrumb */}
      <nav aria-label="Breadcrumb" className="tool-page-breadcrumb">
        <button
          type="button"
          onClick={onNavigateHome}
          className="breadcrumb-back-btn"
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>All Tools</span>
        </button>
        <span className="breadcrumb-separator" aria-hidden="true">/</span>
        <span className="breadcrumb-current" aria-current="page">Clean &amp; Format</span>
      </nav>

      {/* Header with Simple English */}
      <div className="tool-page-header">
        <div className="tool-hero-badge">
          <span className="tool-badge-dot"></span>
          <span>White Paper Background • Ad &amp; Stamp Removal</span>
        </div>
        <h1 className="tool-page-title">Clean &amp; Format PDF Notes</h1>
        <p className="tool-card-desc" style={{ maxWidth: '600px', margin: '0 auto 20px auto' }}>
          Make dark phone scans and grey photocopies bright white. Removes messy stamps and ads while keeping math formulas sharp and clear.
        </p>
      </div>

      {/* 2-Column Focused Working Area */}
      <div className="tool-work-grid">
        <div className="tool-action-card">
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

          {/* Simple Whitening Cards */}
          <div style={{ marginTop: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
              1. Choose Paper Brightness
            </label>
            <div className="choice-cards-grid">
              <div
                className={`choice-card-item ${whiteningLevel === 'natural' ? 'selected' : ''}`}
                onClick={() => onChangeConfig({ ...config, whitening_level: 'natural' })}
              >
                <div className="choice-card-header">
                  <span className="choice-card-title">Light Clean</span>
                  <span>📄</span>
                </div>
                <span className="choice-card-desc">Gently removes light shadows. Keeps light pencil marks.</span>
              </div>

              <div
                className={`choice-card-item ${whiteningLevel === 'high' ? 'selected' : ''}`}
                onClick={() => onChangeConfig({ ...config, whitening_level: 'high' })}
              >
                <div className="choice-card-header">
                  <span className="choice-card-title">Bright White</span>
                  <span>✨</span>
                </div>
                <span className="choice-card-desc">Deep black text on clean white paper. Best for reading and printing.</span>
              </div>

              <div
                className={`choice-card-item ${whiteningLevel === 'ultra' ? 'selected' : ''}`}
                onClick={() => onChangeConfig({ ...config, whitening_level: 'ultra' })}
              >
                <div className="choice-card-header">
                  <span className="choice-card-title">Extra Deep Clean</span>
                  <span>⚡</span>
                </div>
                <span className="choice-card-desc">For very dark, dirty, or low-quality photocopies.</span>
              </div>
            </div>
          </div>

          {/* Simple Checkboxes */}
          <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-default)', paddingTop: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px', display: 'block' }}>
              2. Clean-Up Options
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={cleanWatermarks}
                  onChange={(e) => onChangeConfig({ ...config, clean_watermarks: e.target.checked })}
                  style={{ accentColor: 'var(--tool-primary)' }}
                />
                <span><strong>Erase Coaching Ads &amp; Stamps</strong></span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={fixFormulas}
                  onChange={(e) => onChangeConfig({ ...config, fix_formulas: e.target.checked })}
                  style={{ accentColor: 'var(--tool-primary)' }}
                />
                <span><strong>Fix Math &amp; Science Equations</strong></span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={printMargins}
                  onChange={(e) => onChangeConfig({ ...config, print_margins: e.target.checked })}
                  style={{ accentColor: 'var(--tool-primary)' }}
                />
                <span><strong>Add Margins for Binding/Folder</strong></span>
              </label>
            </div>
          </div>

          {/* Language / Exam Mode Selector */}
          <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-default)', paddingTop: '16px' }}>
            <StudentExamLanguageSelector
              selectedMode={config.doc_type || 'auto'}
              onChangeMode={(mode) => onChangeConfig({ ...config, doc_type: mode })}
            />
          </div>

          {/* Always Visible Action Button */}
          <div style={{ marginTop: '24px' }}>
            {!file ? (
              <button
                type="button"
                onClick={handleChooseFileClick}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  background: 'var(--tool-primary)',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 750,
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px var(--tool-glow)'
                }}
              >
                <span>📂</span>
                <span>Select PDF File to Clean</span>
              </button>
            ) : (
              <button
                type="button"
                className="tool-execute-btn"
                disabled={isProcessing}
                onClick={onProcess}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  background: 'var(--tool-primary)',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 750,
                  borderRadius: '12px',
                  border: 'none',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px var(--tool-glow)'
                }}
              >
                <span>✨</span>
                <span>{isProcessing ? 'Cleaning Your Notes...' : 'Clean PDF Notes Now'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Interactive Before/After Proof Showcase */}
        <section className="home-showcase-section" style={{ margin: 0, maxWidth: '100%' }}>
          <div className="home-showcase-header">
            <h2 className="home-showcase-title" style={{ fontSize: '20px' }}>Real Result Preview</h2>
            <p className="home-showcase-subtitle">Drag the slider to see how messy phone scans become clean, bright notes.</p>
          </div>
          <InteractiveProofViewer
            title="Clean &amp; Format"
            beforeImg="/samples/doc_1_before.jpg"
            afterImg="/samples/doc_1_after.jpg"
            beforeLabel="Dirty / Shadowed Scan"
            afterLabel="Clean White Paper"
          />
        </section>
      </div>
    </div>
  );
}
