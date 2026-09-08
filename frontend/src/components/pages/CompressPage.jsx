import React, { useState } from 'react';
import DropZone from '../workspace/DropZone';
import InteractiveProofViewer from '../common/InteractiveProofViewer';

export default function CompressPage({
  onNavigateHome,
  onFileSelect,
  isDragging,
  setIsDragging,
  config = {},
  onChangeConfig = () => {},
}) {
  const [pageCount, setPageCount] = useState(50);

  const compactedPages = Math.ceil(pageCount * 0.36);
  const originalCost = pageCount * 5; // ₹5 per page print
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
        {/* Left column: Calculator, Dropzone & Controls */}
        <div className="tool-action-card">
          {/* Interactive Savings Calculator */}
          <div className="savings-calculator-card">
            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                <span>Document Length:</span>
                <span style={{ color: '#16a34a', fontWeight: 700 }}>{pageCount} Pages</span>
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
                <span className="savings-stat-lbl">Original Scan</span>
              </div>
              <span style={{ fontSize: '16px', color: 'var(--text-subtle)' }}>➔</span>
              <div className="savings-stat-box">
                <span className="savings-stat-val" style={{ color: '#16a34a' }}>{compactedPages} pgs</span>
                <span className="savings-stat-lbl">Compacted A4</span>
              </div>
              <div className="savings-stat-box" style={{ background: 'var(--surface-selected)', border: '1px solid var(--border-default)' }}>
                <span className="savings-stat-val" style={{ color: '#16a34a' }}>Save ₹{moneySaved}</span>
                <span className="savings-stat-lbl">Per Printout</span>
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

          {/* Density Settings */}
          <div className="tool-settings-group">
            <div className="tool-setting-row">
              <span className="tool-setting-label">Compaction mode</span>
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
                <option value="balanced">Normal margins (Standard)</option>
                <option value="ultra_dense">Dense 2-column (Paper saver)</option>
              </select>
            </div>

            <div className="tool-setting-row">
              <span className="tool-setting-label">Remove repeated headers</span>
              <input
                type="checkbox"
                checked={config.strip_metadata !== false}
                onChange={(e) => onChangeConfig({ ...config, strip_metadata: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: '#16a34a', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>

        {/* Right column: Interactive Anime.js Proof */}
        <InteractiveProofViewer
          title="Page Compaction Test"
          beforeImg="/samples/doc_2_before.jpg"
          afterImg="/samples/doc_2_after.jpg"
          beforeLabel="50 Loose Pages"
          afterLabel="18 Compacted Sheets"
          features={['Save ~60% Pages', 'Cut Printing Cost', 'Zero Questions Lost']}
        />
      </div>
    </div>
  );
}
