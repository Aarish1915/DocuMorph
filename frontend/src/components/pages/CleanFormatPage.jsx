import React from 'react';
import DropZone from '../workspace/DropZone';
import InteractiveProofViewer from '../common/InteractiveProofViewer';

export default function CleanFormatPage({
  onNavigateHome,
  onFileSelect,
  isDragging,
  setIsDragging,
  config = {},
  onChangeConfig = () => {},
}) {
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
        <span className="breadcrumb-current">✨ Clean &amp; Beautify Notes</span>
      </div>

      {/* Header */}
      <div className="tool-page-header">
        <div className="tool-badge-pill" style={{ background: '#eff6ff', color: '#2563eb' }}>
          <span>✨</span> Scan Enhancement
        </div>
        <h1 className="tool-page-title">Clean &amp; Beautify Scanned Notes</h1>
        <p className="tool-page-subtitle">
          Eliminate Telegram promotion watermarks, photocopy shadows, and dark borders. Restores handwritten and printed math into clean, print-ready A4 documents.
        </p>
      </div>

      {/* 2-Column Working Area */}
      <div className="tool-work-grid">
        {/* Left column: Dropzone & Settings */}
        <div className="tool-action-card">
          <h3 className="tool-action-title">Upload Your Document</h3>
          <p className="tool-action-desc">Drop your scanned notes or booklet here to begin cleanup.</p>

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

          {/* Dedicated Clean Controls */}
          <div className="tool-settings-group">
            <h4 className="tool-settings-header">Clean &amp; Format Settings</h4>

            <div className="tool-setting-row">
              <div>
                <div className="tool-setting-label">Remove Telegram &amp; Coaching Ads</div>
                <div className="tool-setting-desc">Detects and strips @channel usernames, phone numbers &amp; banners</div>
              </div>
              <input
                type="checkbox"
                checked={config.clean_watermarks !== false}
                onChange={(e) => onChangeConfig({ ...config, clean_watermarks: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: '#2563eb', cursor: 'pointer' }}
              />
            </div>

            <div className="tool-setting-row">
              <div>
                <div className="tool-setting-label">Fix &amp; Render LaTeX Formulas</div>
                <div className="tool-setting-desc">Converts faint math handwriting into crisp textbook vector equations</div>
              </div>
              <input
                type="checkbox"
                checked={config.fix_formulas !== false}
                onChange={(e) => onChangeConfig({ ...config, fix_formulas: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: '#2563eb', cursor: 'pointer' }}
              />
            </div>

            <div className="tool-setting-row">
              <div>
                <div className="tool-setting-label">Custom Coaching Name to Remove</div>
                <div className="tool-setting-desc">Add specific coaching names or channels (e.g. Allen, Toppers)</div>
              </div>
              <input
                type="text"
                placeholder="e.g. Kota Toppers, PhysicsWallah"
                value={config.custom_spam_words || ''}
                onChange={(e) => onChangeConfig({ ...config, custom_spam_words: e.target.value })}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '12px',
                  width: '180px',
                }}
              />
            </div>
          </div>
        </div>

        {/* Right column: Interactive Anime.js Before/After Proof */}
        <InteractiveProofViewer
          title="Real Scan Restoration Benchmark"
          badge="Physics & JEE Notes"
          badgeColor="#2563eb"
          badgeBg="#eff6ff"
          beforeImg="/samples/doc_1_before.jpg"
          afterImg="/samples/doc_1_after.jpg"
          beforeLabel="Telegram Ads & Faint Scan"
          afterLabel="Pristine A4 & Vector Math"
          highlights={['0 Ads', 'LaTeX Restored', 'Whiter Background']}
        />
      </div>
    </div>
  );
}
