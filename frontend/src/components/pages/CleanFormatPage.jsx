import React from 'react';
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
  const whiteningLevel = config.whitening_level || 'high';
  const cleanWatermarks = config.clean_watermarks !== false;
  const fixFormulas = config.fix_formulas !== false;
  const printMargins = config.print_margins !== false;

  return (
    <div className="tool-page-container tool-theme-clean">
      {/* Top back breadcrumb */}
      <nav aria-label="Breadcrumb" className="tool-page-breadcrumb">
        <a
          href="#tools"
          onClick={(e) => {
            e.preventDefault();
            onNavigateHome();
          }}
          className="breadcrumb-back-btn"
          style={{ textDecoration: 'none' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>All Tools</span>
        </a>
        <span className="breadcrumb-separator" aria-hidden="true">/</span>
        <span className="breadcrumb-current" aria-current="page">Clean &amp; Format</span>
      </nav>

      {/* Header with Distinct Badge */}
      <div className="tool-page-header">
        <div className="tool-hero-badge">
          <span className="tool-badge-dot"></span>
          <span>Photocopy Whitening &amp; Telegram Ad Eraser</span>
        </div>
        <h1 className="tool-page-title">Clean &amp; Format PDF Notes</h1>
        <p className="tool-card-desc" style={{ maxWidth: '600px', margin: '0 auto 20px auto' }}>
          Turn dark, shadowed photocopies and mobile phone scans into crisp, print-ready white paper with pure vector LaTeX equations.
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

          {/* Specialized Whitening Cards */}
          <div style={{ marginTop: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
              1. Paper Background Whitening
            </label>
            <div className="choice-cards-grid">
              <div
                className={`choice-card-item ${whiteningLevel === 'natural' ? 'selected' : ''}`}
                onClick={() => onChangeConfig({ ...config, whitening_level: 'natural' })}
              >
                <div className="choice-card-header">
                  <span className="choice-card-title">Natural White</span>
                  <span>📄</span>
                </div>
                <span className="choice-card-desc">Subtle shadow removal. Preserves delicate pencil strokes.</span>
              </div>

              <div
                className={`choice-card-item ${whiteningLevel === 'high' ? 'selected' : ''}`}
                onClick={() => onChangeConfig({ ...config, whitening_level: 'high' })}
              >
                <div className="choice-card-header">
                  <span className="choice-card-title">High Contrast</span>
                  <span>✨</span>
                </div>
                <span className="choice-card-desc">Deep black ink on #FFFFFF paper. Ideal for study printing.</span>
              </div>

              <div
                className={`choice-card-item ${whiteningLevel === 'ultra' ? 'selected' : ''}`}
                onClick={() => onChangeConfig({ ...config, whitening_level: 'ultra' })}
              >
                <div className="choice-card-header">
                  <span className="choice-card-title">Ultra Clean</span>
                  <span>⚡</span>
                </div>
                <span className="choice-card-desc">Aggressive background bleaching for heavy dark photocopies.</span>
              </div>
            </div>
          </div>

          {/* Specialized Cleaning Toggles */}
          <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-default)', paddingTop: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '10px', display: 'block' }}>
              2. Document Protection Refinements
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer', padding: '8px', borderRadius: '8px', background: 'var(--bg-secondary)' }}>
                <input
                  type="checkbox"
                  checked={cleanWatermarks}
                  onChange={(e) => onChangeConfig({ ...config, clean_watermarks: e.target.checked })}
                  style={{ accentColor: 'var(--tool-primary)' }}
                />
                <span><strong>Erase Telegram / Fee Ads</strong></span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer', padding: '8px', borderRadius: '8px', background: 'var(--bg-secondary)' }}>
                <input
                  type="checkbox"
                  checked={fixFormulas}
                  onChange={(e) => onChangeConfig({ ...config, fix_formulas: e.target.checked })}
                  style={{ accentColor: 'var(--tool-primary)' }}
                />
                <span><strong>Typeset LaTeX Formulas</strong></span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer', padding: '8px', borderRadius: '8px', background: 'var(--bg-secondary)' }}>
                <input
                  type="checkbox"
                  checked={printMargins}
                  onChange={(e) => onChangeConfig({ ...config, print_margins: e.target.checked })}
                  style={{ accentColor: 'var(--tool-primary)' }}
                />
                <span><strong>15mm Binder Margins</strong></span>
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

          {/* Primary Action Button */}
          {file && (
            <div style={{ marginTop: '24px' }}>
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
                <span>{isProcessing ? 'Processing Clean & Format...' : 'Clean & Beautify Document'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Tailored Proof Viewer */}
        <section className="home-showcase-section" style={{ margin: '16px 0 0 0', maxWidth: '100%' }}>
          <div className="home-showcase-header">
            <h2 className="home-showcase-title" style={{ fontSize: '20px' }}>Whitening &amp; Despeckle Preview</h2>
            <p className="home-showcase-subtitle">Slide to verify true photocopy gray shadow removal and telegram watermark erasure.</p>
          </div>
          <InteractiveProofViewer
            title="Clean & Format Test"
            beforeImg="/samples/doc_1_before.jpg"
            afterImg="/samples/doc_1_after.jpg"
            beforeLabel="Dark Photocopy Scan"
            afterLabel="Cleaned White Paper"
          />
        </section>
      </div>
    </div>
  );
}
