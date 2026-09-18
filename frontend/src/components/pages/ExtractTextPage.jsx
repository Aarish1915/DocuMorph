import React, { useState } from 'react';
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

  return (
    <div className="tool-page-container tool-theme-extract">
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
        <span className="breadcrumb-current" aria-current="page">Extract Text</span>
      </nav>

      {/* Header with Distinct Badge */}
      <div className="tool-page-header">
        <div className="tool-hero-badge">
          <span className="tool-badge-dot"></span>
          <span>100% Data Fidelity • Markdown, Tables &amp; Formulas</span>
        </div>
        <h1 className="tool-page-title">Extract Text &amp; Tables</h1>
        <p className="tool-card-desc" style={{ maxWidth: '600px', margin: '0 auto 20px auto' }}>
          Extract text, structured comparison tables, and LaTeX formulas directly from complex PDFs into Markdown (Notion/Obsidian) or developer JSON.
        </p>
      </div>

      <div className="tool-work-grid">
        <div className="tool-action-card">
          {/* Format Selector Pills */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px', display: 'block' }}>
              1. Choose Export Format
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
                <span className="choice-card-desc">.md for Notion, Obsidian, GitHub, with LaTeX equations.</span>
              </div>

              <div
                className={`choice-card-item ${activeFormat === 'json' ? 'selected' : ''}`}
                onClick={() => onChangeConfig({ ...config, output_format: 'json' })}
              >
                <div className="choice-card-header">
                  <span className="choice-card-title">Developer JSON</span>
                  <span>⚙️</span>
                </div>
                <span className="choice-card-desc">.json array with page numbers, structured tables, and telemetry.</span>
              </div>

              <div
                className={`choice-card-item ${activeFormat === 'txt' ? 'selected' : ''}`}
                onClick={() => onChangeConfig({ ...config, output_format: 'txt' })}
              >
                <div className="choice-card-header">
                  <span className="choice-card-title">Plain Text</span>
                  <span>📄</span>
                </div>
                <span className="choice-card-desc">.txt raw UTF-8 content without markdown formatting tags.</span>
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

          {/* Specialized Table & Math Fidelity Controls */}
          <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-default)', paddingTop: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px', display: 'block' }}>
              2. Table &amp; Formula Extraction Rules
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
              <div
                className={`choice-card-item ${tableMode === 'html' ? 'selected' : ''}`}
                onClick={() => onChangeConfig({ ...config, table_mode: 'html' })}
                style={{ padding: '10px' }}
              >
                <div className="choice-card-title" style={{ fontSize: '12.5px' }}>HTML &lt;table&gt; Fidelity</div>
                <span className="choice-card-desc">Preserves multi-row header cells and complex table borders.</span>
              </div>

              <div
                className={`choice-card-item ${tableMode === 'pipes' ? 'selected' : ''}`}
                onClick={() => onChangeConfig({ ...config, table_mode: 'pipes' })}
                style={{ padding: '10px' }}
              >
                <div className="choice-card-title" style={{ fontSize: '12.5px' }}>Markdown | Pipes |</div>
                <span className="choice-card-desc">Lightweight standard pipes for quick editing in text editors.</span>
              </div>

              <div
                className={`choice-card-item ${mathDelim === 'latex' ? 'selected' : ''}`}
                onClick={() => onChangeConfig({ ...config, math_delim: 'latex' })}
                style={{ padding: '10px' }}
              >
                <div className="choice-card-title" style={{ fontSize: '12.5px' }}>LaTeX Equations ($...$)</div>
                <span className="choice-card-desc">Compatible with MathJax, KaTeX, and scientific papers.</span>
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
                <span>📋</span>
                <span>{isProcessing ? 'Extracting Data & Tables...' : `Extract to ${activeFormat.toUpperCase()}`}</span>
              </button>
            </div>
          )}
        </div>

        {/* Live Structured Output Sample Showcase */}
        <section className="home-showcase-section" style={{ margin: '16px 0 0 0', maxWidth: '100%' }}>
          <div className="home-showcase-header">
            <h2 className="home-showcase-title" style={{ fontSize: '20px' }}>Structured Output Quality Sample</h2>
            <p className="home-showcase-subtitle">See how complex math equations and table grids are cleanly extracted into Notion-ready Markdown.</p>
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
