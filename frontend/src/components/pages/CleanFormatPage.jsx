import React from 'react';
import DropZone from '../workspace/DropZone';
import InteractiveProofViewer from '../common/InteractiveProofViewer';
import StudentExamLanguageSelector from '../common/StudentExamLanguageSelector';

export default function CleanFormatPage({
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
  return (
    <div className="tool-page-container">
      {/* Top back breadcrumb (Accessible semantic breadcrumb - Issue 8) */}
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
        <span className="breadcrumb-current" aria-current="page">Clean &amp; Format</span>
      </nav>

      {/* Header */}
      <div className="tool-page-header">
        <h1 className="tool-page-title">Clean &amp; Format</h1>
      </div>

      {/* 2-Column Working Area */}
      <div className="tool-work-grid">
        {/* Left column: Dropzone, Language & Settings */}
        <div className="tool-action-card">
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
                  background: 'var(--color-primary, #2563eb)',
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
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>{isProcessing ? 'Processing Document...' : 'Clean Document'}</span>
                {!isProcessing && <span>→</span>}
              </button>
            </div>
          )}

          {/* Student & Exam Language Selector */}
          <StudentExamLanguageSelector
            languageMode={config.language_mode || 'auto'}
            onChange={(mode) => onChangeConfig({ ...config, language_mode: mode })}
          />

          {/* Clean Controls (Gestalt Proximity & Accessible Labels - Issues 5 & 9) */}
          <div className="tool-settings-group" style={{ marginTop: '16px' }}>
            <label className="tool-setting-row" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                checked={config.clean_watermarks !== false}
                onChange={(e) => onChangeConfig({ ...config, clean_watermarks: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: '#2563eb', cursor: 'pointer', flexShrink: 0 }}
              />
              <span className="tool-setting-label">Remove watermarks &amp; ads</span>
            </label>

            <label className="tool-setting-row" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                checked={config.fix_formulas !== false}
                onChange={(e) => onChangeConfig({ ...config, fix_formulas: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: '#2563eb', cursor: 'pointer', flexShrink: 0 }}
              />
              <span className="tool-setting-label">Sharpen handwriting &amp; formulas</span>
            </label>

            <div className="tool-setting-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
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

          {/* Page Range Selection for Rapid Iteration & Fast Testing */}
          <div className="tool-settings-group" style={{ marginTop: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span className="tool-setting-label" style={{ fontWeight: 650 }}>📄 Pages to Process:</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => onChangeConfig({ ...config, page_range: 'all' })}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1.5px solid var(--border-default)',
                    background: config.page_range !== 'custom' ? 'var(--color-primary, #2563eb)' : 'var(--surface-white)',
                    color: config.page_range !== 'custom' ? '#ffffff' : 'var(--text-main)',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  All Pages
                </button>
                <button
                  type="button"
                  onClick={() => onChangeConfig({ ...config, page_range: 'custom', page_from: config.page_from || 1, page_to: config.page_to || 3 })}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1.5px solid var(--border-default)',
                    background: config.page_range === 'custom' ? 'var(--color-primary, #2563eb)' : 'var(--surface-white)',
                    color: config.page_range === 'custom' ? '#ffffff' : 'var(--text-main)',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  ⚡ Quick Test (1–3)
                </button>
              </div>
            </div>

            {config.page_range === 'custom' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: 'var(--surface-subtle)', borderRadius: '8px', marginTop: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>From:</span>
                <input
                  type="number"
                  min={1}
                  value={config.page_from || 1}
                  onChange={(e) => onChangeConfig({ ...config, page_from: Math.max(1, parseInt(e.target.value) || 1) })}
                  style={{ width: '52px', padding: '4px 6px', borderRadius: '6px', border: '1px solid var(--border-default)', fontSize: '12px', textAlign: 'center' }}
                />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>To:</span>
                <input
                  type="number"
                  min={1}
                  value={config.page_to || 3}
                  onChange={(e) => onChangeConfig({ ...config, page_to: Math.max(1, parseInt(e.target.value) || 1) })}
                  style={{ width: '52px', padding: '4px 6px', borderRadius: '6px', border: '1px solid var(--border-default)', fontSize: '12px', textAlign: 'center' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--color-primary)', marginLeft: 'auto', fontWeight: 600 }}>~5 sec speed</span>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Interactive Before/After Proof */}
        <InteractiveProofViewer
          title="Scan Cleanup Preview"
          beforeImg="/samples/doc_1_before.jpg"
          afterImg="/samples/doc_1_after.jpg"
          beforeLabel="Original Scan"
          afterLabel="Clean Note"
        />
      </div>
    </div>
  );
}
