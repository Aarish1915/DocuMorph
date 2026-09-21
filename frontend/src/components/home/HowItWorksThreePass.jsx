import React from 'react';

const STEPS = [
  {
    step: '01',
    title: 'Pre-Flight Layout Profiling',
    subtitle: 'Geometric & Font Median Analysis',
    desc: 'Instantly scans page DPI, detects KrutiDev / Devanagari encodings, and maps diagram boundaries to prevent text collision.',
    tag: 'Local & Fast',
    icon: '⚡'
  },
  {
    step: '02',
    title: 'Formula Siphon & AI Vision',
    subtitle: 'LaTeX Math Delimiter Protection',
    desc: 'Separates prose from mathematical expressions ($$ ... $$) so calculus, physics formulas, and matrices never get squashed or deleted.',
    tag: 'Formula Safe',
    icon: '🧠'
  },
  {
    step: '03',
    title: 'Vector Typesetting & Compaction',
    subtitle: 'Print-Ready A4 Book Quality',
    desc: 'Renders crisp vector typography with MS Word-grade justification, squeezing wasted whitespace to save up to 50% printing sheets.',
    tag: 'Xerox Optimized',
    icon: '🖨️'
  }
];

export default function HowItWorksThreePass() {
  return (
    <section className="how-it-works-section" aria-label="3-Pass Engine Workflow">
      <div className="how-container">
        <div className="how-header">
          <div className="how-pill">
            <span className="how-pill-dot"></span>
            <span>The 3-Pass Engine</span>
          </div>
          <h2 className="how-title">Engineered Different. Not Just Another OCR.</h2>
          <p className="how-subtitle">
            Most tools dump raw OCR into an unformatted text file. DocuMorph executes a 3-stage mathematical compilation pipeline.
          </p>
        </div>

        <div className="how-grid">
          {STEPS.map((item, idx) => (
            <div key={idx} className="how-card">
              <div className="how-card-top">
                <span className="how-step-num">{item.step}</span>
                <span className="how-tag">{item.tag}</span>
              </div>
              <div className="how-icon-wrapper">
                <span className="how-icon">{item.icon}</span>
              </div>
              <h3 className="how-card-title">{item.title}</h3>
              <div className="how-card-subtitle">{item.subtitle}</div>
              <p className="how-card-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
