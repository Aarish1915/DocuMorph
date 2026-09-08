import React from 'react';

export const SERVICES = [
  {
    id: 'clean_format',
    title: 'Clean & Beautify',
    badge: 'Recommended',
    description: 'Fix messy scans, restore tables, math & make neat study notes',
    icon: '✨'
  },
  {
    id: 'compress',
    title: 'Compact to Fewer Pages',
    badge: 'Save 40-60%',
    description: 'Remove empty space, ads & borders to fit into fewer readable A4 pages',
    icon: '📉'
  },
  {
    id: 'extract_text',
    title: 'Copy Text & Tables',
    badge: 'Export',
    description: 'Extract text & formulas to copy into Word, Notion, or your notes',
    icon: '📋'
  },
  {
    id: 'translate',
    title: 'Translate Language',
    badge: 'Bilingual',
    description: 'Translate notes to Hindi, English & more without breaking math',
    icon: '🌐'
  }
];

export default function ServiceTabs({ selectedService = 'clean_format', onSelectService }) {
  return (
    <div className="service-tabs-wrapper">
      <span className="tabs-heading-label">Select Goal:</span>
      <div className="service-tabs-row" role="tablist">
        {SERVICES.map((s) => {
          const isSelected = selectedService === s.id;
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`service-tab-btn ${isSelected ? 'active' : ''}`}
              onClick={() => onSelectService(s.id)}
            >
              <span className="tab-icon">{s.icon}</span>
              <span className="tab-title">{s.title}</span>
              {s.badge && <span className="tab-badge">{s.badge}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
