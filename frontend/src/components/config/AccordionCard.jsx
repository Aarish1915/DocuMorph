import React from 'react';

export default function AccordionCard({
  isOpen,
  onToggle,
  icon,
  title,
  hint,
  activeBadge,
  children,
}) {
  return (
    <div className={`accordion-card ${isOpen ? 'open' : ''}`}>
      <div className="accordion-card-header" onClick={onToggle} role="button" tabIndex={0}>
        <div className="accordion-card-left">
          {icon && <div className="accordion-card-icon">{icon}</div>}
          <div className="accordion-card-title-group">
            <span className="accordion-card-title">{title}</span>
            {hint && <span className="accordion-card-hint">{hint}</span>}
          </div>
        </div>
        <div className="accordion-card-right">
          {activeBadge && <span className="accordion-active-badge">{activeBadge}</span>}
          <svg
            className="accordion-chevron-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="accordion-card-body">
          {children}
        </div>
      )}
    </div>
  );
}
