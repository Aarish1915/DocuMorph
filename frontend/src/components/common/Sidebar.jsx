import React from 'react';
import { API_BASE } from '../../config';

export default function Sidebar({
  isOpen,
  onClose,
  jobHistory = [],
  loading = false,
  historyDates = [],
  selectedDate = null,
  onSelectDate,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
  onReprocess,
  onClearHistory,
}) {
  if (!isOpen) return null;

  const getServiceBadge = (type) => {
    switch (type) {
      case 'extract_text': return { label: 'Extract', color: '#0284c7', icon: '📋' };
      case 'translate': return { label: 'Translate', color: '#7c3aed', icon: '🌐' };
      case 'compress': return { label: 'Compress', color: '#059669', icon: '📉' };
      case 'clean_format':
      default: return { label: 'Clean', color: '#4f46e5', icon: '✨' };
    }
  };

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return 'All Documents';
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000);
    const yestStr = yesterday.toISOString().slice(0, 10);

    if (dateStr === todayStr) return 'Today';
    if (dateStr === yestStr) return 'Yesterday';

    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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
            <span className="sidebar-icon">📚</span>
            <div>
              <h3 className="sidebar-title">Processed Notes</h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>
                Live community &amp; user documents
              </p>
            </div>
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

        {/* Date Filter Bar */}
        {historyDates && historyDates.length > 0 && (
          <div className="history-date-filter-bar" style={{
            display: 'flex',
            gap: '6px',
            padding: '8px 16px',
            overflowX: 'auto',
            borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
            background: 'var(--surface-subtle, rgba(0,0,0,0.15))',
            scrollbarWidth: 'none'
          }}>
            <button
              type="button"
              onClick={() => onSelectDate && onSelectDate(null)}
              style={{
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                border: !selectedDate ? '1px solid var(--color-primary, #4f46e5)' : '1px solid var(--border-default, rgba(255,255,255,0.1))',
                background: !selectedDate ? 'var(--color-primary, #4f46e5)' : 'transparent',
                color: !selectedDate ? '#fff' : 'var(--text-secondary, #94a3b8)',
                whiteSpace: 'nowrap'
              }}
            >
              All Dates
            </button>
            {historyDates.map((item) => {
              const isSelected = selectedDate === item.date;
              return (
                <button
                  key={item.date}
                  type="button"
                  onClick={() => onSelectDate && onSelectDate(item.date)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    border: isSelected ? '1px solid var(--color-primary, #4f46e5)' : '1px solid var(--border-default, rgba(255,255,255,0.1))',
                    background: isSelected ? 'var(--color-primary, #4f46e5)' : 'transparent',
                    color: isSelected ? '#fff' : 'var(--text-secondary, #94a3b8)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {formatDateLabel(item.date)} ({item.count})
                </button>
              );
            })}
          </div>
        )}

        <div className="sidebar-content">
          {loading ? (
            <div className="history-skeleton">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton-line full"></div>
                  <div className="skeleton-line half"></div>
                </div>
              ))}
            </div>
          ) : jobHistory.length === 0 ? (
            <div className="history-empty-state">
              <div className="empty-icon">📂</div>
              <p className="empty-title">No documents found</p>
              <p className="empty-desc">
                {selectedDate ? `No notes were processed on ${selectedDate}.` : 'Processed documents appear here in real-time.'}
              </p>
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

                const jobDateStr = job.created_at ? job.created_at.slice(0, 10) : '';

                return (
                  <div key={job.id} className="history-item-card">
                    <div className="item-card-top">
                      <span 
                        className="item-service-badge" 
                        style={{ color: badge.color, backgroundColor: `${badge.color}15` }}
                      >
                        {badge.icon} {badge.label}
                      </span>
                      <span className="item-time">
                        {formatDateLabel(jobDateStr)} • {job.created_at ? new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>

                    <div className="item-filename" title={job.filename}>
                      📄 {job.filename}
                    </div>

                    <div className="item-card-footer">
                      <span className={`item-status-pill ${isSuccess ? 'success' : 'pending'}`}>
                        {isSuccess ? 'Completed' : job.status}
                      </span>

                      <div className="item-actions-group" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {onReprocess && (
                          <button
                            type="button"
                            className="item-reprocess-btn"
                            onClick={() => onReprocess(job.id)}
                            title="Re-queue this document for rapid reprocessing"
                            style={{
                              background: 'none',
                              border: '1px solid var(--border-subtle, rgba(255,255,255,0.15))',
                              borderRadius: 'var(--radius-xs, 4px)',
                              padding: '4px 8px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              color: 'var(--text-secondary, #94a3b8)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <span>🔄</span> Reprocess
                          </button>
                        )}

                        {isSuccess && downloadHref && (
                          <a
                            href={downloadHref}
                            download
                            className="item-download-link"
                            rel="noopener noreferrer"
                          >
                            Download ↗
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Load More Button for chunked pagination */}
              {hasMore && (
                <div style={{ textAlign: 'center', padding: '16px 0 24px 0' }}>
                  <button
                    type="button"
                    onClick={onLoadMore}
                    disabled={loadingMore}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      borderRadius: 'var(--radius-sm, 8px)',
                      border: '1px solid var(--border-default, rgba(255,255,255,0.15))',
                      background: 'var(--surface-subtle, rgba(255,255,255,0.04))',
                      color: 'var(--text-primary, #fff)',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: loadingMore ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {loadingMore ? 'Fetching more notes...' : '📥 Load More Notes'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {onClearHistory && jobHistory.length > 0 && (
          <div className="sidebar-footer">
            <button 
              type="button" 
              className="clear-history-btn" 
              onClick={onClearHistory}
            >
              Clear View
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
