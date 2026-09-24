import React, { useState } from 'react';

export default function Header({
  activeView = 'home',
  onNavigateView,
  appliedTheme = 'light',
  onToggleTheme,
  onOpenDonation,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isHome = activeView === 'home';

  const handleNav = (view) => {
    setMobileMenuOpen(false);
    onNavigateView(view);
  };

  const scrollToSection = (sectionId) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      onNavigateView('home');
      setTimeout(() => {
        const target = document.getElementById(sectionId);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <header className="app-header">
      <div className="header-inner">
        {/* Left: Brand Logo & Title */}
        <div className="header-brand-wrap">
          {!isHome && (
            <button
              type="button"
              className="btn-header-back"
              onClick={() => handleNav('home')}
              aria-label="Back to document tools"
              title="Back to Document Tools"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span className="btn-back-label">Workspace</span>
            </button>
          )}

          <div
            className="header-brand"
            onClick={() => handleNav('home')}
            role="button"
            tabIndex={0}
            title="DocuMorph AI Studio"
          >
            <div className="brand-icon-box">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <path d="m10 13-2 2 2 2" />
                <path d="m14 17 2-2-2-2" />
              </svg>
            </div>
            <span className="brand-title">DocuMorph</span>
            <span className="brand-badge">ACADEMIC</span>
          </div>
        </div>

        {/* Center: Desktop Navigation Bar */}
        <nav className="header-desktop-nav" aria-label="Main Navigation">
          <button
            type="button"
            className={`nav-link-btn ${isHome ? 'active' : ''}`}
            onClick={() => handleNav('home')}
          >
            Tools
          </button>
          <button
            type="button"
            className="nav-link-btn"
            onClick={() => scrollToSection('scoreboard')}
          >
            Proof Scoreboard
          </button>
          <button
            type="button"
            className="nav-link-btn"
            onClick={() => scrollToSection('how-it-works')}
          >
            3-Pass Engine
          </button>
          <button
            type="button"
            className={`nav-link-btn ${activeView === 'community' ? 'active' : ''}`}
            onClick={() => handleNav('community')}
          >
            Wall of Fame
          </button>
          <button
            type="button"
            className={`nav-link-btn ${activeView === 'faq' ? 'active' : ''}`}
            onClick={() => handleNav('faq')}
          >
            FAQ
          </button>
        </nav>

        {/* Right: Header Action Buttons */}
        <div className="header-actions">
          <button
            type="button"
            className="btn-header-fuel"
            onClick={onOpenDonation}
            title="Fuel Server Costs — 100% Student Free"
          >
            <span className="fuel-icon">☕</span>
            <span className="fuel-label">Fuel Server</span>
            <span className="fuel-amount-badge">₹20</span>
          </button>

          <button
            type="button"
            className="btn-header-theme"
            onClick={onToggleTheme}
            aria-label={`Switch to ${appliedTheme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${appliedTheme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {appliedTheme === 'dark' ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="btn-header-mobile-toggle"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="header-mobile-drawer">
          <nav className="mobile-drawer-nav">
            <button
              type="button"
              className={`mobile-nav-item ${isHome ? 'active' : ''}`}
              onClick={() => handleNav('home')}
            >
              <span>📄 Document Workspace</span>
            </button>
            <button
              type="button"
              className="mobile-nav-item"
              onClick={() => scrollToSection('scoreboard')}
            >
              <span>🏆 Empirical Scoreboard</span>
            </button>
            <button
              type="button"
              className="mobile-nav-item"
              onClick={() => scrollToSection('how-it-works')}
            >
              <span>🧠 The 3-Pass Engine</span>
            </button>
            <button
              type="button"
              className={`mobile-nav-item ${activeView === 'community' ? 'active' : ''}`}
              onClick={() => handleNav('community')}
            >
              <span>⭐ Wall of Fame</span>
            </button>
            <button
              type="button"
              className={`mobile-nav-item ${activeView === 'faq' ? 'active' : ''}`}
              onClick={() => handleNav('faq')}
            >
              <span>💡 Frequently Asked Questions</span>
            </button>
            <button
              type="button"
              className={`mobile-nav-item ${activeView === 'privacy' ? 'active' : ''}`}
              onClick={() => handleNav('privacy')}
            >
              <span>🔒 Zero-Retention Privacy</span>
            </button>
            <div className="mobile-drawer-footer">
              <button
                type="button"
                className="btn-mobile-fuel"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenDonation();
                }}
              >
                <span>☕ Fuel Server (₹20 Chai)</span>
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
