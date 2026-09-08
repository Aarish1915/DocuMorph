import React from 'react';

const LANGUAGE_MODES = [
  { id: 'auto', label: 'Auto (Hindi + English + Math)', desc: 'Keeps all languages and formulas cleanly formatted.' },
  { id: 'math+hindi', label: 'Math + Hindi', desc: 'Extracts Hindi notes and mathematical equations. Omits parallel English.' },
  { id: 'en+math', label: 'English + Math', desc: 'Extracts English notes and mathematical equations. Omits parallel Hindi.' },
  { id: 'only_hindi', label: 'Only Hindi', desc: 'Outputs pure Devanagari Hindi notes. Omits parallel English duplicates.' },
  { id: 'only_english', label: 'Only English', desc: 'Outputs pure English text. Omits parallel Hindi text.' },
  { id: 'only_math', label: 'Math Only', desc: 'Extracts only formulas, calculations, and mathematical equations.' },
];

export default function LanguageSelector({ languageMode = 'auto', onChange }) {
  const activeMode = languageMode || 'auto';
  const activeOption = LANGUAGE_MODES.find((m) => m.id === activeMode) || LANGUAGE_MODES[0];

  return (
    <div className="option-selector-block">
      <p className="insider-label">Select which languages and subjects to keep:</p>
      <div className="options-pills-grid">
        {LANGUAGE_MODES.map((mode) => {
          const isSelected = activeMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              className={`option-pill ${isSelected ? 'active' : ''}`}
              onClick={() => onChange(mode.id)}
            >
              {mode.label}
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
