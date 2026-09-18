import React, { useState, useRef } from 'react';
import DropZone from '../workspace/DropZone';
import StudentExamLanguageSelector from '../common/StudentExamLanguageSelector';

const SAMPLE_EXTRACTED = `# Newton's Laws of Motion & Momentum

## 1. Conservation of Linear Momentum
When no external force acts on a system, the total linear momentum remains strictly constant:

$$P_{\\text{total}} = m_1 v_1 + m_2 v_2 = \\text{Constant}$$

| Parameter | Symbol | SI Unit | Dimension |
| :--- | :--- | :--- | :--- |
| Momentum | $p$ | $\\text{kg}\\cdot\\text{m/s}$ | $[MLT^{-1}]$ |
| Force | $F$ | $\\text{Newton (N)}$ | $[MLT^{-2}]$ |
| Impulse | $J$ | $\\text{N}\\cdot\\text{s}$ | $[MLT^{-1}]$ |

* Impulse is defined as the integral of force over time: $J = \\int F \\, dt$
* Collisions in an isolated system always conserve momentum.`;

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
  const hiddenFileInputRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const activeFormat = config.output_format || 'markdown';
  const tableMode = config.table_mode || 'html';
  const mathDelim = config.math_delim || 'latex';

  const handleCopySample = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(SAMPLE_EXTRACTED);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleChooseFileClick = () => {
    if (hiddenFileInputRef.current) {
      hiddenFileInputRef.current.click();
    }
  };

  return (
    <div className="tool-page-container tool-theme-extract">
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
        <span className="breadcrumb-current" aria-current="page">Extract Text</span>
      </nav>

      {/* Header with Simple English */}
      <div className="tool-page-header">
        <div className="tool-hero-badge">
          <span className="tool-badge-dot"></span>
          <span>Copy Words &amp; Tables • Math Formulas Protected</span>
        </div>
        <h1 className="tool-page-title">Extract Text &amp; Tables</h1>
        <p className="tool-card-desc" style={{ maxWidth: '600px', margin: '0 auto 20px auto' }}>
          Copy words, questions, and tables directly from your PDF into Word, Notion, or simple notes. Math equations stay fully intact.
        </p>
      </div>

      <div className="tool-work-grid">
        <div className="tool-action-card">
          {/* Format Selector Pills */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px', display: 'block' }}>
              1. Choose File Format
            </label>
            <div className="choice-cards-grid">
              <div
                className={`choice-card-item ${activeFormat === 'markdown' ? 'selected' : ''}`}
                onClick={() => onChangeConfig({ ...config, output_format: 'markdown' })}
              >
                <div className="choice-card-header">
                  <span className="choice-card-title">Markdown</span>
                  <span>📝</span>
                </div>
                <span className="choice-card-desc">.md file. Best for Notion, Obsidian, and Word with math formulas.</span>
              </div>

              <div
                className={`choice-card-item ${activeFormat === 'txt' ? 'selected' : ''}`}
                onClick={() => onChangeConfig({ ...config, output_format: 'txt' })}
              >
                <div className="choice-card-header">
                  <span className="choice-card-title">Plain Text</span>
                  <span>📄</span>
                </div>
                <span className="choice-card-desc">.txt file. Simple text you can paste into WhatsApp or Notepad.</span>
              </div>

              <div
                className={`choice-card-item ${activeFormat === 'json' ? 'selected' : ''}`}
                onClick={() => onChangeConfig({ ...config, output_format: 'json' })}
              >
                <div className="choice-card-header">
                  <span className="choice-card-title">Data JSON</span>
                  <span>⚙️</span>
                </div>
                <span className="choice-card-desc">.json file. For coders who need page numbers and structured data.</span>
              </div>
            </div>
          </div>

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

          {/* Simple Table & Math Settings */}
          <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-default)', paddingTop: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px', display: 'block' }}>
              2. How to Format Tables &amp; Math
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
              <div
                className={`choice-card-item ${tableMode === 'html' ? 'selected' : ''}`}
                onClick={() => onChangeConfig({ ...config, table_mode: 'html' })}
                style={{ padding: '10px' }}
              >
                <div className="choice-card-title" style={{ fontSize: '12.5px' }}>Clean Grid Tables</div>
                <span className="choice-card-desc">Keeps lines, boxes, and table columns lined up neatly.</span>
              </div>

              <div
                className={`choice-card-item ${tableMode === 'pipes' ? 'selected' : ''}`}
                onClick={() => onChangeConfig({ ...config, table_mode: 'pipes' })}
                style={{ padding: '10px' }}
              >
                <div className="choice-card-title" style={{ fontSize: '12.5px' }}>Simple Text Tables</div>
                <span className="choice-card-desc">Uses simple | bars | for easy copying into plain text.</span>
              </div>

              <div
                className={`choice-card-item ${mathDelim === 'latex' ? 'selected' : ''}`}
                onClick={() => onChangeConfig({ ...config, math_delim: 'latex' })}
                style={{ padding: '10px' }}
              >
                <div className="choice-card-title" style={{ fontSize: '12.5px' }}>Math Equations ($...$)</div>
                <span className="choice-card-desc">Keeps fractions, square roots, and math symbols safe.</span>
              </div>
            </div>
          </div>

          {/* Exam / Language selector */}
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
                <span>Select PDF File to Extract Text</span>
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
                <span>📋</span>
                <span>{isProcessing ? 'Extracting Text & Tables...' : `Extract Text (${activeFormat.toUpperCase()}) Now`}</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Structured Output Sample Showcase */}
        <section className="home-showcase-section" style={{ margin: '16px 0 0 0', maxWidth: '100%' }}>
          <div className="home-showcase-header">
            <h2 className="home-showcase-title" style={{ fontSize: '18px' }}>Example Output</h2>
            <p className="home-showcase-subtitle">See how questions, equations, and tables are cleanly copied.</p>
          </div>

          <div className="extract-preview-box">
            <button type="button" className="copy-badge-btn" onClick={handleCopySample}>
              {copied ? '✓ Copied' : '📋 Copy Sample'}
            </button>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {SAMPLE_EXTRACTED}
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
}
