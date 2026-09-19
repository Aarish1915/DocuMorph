import React, { useRef } from 'react';

function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default function DropZone({
  file,
  setFile,
  isDragging,
  setIsDragging,
  handleDrop,
}) {
  const fileInputRef = useRef(null);

  return (
    <div className="dropzone-section">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files?.[0]) setFile(e.target.files[0]);
        }}
      />

      {!file ? (
        <div
          className={`main-dropzone ${isDragging ? 'dragging' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          <div className="dropzone-inner-content">
            <div className="dropzone-action-pill">
              <span className="dropzone-icon">📂</span>
              <span className="dropzone-btn-text">Choose PDF File</span>
            </div>
            <p className="dropzone-sub-text">
              or drag &amp; drop your PDF here <span className="dropzone-limit">• up to 50MB</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="file-ready-card">
          <div className="file-ready-left">
            <div className="file-pdf-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div className="file-ready-details">
              <span className="file-ready-name">{file.name}</span>
              <span className="file-ready-meta">
                {formatBytes(file.size)} • PDF Ready
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn-change-file"
            onClick={(e) => {
              e.stopPropagation();
              setFile(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            title="Remove or choose another file"
          >
            ✕ Change
          </button>
        </div>
      )}
    </div>
  );
}
