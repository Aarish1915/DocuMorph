import React, { useState } from 'react';
import DropZone from '../workspace/DropZone';
import InteractiveProofViewer from '../common/InteractiveProofViewer';
import StudentExamLanguageSelector from '../common/StudentExamLanguageSelector';

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
  const [pageCount, setPageCount] = useState(50);

  const compactedPages = Math.ceil(pageCount * 0.36);
  const originalCost = pageCount * 5;
  const compactedCost = compactedPages * 5;
  const moneySaved = originalCost - compactedCost;

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
        <span className="breadcrumb-current">Compress PDF</span>
      </div>

      <div className="tool-page-header">
        <h1 className="tool-page-title">Compress PDF</h1>
      </div>

      <div className="tool-work-grid">
        {/* Left column: Calculator, Dropzone, Language & Controls */}
        <div className="tool-action-card">
          {/* Streamlined Savings Calculator */}
          <div className="savings-calculator-card">
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                <span>Pages:</span>
                <span style={{ color: '#16a34a', fontWeight: 700 }}>{pageCount}</span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                step="5"
                value={pageCount}
                onChange={(e) => setPageCount(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#16a34a', cursor: 'pointer' }}
              />
            </div>

            <div className="savings-stat-row">
              <div className="savings-stat-box">
                <span className="savings-stat-val" style={{ color: '#dc2626' }}>{pageCount} pgs</span>
                <span className="savings-stat-lbl">Original</span>
              </div>
              <span style={{ fontSize: '16px', color: 'var(--text-subtle)' }}>➔</span>
              <div className="savings-stat-box">
                <span className="savings-stat-val" style={{ color: '#16a34a' }}>{compactedPages} pgs</span>
                <span className="savings-stat-lbl">Compacted</span>
              </div>
              <div className="savings-stat-box" style={{ background: 'rgba(22, 163, 74, 0.08)', border: '1px solid rgba(22, 163, 74, 0.2)' }}>
                <span className="savings-stat-val" style={{ color: '#16a34a' }}>Save ₹{moneySaved}</span>
                <span className="savings-stat-lbl">Per Print</span>
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
                  background: '#16a34a',
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
                  boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>{isProcessing ? 'Compressing...' : 'Compress PDF'}</span>
                {!isProcessing && <span>→</span>}
              </button>
            </div>
          )}

          {/* Student & Exam Language Selector */}
          <StudentExamLanguageSelector
            languageMode={config.language_mode || 'auto'}
            onChange={(mode) => onChangeConfig({ ...config, language_mode: mode })}
          />

          {/* Density Settings */}
          <div className="tool-settings-group" style={{ marginTop: '16px' }}>
            <div className="tool-setting-row">
              <span className="tool-setting-label">Compaction level</span>
              <select
                value={config.quality || 'balanced'}
                onChange={(e) => onChangeConfig({ ...config, quality: e.target.value })}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--border-default)',
                  background: 'var(--surface-white)',
                  color: 'var(--text-main)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <option value="balanced">Balanced (Recommended)</option>
                <option value="high">Maximum (More questions per page)</option>
                <option value="light">Light (Larger text)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right column: Interactive Before/After Proof */}
        <InteractiveProofViewer
          title="Compaction Preview"
          beforeImg="/samples/doc_2_before.jpg"
          afterImg="/samples/doc_2_after.jpg"
          beforeLabel="Loose Margin Scan"
          afterLabel="Compacted High-Density A4"
        />
      </div>
    </div>
  );
}
