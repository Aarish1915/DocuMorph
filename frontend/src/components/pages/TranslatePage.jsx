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
        <span className="breadcrumb-current">🌐 Translate Language</span>
      </div>

      <div className="tool-page-header">
        <div className="tool-badge-pill" style={{ background: '#fff7ed', color: '#c2410c' }}>
          <span>🌐</span> Multi-Language Translation Engine
        </div>
        <h1 className="tool-page-title">Translate PDF with Math &amp; Code Protection</h1>
        <p className="tool-page-subtitle">
          Translate English and regional PDFs into 10+ languages. Mathematical formulas ($\sin i$, $\theta_c$, fractions, equations) and code blocks remain 100% protected and uncorrupted.
        </p>
      </div>

      <div className="tool-work-grid">
        {/* Left column: Language matrix, Content type, DropZone */}
        <div className="tool-action-card">
          {/* Multi-Language Selector */}
          <div className="format-selection-group">
            <h4 className="format-group-title">Choose Target Language</h4>
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

          <h3 className="tool-action-title">Upload Document to Translate</h3>
          <p className="tool-action-desc">Drop your study notes or paper. Formulas remain 100% intact.</p>

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
            <h4 className="tool-settings-header">Domain &amp; Protection Guard</h4>

            <div className="tool-setting-row">
              <div>
                <div className="tool-setting-label">Subject Domain Guard</div>
                <div className="tool-setting-desc">Preserves technical terminology for sciences or law</div>
              </div>
              <select
                value={selectedType}
                onChange={(e) => onChangeConfig({ ...config, content_type: e.target.value })}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <option value="science_math">Science &amp; Mathematics (Formula Guard)</option>
                <option value="law_upsc">Law, Polity &amp; UPSC</option>
                <option value="general">General Prose &amp; Literature</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right column: Interactive Anime.js Proof */}
        <InteractiveProofViewer
          title="Formula-Protected Translation Benchmark"
          badge="Optics & Physics Notes"
          badgeColor="#ea580c"
          badgeBg="#fff7ed"
          beforeImg="/samples/doc_4_before.jpg"
          afterImg="/samples/doc_4_after.jpg"
          beforeLabel="English Technical Scan"
          afterLabel="Fluent Hindi (Formulas $F=ma$ Intact)"
          highlights={['10+ Indic Languages', 'LaTeX Intact', 'Accurate Terminology']}
        />
      </div>
    </div>
  );
}
