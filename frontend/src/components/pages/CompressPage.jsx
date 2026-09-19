import React, { useState, useRef } from 'react';
import DropZone from '../workspace/DropZone';
import InteractiveProofViewer from '../common/InteractiveProofViewer';

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
  const hiddenFileInputRef = useRef(null);
  const [sliderPages, setSliderPages] = useState(40);
  const compactMode = config.compact_mode || 'smart_dense';
  const diagramDpi = config.diagram_dpi || '200';

  // Paper & Xerox savings calculation (approx 50% compaction, ₹2 per page photocopy)
  const compactedPages = Math.ceil(sliderPages * 0.48);
  const pagesSaved = sliderPages - compactedPages;
  const rupeeSaved = pagesSaved * 2;

  const handleChooseFileClick = () => {
    if (hiddenFileInputRef.current) {
      hiddenFileInputRef.current.click();
    }
  };

  return (
    <div className="tool-page-container tool-theme-compress">
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
        <span className="breadcrumb-current" aria-current="page">Compress PDF</span>
      </nav>

      {/* Header with Simple English */}
      <div className="tool-page-header">
        <div className="tool-hero-badge">
          <span className="tool-badge-dot"></span>
          <span>Save Paper • Lower Printing Cost • Smaller File Size</span>
        </div>
        <h1 className="tool-page-title">Compress &amp; Save Paper</h1>
        <p className="tool-card-desc" style={{ maxWidth: '600px', margin: '0 auto 20px auto' }}>
          Removes empty white spaces and useless margins. Pack 50 pages into 20 clean sheets to save printing money or share quickly on WhatsApp.
        </p>
      </div>

      <div className="tool-work-grid">
        <div className="tool-action-card">
          {/* Live Student Savings Calculator */}
          <div className="lux-range-wrap" style={{ background: 'var(--tool-light)', borderColor: 'var(--tool-border)' }}>
            <div className="lux-range-header">
              <span style={{ fontWeight: 700, color: 'var(--tool-primary)' }}>📊 Paper &amp; Printing Cost Calculator:</span>
              <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--tool-primary)' }}>{sliderPages} Pages</span>
            </div>
            <input
              type="range"
              min="10"
              max="200"
              step="5"
              value={sliderPages}
              onChange={(e) => setSliderPages(parseInt(e.target.value, 10))}
              style={{ width: '100%', accentColor: 'var(--tool-primary)', cursor: 'pointer' }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '12px', textAlign: 'center' }}>
              <div style={{ background: 'var(--surface-card)', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>After Compacting</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--tool-primary)' }}>~{compactedPages} Pages</div>
              </div>
              <div style={{ background: 'var(--surface-card)', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pages Saved</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#16a34a' }}>-{pagesSaved} Sheets</div>
              </div>
              <div style={{ background: 'var(--surface-card)', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Photocopy Saved</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#16a34a' }}>₹{rupeeSaved} saved</div>
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

          {/* Simple Compaction Choices */}
          <div style={{ marginTop: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
              1. Choose How to Shrink
            </label>
            <div className="choice-cards-grid">
              <div
                className={`choice-card-item ${compactMode === 'smart_dense' ? 'selected' : ''}`}
                onClick={() => onChangeConfig({ ...config, compact_mode: 'smart_dense' })}
              >
                <div className="choice-card-header">
                  <span className="choice-card-title">Smart Fit A4</span>
                  <span>⚡</span>
                </div>
                <span className="choice-card-desc">Shrinks empty gaps so you print fewer pages. Very easy to read.</span>
              </div>

              <div
                className={`choice-card-item ${compactMode === 'two_up' ? 'selected' : ''}`}
                onClick={() => onChangeConfig({ ...config, compact_mode: 'two_up' })}
              >
                <div className="choice-card-header">
                  <span className="choice-card-title">2 Pages on 1 Sheet</span>
                  <span>📑</span>
                </div>
                <span className="choice-card-desc">Cuts paper usage in half. Perfect for quick exam revision.</span>
              </div>

              <div
                className={`choice-card-item ${compactMode === 'max_compression' ? 'selected' : ''}`}
                onClick={() => onChangeConfig({ ...config, compact_mode: 'max_compression' })}
              >
                <div className="choice-card-header">
                  <span className="choice-card-title">Small File Size</span>
                  <span>🗜️</span>
                </div>
                <span className="choice-card-desc">Reduces file size (MB) for fast WhatsApp sharing and mobile storage.</span>
              </div>
            </div>
          </div>

          {/* Simple Quality Selector */}
          <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-default)', paddingTop: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px', display: 'block' }}>
              2. Picture Quality
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                { id: '150', label: 'Fast & Light (150 DPI)', sub: 'Best for phone & WhatsApp' },
                { id: '200', label: 'Balanced (200 DPI)', sub: 'Good for screen & reading' },
                { id: '300', label: 'High Quality (300 DPI)', sub: 'Best for paper printing' }
              ].map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => onChangeConfig({ ...config, diagram_dpi: opt.id })}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1.5px solid',
                    borderColor: diagramDpi === opt.id ? 'var(--tool-primary)' : 'var(--border-default)',
                    background: diagramDpi === opt.id ? 'var(--tool-light)' : 'var(--surface-card)',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '12px', color: diagramDpi === opt.id ? 'var(--tool-primary)' : 'var(--text-main)' }}>{opt.label}</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>{opt.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Unified Action Button */}
          <div style={{ marginTop: '24px' }}>
            {!file ? (
              <button
                type="button"
                className="tool-execute-btn"
                onClick={handleChooseFileClick}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  background: 'var(--surface-subtle)',
                  color: 'var(--text-muted)',
                  fontSize: '14px',
                  fontWeight: 650,
                  borderRadius: '12px',
                  border: '1px dashed var(--border-default)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>👆</span>
                <span>Choose or drop a PDF above to compact</span>
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
                <span>📉</span>
                <span>{isProcessing ? 'Compacting Pages...' : 'Compress & Compact PDF Now'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Real Result Preview */}
        <section className="home-showcase-section" style={{ margin: 0, maxWidth: '100%' }}>
          <div className="home-showcase-header">
            <h2 className="home-showcase-title" style={{ fontSize: '20px' }}>Real Result Preview</h2>
            <p className="home-showcase-subtitle">See how wide, loose question sheets are compacted into neat, readable notes.</p>
          </div>
          <InteractiveProofViewer
            title="Compress &amp; Compact"
            beforeImg="/samples/doc_2_before.jpg"
            afterImg="/samples/doc_2_after.jpg"
            beforeLabel="Loose 50-Page Document"
            afterLabel="Compacted 20-Page Sheet"
          />
        </section>
      </div>
    </div>
  );
}
