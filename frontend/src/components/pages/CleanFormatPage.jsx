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
        <span className="breadcrumb-current">Clean &amp; Format</span>
      </div>

      {/* Header */}
      <div className="tool-page-header">
        <h1 className="tool-page-title">Clean &amp; Format</h1>
      </div>

      {/* 2-Column Working Area */}
      <div className="tool-work-grid">
        {/* Left column: Dropzone & Settings */}
        <div className="tool-action-card">
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
            <div className="tool-setting-row">
              <span className="tool-setting-label">Remove ads &amp; watermarks</span>
              <input
                type="checkbox"
                checked={config.clean_watermarks !== false}
                onChange={(e) => onChangeConfig({ ...config, clean_watermarks: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: '#2563eb', cursor: 'pointer' }}
              />
            </div>

            <div className="tool-setting-row">
              <span className="tool-setting-label">Sharpen math formulas &amp; handwriting</span>
              <input
                type="checkbox"
                checked={config.fix_formulas !== false}
                onChange={(e) => onChangeConfig({ ...config, fix_formulas: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: '#2563eb', cursor: 'pointer' }}
              />
            </div>

            <div className="tool-setting-row">
              <span className="tool-setting-label">Custom words to remove</span>
              <input
                type="text"
                placeholder="e.g. Channel Name, Telegram"
                value={config.custom_spam_words || ''}
                onChange={(e) => onChangeConfig({ ...config, custom_spam_words: e.target.value })}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--border-default)',
                  background: 'var(--surface-white)',
                  color: 'var(--text-main)',
                  fontSize: '12px',
                  width: '180px',
                }}
              />
            </div>
          </div>
        </div>

        {/* Right column: Interactive Anime.js Before/After Proof */}
        <InteractiveProofViewer
          title="Scan Cleanup Test"
          beforeImg="/samples/doc_1_before.jpg"
          afterImg="/samples/doc_1_after.jpg"
          beforeLabel="Faint Scan & Watermarks"
          afterLabel="Clean White Note"
          features={['Zero Watermarks', 'Clean White Pages', 'Formulas Kept Sharp']}
        />
      </div>
    </div>
  );
}
