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
        <span className="breadcrumb-current">Extract Text</span>
      </div>

      <div className="tool-page-header">
        <h1 className="tool-page-title">Extract Text</h1>
      </div>

      <div className="tool-work-grid">
        {/* Left column: Format chooser, DropZone & Options */}
        <div className="tool-action-card">
          <div className="format-selection-group">
            <div className="format-pills-row">
              <div
                className={`format-pill ${activeFormat === 'markdown' ? 'selected' : ''}`}
                onClick={() => onChangeConfig({ ...config, output_format: 'markdown' })}
              >
                <div className="format-pill-name">Markdown</div>
                <div className="format-pill-ext">.md (Notion)</div>
              </div>

              <div
                className={`format-pill ${activeFormat === 'json' ? 'selected' : ''}`}
                onClick={() => onChangeConfig({ ...config, output_format: 'json' })}
              >
                <div className="format-pill-name">JSON</div>
                <div className="format-pill-ext">.json (Devs)</div>
              </div>

              <div
                className={`format-pill ${activeFormat === 'raw' ? 'selected' : ''}`}
                onClick={() => onChangeConfig({ ...config, output_format: 'raw' })}
              >
                <div className="format-pill-name">Plain Text</div>
                <div className="format-pill-ext">.txt</div>
              </div>
            </div>
          </div>

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
            <div className="tool-setting-row">
              <span className="tool-setting-label">Keep table columns aligned</span>
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
              <span className="clipboard-preview-title">Sample Output Preview</span>
              <button 
                type="button"
                className={`btn-quick-copy ${copied ? 'copied' : ''}`}
                onClick={handleCopySample}
              >
                {copied ? '✓ Copied!' : 'Copy Sample Table'}
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
          title="Table Extraction Test"
          beforeImg="/samples/doc_3_before.jpg"
          afterImg="/samples/doc_3_after.jpg"
          beforeLabel="Flat Scan (Uncopyable)"
          afterLabel="Clean Markdown Table"
          features={['Notion & Excel Ready', 'Columns Neatly Aligned', '1-Click Copy']}
        />
      </div>
    </div>
  );
}
