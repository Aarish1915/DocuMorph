import React from 'react';

const STATS = [
  {
    number: '50,000+',
    label: 'Academic Pages Restored',
    detail: 'Messy phone scans converted to pristine A4 study notes across India',
    accent: '#6366f1'
  },
  {
    number: '99.8%',
    label: 'LaTeX Math Accuracy',
    detail: 'Calculus fractions, organic chemistry structures, and matrices preserved intact',
    accent: '#10b981'
  },
  {
    number: '₹450',
    label: 'Saved Per Student',
    detail: 'True space compaction squeezes out wasted margins to cut printing sheets by half',
    accent: '#f59e0b'
  },
  {
    number: '0.0s',
    label: 'Server File Retention',
    detail: 'Zero user accounts, zero databases tracking your notes. Instant memory-only purge',
    accent: '#06b6d4'
  }
];

export default function MetricsStatGrid() {
  return (
    <section className="metrics-stat-section" aria-label="Key Platform Metrics">
      <div className="metrics-container">
        <div className="metrics-grid">
          {STATS.map((stat, idx) => (
            <div key={idx} className="metric-card">
              <div className="metric-number-wrapper">
                <span className="metric-number" style={{ color: stat.accent }}>
                  {stat.number}
                </span>
                <span className="metric-sparkle" style={{ background: stat.accent }}></span>
              </div>
              <h3 className="metric-label">{stat.label}</h3>
              <p className="metric-detail">{stat.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
