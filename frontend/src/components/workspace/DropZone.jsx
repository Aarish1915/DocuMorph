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
          className={`modern-dropzone ${isDragging ? 'is-dragging' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
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
          <div className="dropzone-content">
            <div className="dropzone-icon-container">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                <path d="M12 12v9" />
                <path d="m8 16 4-4 4 4" />
              </svg>
            </div>
            <h3 className="dropzone-heading">
              Drop your PDF here, or <span className="dropzone-highlight">browse</span>
            </h3>
            <p className="dropzone-description">
              Scanned notes, photocopies &amp; study materials up to 50MB
            </p>
            <div className="dropzone-btn-row">
              <button
                type="button"
                className="dropzone-browse-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <span>📂</span>
                <span>Choose PDF File</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="file-capsule-card">
          <div className="file-capsule-left">
            <div className="file-pdf-badge">PDF</div>
            <div className="file-capsule-meta">
              <span className="file-capsule-name" title={file.name}>{file.name}</span>
              <span className="file-size-tag font-mono">{formatBytes(file.size)}</span>
            </div>
          </div>
          <button
            type="button"
            className="btn-capsule-change"
            onClick={(e) => {
              e.stopPropagation();
              setFile(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            title="Choose a different PDF"
            aria-label="Remove or change PDF"
          >
            ✕ Change
          </button>
        </div>
      )}
    </div>
  );
}
