import React, { useState } from 'react';
import DocumentPresetPicker from './DocumentPresetPicker';
import QuickSettingsToggles from './QuickSettingsToggles';
import SuperpowersCustomizer from '../config/SuperpowersCustomizer';

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function WorkspaceScreen({
  file,
  onResetFile,
  serviceType,
  setServiceType,
  config,
  onChangeConfig,
  isProcessing,
  handleProcess,
}) {
  const [activePresetId, setActivePresetId] = useState('coaching_exam');
  const [showFullSuperpowers, setShowFullSuperpowers] = useState(false);

  const handleSelectPreset = (preset) => {
    setActivePresetId(preset.id);
    setServiceType(preset.serviceType);
    onChangeConfig({
      ...config,
      ...preset.defaultConfig
    });
  };

  const getPrimaryButtonLabel = () => {
    switch (serviceType) {
      case 'compress': return 'Compact to Fewer A4 Pages ⚡';
      case 'extract_text': return 'Extract Text & Tables Now ⚡';
      case 'translate': return 'Translate Document Now ⚡';
      case 'clean_format':
      default: return 'Clean & Beautify Document ⚡';
    }
  };

  return (
    <div className="workspace-screen-container">
      <div className="workspace-layout-grid">

        {/* ── LEFT PANE: FILE PREVIEW & CHANGE FILE BUTTON ── */}
        <aside className="workspace-file-sidebar">
          <div className="file-summary-card">
            <div className="file-icon-badge">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>

            <div className="file-meta-group">
              <span className="file-name-text" title={file ? file.name : ''}>
                {file ? file.name : 'Selected Document.pdf'}
              </span>
              <span className="file-size-pill">
                {file ? formatBytes(file.size) : 'PDF Document'}
              </span>
            </div>

            <button
              type="button"
              className="btn-change-document"
              onClick={onResetFile}
              title="Upload a different PDF"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Change Document</span>
            </button>

            <div className="file-security-notice">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>100% Ephemeral • Auto-deleted after processing</span>
            </div>
          </div>
        </aside>

        {/* ── RIGHT PANE: CHOICE ARCHITECTURE & PRIMARY ACTION ── */}
        <main className="workspace-options-main">

          {/* 1. DOCUMENT GOAL PRESETS (Choice Architecture) */}
          <DocumentPresetPicker
            activePresetId={activePresetId}
            onSelectPreset={handleSelectPreset}
          />

          {/* 2. QUICK REFINEMENTS (Language, Ads, Page Range) */}
          <QuickSettingsToggles
            config={config}
            onChangeConfig={onChangeConfig}
          />

          {/* Optional Full Superpowers Tuner */}
          <div className="workspace-superpowers-toggle-wrap">
            <button
              type="button"
              className="btn-toggle-workspace-superpowers"
              onClick={() => setShowFullSuperpowers(!showFullSuperpowers)}
            >
              <span>{showFullSuperpowers ? '▲ Hide Full Superpowers' : '✨ Fine-Tune All Superpowers & Coaching Filters'}</span>
            </button>
            {showFullSuperpowers && (
              <div className="workspace-superpowers-drawer">
                <SuperpowersCustomizer
                  config={config}
                  onChangeConfig={onChangeConfig}
                  serviceType={serviceType}
                />
              </div>
            )}
          </div>

          {/* 3. PRIMARY ACTION EXECUTION BUTTON */}
          <div className="workspace-action-row">
            <button
              type="button"
              className="btn-execute-transformation"
              disabled={isProcessing}
              onClick={handleProcess}
            >
              <span className="btn-exec-label">{getPrimaryButtonLabel()}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
            <span className="execution-guarantee">
              Free • Takes ~20–30s • LaTeX formulas & tables guaranteed intact
            </span>
          </div>

        </main>

      </div>
    </div>
  );
}
