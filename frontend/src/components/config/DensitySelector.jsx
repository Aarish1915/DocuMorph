import React from 'react';

const DENSITY_OPTIONS = [
  { id: 'balanced', label: 'Compact A4 (Recommended)', desc: 'Condenses loose spacing and empty margins. Saves ~40% physical print pages.' },
  { id: 'max', label: 'Ultra-Dense (Print Saver)', desc: 'Maximum content packing (9pt font, 8mm margins). Saves ~60% physical print pages.' },
  { id: 'high', label: 'Standard Textbook', desc: 'Preserves standard 16mm book margins and 10pt typography.' },
  { id: 'bytes_only', label: 'Shrink MB Only', desc: 'Bypasses layout restructuring; shrinks PDF byte size without altering layout.' },
];

export default function DensitySelector({ quality = 'balanced', onChange }) {
  const activeMode = quality || 'balanced';
  const activeOption = DENSITY_OPTIONS.find((o) => o.id === activeMode) || DENSITY_OPTIONS[0];

  return (
    <div className="option-selector-block">
      <p className="insider-label">Choose your page compaction density:</p>
      <div className="options-pills-grid">
        {DENSITY_OPTIONS.map((opt) => {
          const isSelected = activeMode === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              className={`option-pill ${isSelected ? 'active' : ''}`}
              onClick={() => onChange(opt.id)}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      <p className="insider-note">
        ℹ {activeOption.desc}
      </p>
    </div>
  );
}
