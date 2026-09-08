import React from 'react';

export default function AdRemovalFilter({
  cleanWatermarks = true,
  spamWords = '',
  onChangeClean,
  onChangeSpamWords,
}) {
  return (
    <div className="option-selector-block">
      <div className="toggle-row-item">
        <label className="checkbox-toggle-label">
          <input
            type="checkbox"
            checked={cleanWatermarks}
            onChange={(e) => onChangeClean(e.target.checked)}
          />
          <span className="toggle-title">Auto-Remove Academy Fees, Helplines &amp; Watermarks</span>
        </label>
        <p className="insider-note">
          Silently deletes promotional watermarks, fees (e.g. ₹4,444/-), and coaching telegram handles.
        </p>
      </div>

      <div className="custom-spam-group">
        <label className="input-field-label">Custom phrases to delete (comma-separated):</label>
        <input
          type="text"
          className="text-input-field"
          placeholder="e.g. ABC Institute, Vishesh Sir, @mychannel"
          value={spamWords}
          onChange={(e) => onChangeSpamWords(e.target.value)}
        />
        <span className="input-field-hint">
          Any matched promotional phrases will be stripped from your output.
        </span>
      </div>
    </div>
  );
}
