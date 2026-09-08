import React from 'react';
import DropZone from '../workspace/DropZone';
import InteractiveProofViewer from '../common/InteractiveProofViewer';

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
  const selectedTarget = config.to_language || 'Hindi';
  const selectedType = config.content_type || 'science_math';

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
        <span className="breadcrumb-current">Translate PDF</span>
      </div>

      <div className="tool-page-header">
        <h1 className="tool-page-title">Translate PDF</h1>
      </div>

      <div className="tool-work-grid">
        {/* Left column: Language matrix, Content type, DropZone */}
        <div className="tool-action-card">
          <div className="format-selection-group" style={{ marginBottom: '16px' }}>
            <div className="language-grid">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  className={`lang-card-pill ${selectedTarget === lang.id ? 'selected' : ''}`}
                  onClick={() => onChangeConfig({ ...config, to_language: lang.id })}
                >
                  <span className="lang-script-text">{lang.script}</span>
                  <span className="lang-label-text">{lang.label}</span>
                </button>
              ))}
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
                  background: '#ea580c',
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
                  boxShadow: '0 4px 14px rgba(234, 88, 12, 0.3)',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>{isProcessing ? 'Translating...' : `Translate into ${selectedTarget}`}</span>
                {!isProcessing && <span>→</span>}
              </button>
            </div>
          )}

          <div className="tool-settings-group" style={{ marginTop: '20px' }}>
            <div className="tool-setting-row">
              <span className="tool-setting-label">Document content type</span>
              <select
                value={selectedType}
                onChange={(e) => onChangeConfig({ ...config, content_type: e.target.value })}
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
                <option value="science_math">Science &amp; Math (Formulas preserved)</option>
                <option value="humanities">Literature &amp; General Notes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right column: Interactive Before/After Proof */}
        <InteractiveProofViewer
          title="Translation Preview"
          beforeImg="/samples/doc_4_before.jpg"
          afterImg="/samples/doc_4_after.jpg"
          beforeLabel="English Original Scan"
          afterLabel={`${selectedTarget} Translation`}
        />
      </div>
    </div>
  );
}
