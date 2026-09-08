import React from 'react';
import DropZone from '../workspace/DropZone';
import InteractiveProofViewer from '../common/InteractiveProofViewer';
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
  const activeFormat = config.output_format || 'markdown';

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
        {/* Left column: Format chooser, DropZone, Language & Options */}
        <div className="tool-action-card">
          <div className="format-selection-group" style={{ marginBottom: '16px' }}>
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
                <div className="format-pill-ext">.json (Structured)</div>
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

          {file && (
            <div style={{ marginTop: '16px' }}>
              <button
                type="button"
                className="tool-execute-btn"
                disabled={isProcessing}
                onClick={onProcess}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  background: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>{isProcessing ? 'Extracting...' : 'Extract Text & Tables'}</span>
                {!isProcessing && <span>→</span>}
              </button>
            </div>
          )}

          {/* Student & Exam Language Selector */}
          <StudentExamLanguageSelector
            languageMode={config.language_mode || 'auto'}
            onChange={(mode) => onChangeConfig({ ...config, language_mode: mode })}
          />

          <div className="tool-settings-group" style={{ marginTop: '16px' }}>
            <div className="tool-setting-row">
              <span className="tool-setting-label">Preserve table structure</span>
              <input
                type="checkbox"
                checked={config.preserve_tables !== false}
                onChange={(e) => onChangeConfig({ ...config, preserve_tables: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: '#0284c7', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>

        {/* Right column: Interactive Before/After Proof */}
        <InteractiveProofViewer
          title="Table Extraction Preview"
          beforeImg="/samples/doc_3_before.jpg"
          afterImg="/samples/doc_3_after.jpg"
          beforeLabel="Uncopyable Scan Table"
          afterLabel="Clean Markdown Table"
        />
      </div>
    </div>
  );
}
