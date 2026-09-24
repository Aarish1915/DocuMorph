import React from 'react';

export default function Header({
  step = 1,
  serviceTitle = 'Clean & Format',
  activeView = 'home',
  onNavigateView,
  onBack,
  onNewJob,
  onToggleHistory,
  historyCount = 0,
  appliedTheme = 'light',
  onToggleTheme,
  onOpenDonation,
}) {
  return (
    <header className="site-header">
      <div className="header-inner">
        {step === 1 ? (
          /* Step 1: Minimal Header */
          <div className="header-left">
            {activeView !== 'home' && (
              <button 
                type="button"
                className="back-button" 
                onClick={() => onNavigateView ? onNavigateView('home') : onNewJob()} 
                aria-label="Back to all tools"
                title="Back to All Tools"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              </button>
            )}
            <div 
              className="brand-logo" 
              onClick={() => onNavigateView ? onNavigateView('home') : onNewJob()} 
              role="button" 
              tabIndex={0}
              title="DocuMorph Home"
            >
              <div className="brand-icon-modern">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <defs>
                    <linearGradient id="dm-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="50%" stopColor="#4f46e5" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                  <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#dm-grad)" />
                  <path d="M7 7H12.5C14.9853 7 17 9.01472 17 11.5C17 13.9853 14.9853 16 12.5 16H7V7Z" stroke="#ffffff" strokeWidth="2.2" strokeLinejoin="round" />
                  <circle cx="15.5" cy="8.5" r="1.5" fill="#34d399" />
                </svg>
              </div>
              <span className="brand-name">DocuMorph <span className="brand-badge-ai">AI</span></span>
            </div>
          </div>
        ) : (
          /* Step 2-4: Cockpit & Back Header */
          <div className="header-left">
            <button 
              type="button"
              className="back-button" 
              onClick={onBack} 
              aria-label={step === 4 ? "Back to all tools" : "Go back to previous step"}
              title={step === 4 ? "Back to Tools" : "Back"}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>
            <div className="step-title-group">
              <span className="service-heading">{serviceTitle}</span>
              {step === 4 ? (
                <span className="cockpit-status-badge">
                  <span className="cockpit-status-dot"></span>
                  <span>AI Transformation Cockpit</span>
                </span>
              ) : (
                <span className="step-indicator-text">Step {step} of 4</span>
              )}
            </div>
          </div>
        )}

        {/* Desktop Tool Navigation */}
        {step === 1 && onNavigateView && (
          <nav className="header-nav-tools" aria-label="Tool Navigation">
            <button
              type="button"
              className={`nav-tool-link ${activeView === 'home' ? 'active' : ''}`}
              onClick={() => onNavigateView('home')}
            >
              All Tools
            </button>
            <button
              type="button"
              className={`nav-tool-link ${activeView === 'clean' ? 'active' : ''}`}
              onClick={() => onNavigateView('clean')}
            >
              <span>✨</span> Clean &amp; Format
            </button>
            <button
              type="button"
              className={`nav-tool-link ${activeView === 'compress' ? 'active' : ''}`}
              onClick={() => onNavigateView('compress')}
            >
              <span>📉</span> Compress
            </button>
            <button
              type="button"
              className={`nav-tool-link ${activeView === 'extract' ? 'active' : ''}`}
              onClick={() => onNavigateView('extract')}
            >
              <span>📋</span> Extract
            </button>
            <button
              type="button"
              className={`nav-tool-link ${activeView === 'translate' ? 'active' : ''}`}
              onClick={() => onNavigateView('translate')}
            >
              <span>🌐</span> Translate
            </button>
            <button
              type="button"
              className={`nav-tool-link ${activeView === 'backers' ? 'active' : ''}`}
              onClick={() => onNavigateView('backers')}
            >
              <span>🏆</span> Backers
            </button>
          </nav>
        )}

        <div className="header-right">
          {step > 1 && step < 4 && (
            /* 4-dash Progress Bar only on intermediate wizard steps */
            <div className="step-dash-bar" aria-label={`Step ${step} of 4`}>
              {[1, 2, 3, 4].map((dashStep) => (
                <div
                  key={dashStep}
                  className={`dash-segment ${dashStep <= step ? 'filled' : 'empty'}`}
                />
              ))}
            </div>
          )}

          {/* Theme Toggle (Sun / Moon) */}
          <button 
            type="button"
            className="header-icon-btn theme-toggle-btn" 
            onClick={onToggleTheme}
            title={appliedTheme === 'dark' ? 'Switch to Light theme' : 'Switch to Dark theme'}
            aria-label="Toggle light/dark theme"
          >
            {appliedTheme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          <button 
            type="button"
            className="header-action-btn history-header-btn" 
            onClick={onToggleHistory}
            title="Recent Document Transformations"
            aria-label={`Recent Jobs history (${historyCount})`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span className="btn-label">History</span>
            {historyCount > 0 && <span className="history-pill">{historyCount}</span>}
          </button>
        </div>
      </div>

      {/* Mobile Tool Navigation: All 4 tools fitted evenly across screen */}
      {step === 1 && onNavigateView && (
        <nav className="mobile-tool-scroller" aria-label="Mobile Tool Navigation">
          <button
            type="button"
            className={`mobile-nav-chip ${activeView === 'clean' ? 'active' : ''}`}
            onClick={() => onNavigateView('clean')}
          >
            <span>✨</span> Clean
          </button>
          <button
            type="button"
            className={`mobile-nav-chip ${activeView === 'compress' ? 'active' : ''}`}
            onClick={() => onNavigateView('compress')}
          >
            <span>📉</span> Compress
          </button>
          <button
            type="button"
            className={`mobile-nav-chip ${activeView === 'extract' ? 'active' : ''}`}
            onClick={() => onNavigateView('extract')}
          >
            <span>📋</span> Extract
          </button>
          <button
            type="button"
            className={`mobile-nav-chip ${activeView === 'translate' ? 'active' : ''}`}
            onClick={() => onNavigateView('translate')}
          >
            <span>🌐</span> Translate
          </button>
        </nav>
      )}
    </header>
  );
}
