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
  const [sliderPages, setSliderPages] = useState(50);
  const compactMode = config.compact_mode || 'smart_dense';
  const targetDpi = config.target_dpi || 200;

  // Real-time student calculation
  const compactedPages = Math.ceil(sliderPages * 0.42);
  const pagesSaved = sliderPages - compactedPages;
  const rupeeSaved = pagesSaved * 4; // Average 4 INR per printed page

  return (
    <div className="tool-page-container tool-theme-compress">
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
        <span className="breadcrumb-current" aria-current="page">Compress PDF</span>
      </nav>

      {/* Header with Distinct Badge */}
      <div className="tool-page-header">
        <div className="tool-hero-badge">
          <span className="tool-badge-dot"></span>
          <span>True Page Compaction &amp; File Size Reduction</span>
        </div>
        <h1 className="tool-page-title">Compress &amp; Compact PDF</h1>
        <p className="tool-card-desc" style={{ maxWidth: '600px', margin: '0 auto 20px auto' }}>
          Eliminate massive question gaps, coaching banners, and bloated margins. Pack 50 pages into 20 dense, beautifully readable A4 sheets.
        </p>
      </div>

      <div className="tool-work-grid">
        <div className="tool-action-card">
          {/* Live Student Savings Calculator */}
          <div className="lux-range-wrap" style={{ background: 'var(--tool-light)', borderColor: 'var(--tool-border)' }}>
            <div className="lux-range-header">
              <span style={{ fontWeight: 700, color: 'var(--tool-primary)' }}>📊 Live Printing Cost &amp; Paper Calculator:</span>
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
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Compacted Size</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--tool-primary)' }}>~{compactedPages} Pages</div>
              </div>
              <div style={{ background: 'var(--surface-card)', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pages Eliminated</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#16a34a' }}>-{pagesSaved} Sheets</div>
              </div>
              <div style={{ background: 'var(--surface-card)', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Printing Saved</div>
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

          {/* Specialized Compaction Strategy Cards */}
          <div style={{ marginTop: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
              1. Compaction Strategy
            </label>
            <div className="choice-cards-grid">
              <div
                className={`choice-card-item ${compactMode === 'smart_dense' ? 'selected' : ''}`}
                onClick={() => onChangeConfig({ ...config, compact_mode: 'smart_dense' })}
              >
                <div className="choice-card-header">
                  <span className="choice-card-title">Smart Dense A4</span>
                  <span>⚡</span>
                </div>
                <span className="choice-card-desc">Shrinks blank question margins and removes coaching watermarks.</span>
              </div>

              <div
                className={`choice-card-item ${compactMode === 'two_up' ? 'selected' : ''}`}
                onClick={() => onChangeConfig({ ...config, compact_mode: 'two_up' })}
              >
                <div className="choice-card-header">
                  <span className="choice-card-title">2-Up Study Grid</span>
                  <span>📑</span>
                </div>
                <span className="choice-card-desc">Fits 2 full slides side-by-side per A4 page with divider rule.</span>
              </div>

              <div
                className={`choice-card-item ${compactMode === 'archive' ? 'selected' : ''}`}
                onClick={() => onChangeConfig({ ...config, compact_mode: 'archive' })}
              >
                <div className="choice-card-header">
                  <span className="choice-card-title">Max Compression</span>
                  <span>🗜️</span>
                </div>
                <span className="choice-card-desc">Heavy image downsampling for WhatsApp and quick mobile sharing.</span>
              </div>
            </div>
          </div>

          {/* Specialized DPI Slider */}
          <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-default)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                2. Embedded Diagram Resolution
              </label>
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--tool-primary)' }}>{targetDpi} DPI</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[150, 200, 300].map((dpi) => (
                <button
                  key={dpi}
                  type="button"
                  onClick={() => onChangeConfig({ ...config, target_dpi: dpi })}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1.5px solid',
                    borderColor: targetDpi === dpi ? 'var(--tool-primary)' : 'var(--border-default)',
                    background: targetDpi === dpi ? 'var(--tool-light)' : 'var(--surface-card)',
                    color: targetDpi === dpi ? 'var(--tool-primary)' : 'var(--text-main)',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  {dpi === 150 ? '150 (Mobile)' : dpi === 200 ? '200 (Balanced)' : '300 (Print HQ)'}
                </button>
              ))}
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
                <span>⚡</span>
                <span>{isProcessing ? 'Compacting Document Pages...' : 'Compact & Compress PDF'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Tailored Proof Viewer */}
        <section className="home-showcase-section" style={{ margin: '16px 0 0 0', maxWidth: '100%' }}>
          <div className="home-showcase-header">
            <h2 className="home-showcase-title" style={{ fontSize: '20px' }}>Page Compaction Proof</h2>
            <p className="home-showcase-subtitle">See how oversized empty line gaps and promotional banners are compacted into clean A4 study sheets.</p>
          </div>
          <InteractiveProofViewer
            title="Page Compaction Test"
            beforeImg="/samples/doc_1_before.jpg"
            afterImg="/samples/doc_1_after.jpg"
            beforeLabel="Bloated 3-Sentence Page"
            afterLabel="Compacted Double-Column A4"
          />
        </section>
      </div>
    </div>
  );
}
