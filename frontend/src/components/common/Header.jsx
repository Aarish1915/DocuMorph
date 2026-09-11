import React from 'react';

export default function Header({
  step = 1,
  serviceTitle = 'Clean & Format',
  activeView = 'home',
  activeNode = null,
  onNavigateView,
  onBack,
  onNewJob,
  onToggleHistory,
  historyCount = 0,
  onToggleSettings,
  appliedTheme = 'light',
  onToggleTheme,
}) {
  return (
    <header className="site-header">
      <div className="header-inner">
        {step === 1 ? (
          /* Step 1: Minimal Header */
          <div className="header-left">
            {activeView !== 'home' && (
              <button 
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
            <div className="brand-logo" onClick={() => onNavigateView ? onNavigateView('home') : onNewJob()} role="button" tabIndex={0}>
              <div className="brand-icon">D</div>
              <span className="brand-name">DocuMorph</span>
            </div>
          </div>
        ) : (
          /* Step 2-4: Back Header */
          <div className="header-left">
            <button 
              className="back-button" 
              onClick={onBack} 
              aria-label="Go back to previous step"
              title="Back"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>
            <div className="step-title-group">
              <span className="service-heading">{serviceTitle}</span>
              <span className="step-indicator-text">Step {step} of 4</span>
            </div>
          </div>
        )}

        {step === 1 && onNavigateView && (
          <nav className="header-nav-tools" aria-label="Tool Navigation">
            <button
              className={`nav-tool-link ${activeView === 'home' ? 'active' : ''}`}
              onClick={() => onNavigateView('home')}
            >
              All Tools
            </button>
            <button
              className={`nav-tool-link ${activeView === 'clean' ? 'active' : ''}`}
              onClick={() => onNavigateView('clean')}
            >
              <span>✨</span> Clean
            </button>
            <button
              className={`nav-tool-link ${activeView === 'compress' ? 'active' : ''}`}
              onClick={() => onNavigateView('compress')}
            >
              <span>📉</span> Compress
            </button>
            <button
              className={`nav-tool-link ${activeView === 'extract' ? 'active' : ''}`}
              onClick={() => onNavigateView('extract')}
            >
              <span>📋</span> Extract
            </button>
            <button
              className={`nav-tool-link ${activeView === 'translate' ? 'active' : ''}`}
              onClick={() => onNavigateView('translate')}
            >
              <span>🌐</span> Translate
            </button>
          </nav>
        )}

        <div className="header-right">
          {step > 1 && (
            /* 4-dash Progress Bar on Steps 2-4 */
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

          {/* Quick Action Buttons */}
          <button 
            className="header-action-btn" 
            onClick={onToggleHistory}
            title="Recent Jobs"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span className="btn-label">History</span>
            {historyCount > 0 && <span className="history-pill">{historyCount}</span>}
          </button>

          <button 
            className="header-icon-btn" 
            onClick={onToggleSettings}
            title="Settings & API Key"
            aria-label="Settings"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
