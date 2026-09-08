import React from 'react';
import { API_BASE } from '../../config';

export default function Sidebar({
  isOpen,
  onClose,
  jobHistory = [],
  loading = false,
}) {
  if (!isOpen) return null;

  const getServiceBadge = (type) => {
    switch (type) {
      case 'extract_text': return { label: 'Extract', color: '#0284c7' };
      case 'translate': return { label: 'Translate', color: '#7c3aed' };
      case 'compress': return { label: 'Compress', color: '#059669' };
      case 'clean_format':
      default: return { label: 'Clean', color: '#2563eb' };
    }
  };

  return (
    <div className="sidebar-backdrop" onClick={onClose}>
      <aside 
        className="sidebar-drawer" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Recent Documents History"
      >
        <div className="sidebar-header">
          <div className="sidebar-title-row">
            <span className="sidebar-icon">🕒</span>
            <h3 className="sidebar-title">Recent Documents</h3>
          </div>
          <button 
            type="button" 
            className="sidebar-close-btn" 
            onClick={onClose}
            aria-label="Close Sidebar"
          >
            ×
          </button>
        </div>

        <div className="sidebar-content">
          {loading ? (
            <div className="history-skeleton">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton-line full"></div>
                  <div className="skeleton-line half"></div>
                </div>
              ))}
            </div>
          ) : jobHistory.length === 0 ? (
            <div className="history-empty-state">
              <div className="empty-icon">📂</div>
              <p className="empty-title">No documents yet</p>
              <p className="empty-desc">Processed documents from this session will appear here.</p>
            </div>
          ) : (
            <div className="history-items-list">
              {jobHistory.map((job) => {
                const badge = getServiceBadge(job.service_type);
                const isSuccess = ['COMPLETED', 'Completed'].includes(job.status);
                const downloadHref = job.download_url 
                  ? `${API_BASE}${job.download_url}` 
                  : job.result_url 
                  ? `${API_BASE}${job.result_url}` 
                  : null;

                return (
                  <div key={job.id} className="history-item-card">
                    <div className="item-card-top">
                      <span 
                        className="item-service-badge" 
                        style={{ color: badge.color, backgroundColor: `${badge.color}15` }}
                      >
                        {badge.label}
                      </span>
                      <span className="item-time">
                        {new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="item-filename" title={job.filename}>
                      {job.filename}
                    </div>

                    <div className="item-card-footer">
                      <span className={`item-status-pill ${isSuccess ? 'success' : 'pending'}`}>
                        {isSuccess ? 'Completed' : job.status}
                      </span>

                      {isSuccess && downloadHref && (
                        <a
                          href={downloadHref}
                          download
                          className="item-download-link"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Download ↗
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
