import React, { useState } from 'react';
import DropZone from '../workspace/DropZone';
import InteractiveProofViewer from '../common/InteractiveProofViewer';

export default function ExtractTextPage({
  onNavigateHome,
  onFileSelect,
  isDragging,
  setIsDragging,
  config = {},
  onChangeConfig = () => {},
}) {
  const [copied, setCopied] = useState(false);
  const activeFormat = config.output_format || 'markdown';

  const handleCopySample = () => {
    const tableText = `| Article | Right Guaranteed | Scope |
| :--- | :--- | :--- |
| Art. 14 | Equality Before Law | Citizens & Foreigners |
| Art. 19 | Six Basic Freedoms | Citizens Only |
| Art. 21 | Protection of Life | Universal Right |`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(tableText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      });
    }
  };

  return (
    <div className="tool-page-container">
      {/* Top back breadcrumb */}
      <div className="tool-page-breadcrumb">
        <button className="breadcrumb-back-btn" onClick={onNavigateHome}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>All Tools</span>
        </button>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">📋 Copy Text &amp; Tables</span>
      </div>

      <div className="tool-page-header">
        <div className="tool-badge-pill" style={{ background: '#f0f9ff', color: '#0369a1' }}>
          <span>📋</span> Structured OCR &amp; Table Extractor
        </div>
        <h1 className="tool-page-title">Extract Text &amp; Tables to Markdown</h1>
        <p className="tool-page-subtitle">
          Unlock uncopyable flat scan tables, constitutional case laws, and tabular syllabus data into clean Markdown, CSV, or structured JSON with 1-click clipboard copy.
        </p>
      </div>

      <div className="tool-work-grid">
        {/* Left column: Format chooser, DropZone & Options */}
        <div className="tool-action-card">
          <div className="format-selection-group">
            <h4 className="format-group-title">Select Output Format</h4>
            <div className="format-pills-row">
              <div
                className={`format-pill ${activeFormat === 'markdown' ? 'selected' : ''}`}
                onClick={() => onChangeConfig({ ...config, output_format: 'markdown' })}
              >
                <div className="format-pill-name">Markdown</div>
                <div className="format-pill-ext">.md (Notion/Obsidian)</div>
              </div>

              <div
                className={`format-pill ${activeFormat === 'json' ? 'selected' : ''}`}
                onClick={() => onChangeConfig({ ...config, output_format: 'json' })}
              >
                <div className="format-pill-name">Structured JSON</div>
                <div className="format-pill-ext">.json (API/Dev)</div>
              </div>

              <div
                className={`format-pill ${activeFormat === 'raw' ? 'selected' : ''}`}
                onClick={() => onChangeConfig({ ...config, output_format: 'raw' })}
              >
                <div className="format-pill-name">Plain Text</div>
                <div className="format-pill-ext">.txt (Clean Raw)</div>
              </div>
            </div>
          </div>

          <h3 className="tool-action-title">Upload Scanned Document</h3>
          <p className="tool-action-desc">Drop your scanned table, syllabus schedule, or legal document.</p>

          <DropZone
            file={null}
            setFile={(f) => f && onFileSelect(f)}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
            handleDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files?.[0]) onFileSelect(e.dataTransfer.files[0]);
            }}
          />

          <div className="tool-settings-group">
            <h4 className="tool-settings-header">Extraction Settings</h4>

            <div className="tool-setting-row">
              <div>
                <div className="tool-setting-label">Strict Table Alignment</div>
                <div className="tool-setting-desc">Enforces vertical pipe | column borders without breaking cell text</div>
              </div>
              <input
                type="checkbox"
                checked={config.preserve_tables !== false}
                onChange={(e) => onChangeConfig({ ...config, preserve_tables: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: '#0284c7', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* 1-Click Clipboard Table Micro-Interaction */}
          <div className="clipboard-preview-box">
            <div className="clipboard-preview-header">
              <span className="clipboard-preview-title">⚡ Output Preview (Notion / Obsidian Ready)</span>
              <button 
                type="button"
                className={`btn-quick-copy ${copied ? 'copied' : ''}`}
                onClick={handleCopySample}
              >
                {copied ? '✓ Copied to Clipboard!' : '📋 Copy Sample Table'}
              </button>
            </div>
            <pre className="clipboard-code-preview">
{`| Article | Right Guaranteed | Scope |
| :--- | :--- | :--- |
| Art. 14 | Equality Before Law | Citizens & Foreigners |
| Art. 19 | Six Basic Freedoms | Citizens Only |
| Art. 21 | Protection of Life | Universal Right |`}
            </pre>
          </div>
        </div>

        {/* Right column: Interactive Anime.js Proof */}
        <InteractiveProofViewer
          title="Structured Table Extraction Benchmark"
          badge="Constitutional Rights Table"
          badgeColor="#0284c7"
          badgeBg="#f0f9ff"
          beforeImg="/samples/doc_3_before.jpg"
          afterImg="/samples/doc_3_after.jpg"
          beforeLabel="Locked in Flat Scanned Image"
          afterLabel="1-Click Copyable Markdown Table"
          highlights={['Markdown Ready', 'Notion Compatible', 'Zero Alignment Jitter']}
        />
      </div>
    </div>
  );
}
