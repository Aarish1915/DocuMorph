import React from 'react';

export default function HeroSection() {
  return (
    <section className="hero-section">
      <div className="hero-headline-group">
        <div className="hero-pill-badge">
          <span className="badge-sparkle">✨</span>
          <span>Next-Gen Document Restoration Engine</span>
        </div>
        <h1 className="hero-title">
          Turn Messy, Ad-Filled PDFs into <span className="title-gradient">Book-Quality Notes</span>
        </h1>
        <p className="hero-description">
          Strip Telegram ads, diagonal watermarks, and photocopy smudges. Restore LaTeX formulas and compact 50-page phone scans into crisp, print-ready A4.
        </p>
      </div>
    </section>
  );
}
