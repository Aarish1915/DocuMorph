import React, { useRef } from 'react';
import DropZone from '../workspace/DropZone';

const LANGUAGES = [
  { id: 'Hindi', label: 'Hindi', script: 'हिन्दी' },
  { id: 'Marathi', label: 'Marathi', script: 'मराठी' },
  { id: 'Gujarati', label: 'Gujarati', script: 'ગુજરાતી' },
  { id: 'Bengali', label: 'Bengali', script: 'বাংলা' },
  { id: 'Tamil', label: 'Tamil', script: 'தமிழ்' },
  { id: 'Telugu', label: 'Telugu', script: 'తెలుగు' },
  { id: 'Kannada', label: 'Kannada', script: 'ಕನ್ನಡ' },
  { id: 'Malayalam', label: 'Malayalam', script: 'മലയാളം' },
  { id: 'Punjabi', label: 'Punjabi', script: 'ਪੰਜਾਬੀ' },
  { id: 'Urdu', label: 'Urdu', script: 'اردو' },
  { id: 'English', label: 'English', script: 'English' },
  { id: 'Spanish', label: 'Spanish', script: 'Español' },
  { id: 'French', label: 'French', script: 'Français' },
  { id: 'German', label: 'German', script: 'Deutsch' },
];

export default function TranslatePage({
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
  const selectedTarget = config.to_language || 'Hindi';
  const protectMath = config.protect_math !== false;
  const translateDiagramLabels = config.translate_diagram_labels !== false;
  const outputFormat = config.output_format || 'pdf';

  const handleSelectLanguage = (langId) => {
    onChangeConfig({
      ...config,
      to_language: langId,
      language_mode: langId,
    });
  };

  const handleChooseFileClick = () => {
    if (hiddenFileInputRef.current) {
      hiddenFileInputRef.current.click();
    }
  };

  return (
    <div className="tool-page-container tool-theme-translate">
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
        <span className="breadcrumb-current" aria-current="page">Translate PDF</span>
      </nav>

      {/* Header with Plain English */}
      <div className="tool-page-header">
        <div className="tool-hero-badge">
          <span className="tool-badge-dot"></span>
          <span>14 Languages • Math Formulas Protected</span>
        </div>
        <h1 className="tool-page-title">Translate PDF Documents</h1>
        <p className="tool-card-desc" style={{ maxWidth: '600px', margin: '0 auto 20px auto' }}>
          Translate class notes, study guides, and books into your own language. All math equations, numbers, and diagrams stay 100% safe.
        </p>
      </div>

      <div className="tool-work-grid">
        <div className="tool-action-card">
          {/* Step 1: Choose Target Language */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                1. Choose Language to Translate Into
              </label>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--tool-primary)' }}>
                Target: {selectedTarget}
              </span>
            </div>

            <div className="language-matrix-grid">
              {LANGUAGES.map((lang) => (
                <div
                  key={lang.id}
                  className={`lang-chip-card ${selectedTarget === lang.id ? 'selected' : ''}`}
                  onClick={() => handleSelectLanguage(lang.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectLanguage(lang.id);
                    }
                  }}
                >
                  <span className="lang-native-script">{lang.script}</span>
                  <span className="lang-english-label">{lang.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Step 2: Upload File */}
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

          {/* Step 3: Simple Checkboxes */}
          <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-default)', paddingTop: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px', display: 'block' }}>
              2. Simple Protection Settings
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer', padding: '10px', borderRadius: '8px', background: 'var(--bg-secondary)' }}>
                <input
                  type="checkbox"
                  checked={protectMath}
                  onChange={(e) => onChangeConfig({ ...config, protect_math: e.target.checked })}
                  style={{ accentColor: 'var(--tool-primary)' }}
                />
                <div>
                  <div style={{ fontWeight: 700 }}>Protect Math &amp; Physics Formulas</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Keeps equations, numbers, and symbols untouched</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer', padding: '10px', borderRadius: '8px', background: 'var(--bg-secondary)' }}>
                <input
                  type="checkbox"
                  checked={translateDiagramLabels}
                  onChange={(e) => onChangeConfig({ ...config, translate_diagram_labels: e.target.checked })}
                  style={{ accentColor: 'var(--tool-primary)' }}
                />
                <div>
                  <div style={{ fontWeight: 700 }}>Translate Words Inside Diagrams</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Adds a translated word list under scientific pictures</div>
                </div>
              </label>
            </div>
          </div>

          {/* Step 4: Output Choice */}
          <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-default)', paddingTop: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px', display: 'block' }}>
              3. Output Format
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => onChangeConfig({ ...config, output_format: 'pdf' })}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1.5px solid',
                  borderColor: outputFormat === 'pdf' ? 'var(--tool-primary)' : 'var(--border-default)',
                  background: outputFormat === 'pdf' ? 'var(--tool-light)' : 'var(--surface-card)',
                  color: outputFormat === 'pdf' ? 'var(--tool-primary)' : 'var(--text-main)',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                📄 Translated PDF File
              </button>
              <button
                type="button"
                onClick={() => onChangeConfig({ ...config, output_format: 'md' })}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1.5px solid',
                  borderColor: outputFormat === 'md' ? 'var(--tool-primary)' : 'var(--border-default)',
                  background: outputFormat === 'md' ? 'var(--tool-light)' : 'var(--surface-card)',
                  color: outputFormat === 'md' ? 'var(--tool-primary)' : 'var(--text-main)',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                📝 Translated Text File (.md)
              </button>
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
                <span>Choose or drop a PDF above to translate</span>
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
                <span>🌐</span>
                <span>{isProcessing ? `Translating into ${selectedTarget}...` : `Translate PDF into ${selectedTarget} Now`}</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Example Section: Showing how translation works */}
        <section className="home-showcase-section" style={{ margin: '16px 0 0 0', maxWidth: '100%' }}>
          <div className="home-showcase-header">
            <h2 className="home-showcase-title" style={{ fontSize: '18px' }}>Example: English to {selectedTarget}</h2>
            <p className="home-showcase-subtitle">Formulas stay untouched, words are translated clearly.</p>
          </div>

          <div style={{ background: 'var(--surface-card)', border: '1.5px solid var(--border-default)', borderRadius: '14px', padding: '18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid var(--border-default)', paddingBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 750, color: 'var(--tool-primary)' }}>Translation Preview:</span>
              <span style={{ fontSize: '11.5px', background: 'var(--tool-light)', color: 'var(--tool-primary)', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>Formulas Protected</span>
            </div>

            <p style={{ fontSize: '14px', lineHeight: '1.7', margin: '0 0 10px 0', color: 'var(--text-main)' }}>
              <strong>न्यूटन का नियम (Newton's Law):</strong> बल द्रव्यमान और त्वरण के गुणनफल के बराबर होता है:
            </p>
            <div style={{ background: 'var(--bg-secondary)', padding: '8px 14px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '14px', margin: '0 0 12px 0', textAlign: 'center', fontWeight: 700 }}>
              F = m × a
            </div>

            <div style={{ background: 'var(--tool-light)', border: '1px solid var(--tool-border)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px' }}>
              <div style={{ fontWeight: 700, color: 'var(--tool-primary)', marginBottom: '4px' }}>
                📖 Diagram Words List ({selectedTarget}):
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '6px', color: 'var(--text-main)' }}>
                <span>• <strong>Mass (m):</strong> द्रव्यमान</span>
                <span>• <strong>Acceleration (a):</strong> त्वरण</span>
                <span>• <strong>Force (F):</strong> बल</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
