import React from 'react';

const COMPACT_MODES = [
  { id: 'auto', label: '⚡ Auto (All / STEM)', desc: 'Detect language & preserve math' },
  { id: 'math+hindi', label: '📐 Hindi + Math', desc: 'हिंदी + गणित / JEE / NEET' },
  { id: 'only_english', label: '⚖️ English Only', desc: 'Standard text & notes' },
  { id: 'en+math', label: '🔬 STEM (En + Math)', desc: 'Pure science & formulas' },
];

export default function StudentExamLanguageSelector({
  languageMode,
  selectedMode,
  onChange,
  onChangeMode,
}) {
  const activeMode = languageMode || selectedMode || 'auto';
  const handleChange = onChange || onChangeMode || (() => {});

  return (
    <div className="compact-language-section">
      <span className="compact-lang-title">Language &amp; Context:</span>
      <div className="compact-lang-grid">
        {COMPACT_MODES.map((mode) => {
          const isActive = activeMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              className={`compact-lang-pill ${isActive ? 'active' : ''}`}
              onClick={() => handleChange(mode.id)}
              title={mode.desc}
            >
              <span className="compact-lang-pill-text">{mode.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
