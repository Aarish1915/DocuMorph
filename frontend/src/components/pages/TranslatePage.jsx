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
  { id: 'Punjabi', label: 'Punjabi', script: 'ਪੰਜਾਬી' },
  { id: 'Urdu', label: 'Urdu', script: 'اردو' },
  { id: 'English', label: 'English', script: 'English' },
  { id: 'Spanish', label: 'Spanish', script: 'Español' },
  { id: 'French', label: 'French', script: 'Français' },
  { id: 'German', label: 'German', script: 'Deutsch' },
];

export default function TranslatePage({
  onNavigateHome,
  onFileSelect,
  isDragging,
  setIsDragging,
  config = {},
  onChangeConfig = () => {},
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
          {/* Multi-Language Selector */}
          <div className="format-selection-group">
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

          <div className="tool-settings-group">
            <div className="tool-setting-row">
              <span className="tool-setting-label">Subject type</span>
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
                <option value="science_math">Science &amp; Math (Formulas protected)</option>
                <option value="law_upsc">Law &amp; Exam Notes</option>
                <option value="general">General Text</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right column: Interactive Anime.js Proof */}
        <InteractiveProofViewer
          title="Language Translation Test"
          beforeImg="/samples/doc_4_before.jpg"
          afterImg="/samples/doc_4_after.jpg"
          beforeLabel="English Scanned Note"
          afterLabel="Hindi Translated Note"
          features={['10+ Indic Languages', 'Formulas Kept Intact', 'Accurate Terminology']}
        />
      </div>
    </div>
  );
}
