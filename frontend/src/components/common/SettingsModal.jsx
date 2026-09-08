import React from 'react';

export default function SettingsModal({
  isOpen,
  onClose,
  customApiKey,
  setCustomApiKey,
  customPrompt,
  setCustomPrompt,
}) {
  if (!isOpen) return null;

  return (
    <div className="settings-modal-backdrop" onClick={onClose}>
      <div className="settings-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="settings-modal-header">
          <h3>Advanced Settings</h3>
          <button
            type="button"
            className="settings-modal-close"
            onClick={onClose}
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>
        <div className="settings-modal-body">
          <div className="settings-field">
            <label>Custom Gemini API Key</label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={customApiKey}
              onChange={(e) => setCustomApiKey(e.target.value)}
            />
            <span className="field-hint">Optional override for your own Google AI key.</span>
          </div>
          <div className="settings-field">
            <label>Custom Vision Prompt</label>
            <textarea
              rows={3}
              placeholder="e.g. Strictly transcribe formulas into LaTeX..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
            />
            <span className="field-hint">Inject custom instructions into the Vision extractor.</span>
          </div>
        </div>
        <div className="settings-modal-footer">
          <button
            type="button"
            className="btn-settings-save"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
