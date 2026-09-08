import React from 'react';

export default function ToastContainer({ toasts = [] }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast-pill ${t.type}`}>
          <span className="toast-icon">
            {t.type === 'error' && '✕'}
            {t.type === 'success' && '✓'}
            {t.type === 'info' && 'ℹ'}
          </span>
          <span className="toast-text">{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
