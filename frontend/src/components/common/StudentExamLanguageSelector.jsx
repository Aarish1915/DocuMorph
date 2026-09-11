import React, { useState } from 'react';

const LANGUAGE_MODES = [
  {
    id: 'auto',
    badge: '🌐+📐',
    short: 'Dual + Math',
    title: 'Dual (Hindi + English) + Formulas',
    tip: 'Keeps both languages side-by-side with all math formulas.',
  },
  {
    id: 'en+math',
    badge: '🇬🇧+📐',
    short: 'En + Math',
    title: 'English + Maths (JEE / NEET / STEM)',
    tip: 'English notes + formulas. Omits duplicate Hindi translations to save paper.',
  },
  {
    id: 'math+hindi',
    badge: '🇮🇳+📐',
    short: 'Hi + Math',
    title: 'Hindi + Maths (हिंदी + गणित)',
    tip: 'Devanagari Hindi + formulas. Omits duplicate English paragraphs.',
  },
  {
    id: 'only_english',
    badge: '🇬🇧',
    short: 'English Only',
    title: 'Only English (Law, CLAT, Bare Acts)',
    tip: 'Clean English text + all formulas, reasoning math & tables. Strips photocopy shadows and duplicate Hindi.',
  },
  {
    id: 'only_hindi',
    badge: '🇮🇳',
    short: 'Hindi Only',
    title: 'Only Hindi (केवल हिंदी)',
    tip: 'Pure Hindi notes without parallel English text.',
  },
  {
    id: 'only_math',
    badge: '📐',
    short: 'Math Only',
    title: 'Only Maths & Formulas',
    tip: 'Extracts formulas, equations and problem sets only.',
  },
];

const EXAM_SHORTCUTS = [
  { label: 'JEE / NEET', mode: 'en+math' },
  { label: 'Law / CLAT', mode: 'only_english' },
  { label: 'UPSC / SSC', mode: 'auto' },
  { label: 'Hindi STEM', mode: 'math+hindi' },
];

export default function StudentExamLanguageSelector({
  languageMode = 'auto',
  onChange,
}) {
  const [showTip, setShowTip] = useState(false);
  const activeMode = languageMode || 'auto';
  const currentOpt = LANGUAGE_MODES.find((m) => m.id === activeMode) || LANGUAGE_MODES[0];

  return (
    <div className="compact-lang-selector">
      {/* Top row: Label + Exam quick presets + Info button */}
      <div className="compact-lang-header">
        <div className="compact-header-left">
          <span className="compact-lang-title">Language &amp; Formulas:</span>
          <div className="compact-exam-pills">
            {EXAM_SHORTCUTS.map((exam) => (
              <button
                key={exam.label}
                type="button"
                className={`compact-exam-chip ${activeMode === exam.mode ? 'active' : ''}`}
                onClick={() => onChange(exam.mode)}
                title={`Quick select for ${exam.label}`}
              >
                {exam.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className={`compact-info-btn ${showTip ? 'open' : ''}`}
          onClick={() => setShowTip(!showTip)}
          title="Why filter languages? Click to learn"
        >
          💡 Tip
        </button>
      </div>

      {/* Main compact pill selector */}
      <div className="compact-pills-row">
        {LANGUAGE_MODES.map((mode) => {
          const isSelected = activeMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              className={`compact-lang-pill ${isSelected ? 'selected' : ''}`}
              onClick={() => onChange(mode.id)}
              title={mode.title}
            >
              <span className="compact-pill-badge">{mode.badge}</span>
              <span className="compact-pill-text">{mode.short}</span>
            </button>
          );
        })}
      </div>

      {/* Micro-hint / Collapsible coaching notes guidance */}
      {showTip && (
        <div className="compact-tip-box">
          <span>
            💡 <strong>Coaching Notes Anti-Duplicate:</strong> Allen, Drishti IAS &amp; Resonance modules print English &amp; Hindi side-by-side. Selecting <strong>En+Math</strong> or <strong>Hi+Math</strong> cuts duplicate text and saves up to 40% paper!
          </span>
          <button
            type="button"
            className="compact-tip-close"
            onClick={() => setShowTip(false)}
          >
            ×
          </button>
        </div>
      )}

      {/* Active Selection Subtitle (1 clean line) */}
      {!showTip && (
        <div className="compact-active-indicator">
          <span className="active-dot" />
          <span className="active-label">{currentOpt.title}:</span>
          <span className="active-desc">{currentOpt.tip}</span>
        </div>
      )}
    </div>
  );
}
