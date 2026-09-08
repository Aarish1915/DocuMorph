import React from 'react';

const FORMAT_OPTIONS = [
  { id: 'markdown', label: 'Markdown (.md)', desc: 'Formatted with headings, bullet lists, tables, and LaTeX equations.' },
  { id: 'txt', label: 'Plain Text (.txt)', desc: 'Stripped of all markdown asterisks and code markers for pasting into Word.' },
  { id: 'json', label: 'Structured JSON (.json)', desc: 'Structured array of pages with metadata for developers and AI pipelines.' },
];

export default function FormatSelector({ outputFormat = 'markdown', onChange }) {
  const activeFormat = outputFormat || 'markdown';
  const activeOption = FORMAT_OPTIONS.find((f) => f.id === activeFormat) || FORMAT_OPTIONS[0];

  return (
    <div className="option-selector-block">
      <p className="insider-label">Select output file format:</p>
      <div className="options-pills-grid">
        {FORMAT_OPTIONS.map((f) => {
          const isSelected = activeFormat === f.id;
          return (
            <button
              key={f.id}
              type="button"
              className={`option-pill ${isSelected ? 'active' : ''}`}
              onClick={() => onChange(f.id)}
            >
              {f.label}
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
