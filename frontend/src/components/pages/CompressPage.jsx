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
        <span className="breadcrumb-current">📉 Compact to Fewer Pages</span>
      </div>

      <div className="tool-page-header">
        <div className="tool-badge-pill" style={{ background: '#f0fdf4', color: '#16a34a' }}>
          <span>📉</span> True Space Compactor
        </div>
        <h1 className="tool-page-title">Compact PDF &amp; Save Printing Paper</h1>
        <p className="tool-page-subtitle">
          Eliminates huge 3-inch headers and artificial margins from coaching booklets. Restructures questions into dense, readable 2-column study layouts saving 40% to 65% printing costs.
        </p>
      </div>

      <div className="tool-work-grid">
        {/* Left column: Calculator, Dropzone & Controls */}
        <div className="tool-action-card">
          {/* Interactive Savings Calculator */}
          <div className="savings-calculator-card">
            <div className="savings-calc-header">
              <span className="savings-calc-title">⚡ Estimated Xerox &amp; Paper Savings</span>
              <span className="savings-calc-badge">64% Less Paper</span>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>
                <span>Document Page Count:</span>
                <span style={{ color: '#16a34a', fontWeight: 800 }}>{pageCount} Pages</span>
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
                <span className="savings-stat-val" style={{ color: '#991b1b' }}>{pageCount} pgs</span>
                <span className="savings-stat-lbl">Original Scan</span>
              </div>
              <span style={{ fontSize: '18px', color: '#64748b' }}>➔</span>
              <div className="savings-stat-box">
                <span className="savings-stat-val" style={{ color: '#166534' }}>{compactedPages} pgs</span>
                <span className="savings-stat-lbl">Compacted A4</span>
              </div>
              <div className="savings-stat-box" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <span className="savings-stat-val" style={{ color: '#15803d' }}>Save ₹{moneySaved}</span>
                <span className="savings-stat-lbl">Per Xerox Copy</span>
              </div>
            </div>
          </div>

          <h3 className="tool-action-title">Upload Booklet to Compact</h3>
          <p className="tool-action-desc">Drop your booklet or class notes here to compress pages.</p>

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
            <h4 className="tool-settings-header">Compaction Intensity</h4>

            <div className="tool-setting-row">
              <div>
                <div className="tool-setting-label">Layout Density</div>
                <div className="tool-setting-desc">Balanced margins or maximum 2-column print saver</div>
              </div>
              <select
                value={config.quality || 'balanced'}
                onChange={(e) => onChangeConfig({ ...config, quality: e.target.value })}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <option value="balanced">Balanced A4 (Recommended)</option>
                <option value="ultra_dense">Ultra-Dense 2-Column (Print Saver)</option>
              </select>
            </div>

            <div className="tool-setting-row">
              <div>
                <div className="tool-setting-label">Strip Repeated Header Margins</div>
                <div className="tool-setting-desc">Removes 3-inch coaching institute headers from every single page</div>
              </div>
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
          title="Space & Page Compaction Benchmark"
          badge="UPSC Economy Booklet"
          badgeColor="#16a34a"
          badgeBg="#f0fdf4"
          beforeImg="/samples/doc_2_before.jpg"
          afterImg="/samples/doc_2_after.jpg"
          beforeLabel="50 Loose Pages (₹250 Xerox)"
          afterLabel="18 Dense Sheets (₹90 Xerox)"
          highlights={['64% Pages Saved', '2-Column Compact', 'Zero Content Deleted']}
        />
      </div>
    </div>
  );
}
