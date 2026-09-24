import React, { useRef } from 'react';

export default function DropZone({
  file,
  setFile,
  isDragging,
  setIsDragging,
  disabled = false,
}) {
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf' || droppedFile.name.endsWith('.pdf')) {
        setFile(droppedFile);
      }
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        style={{ display: 'none' }}
        onChange={handleFileInput}
        disabled={disabled}
      />

      {file ? (
        <div className="selected-file-capsule">
          <div className="selected-file-left">
            <div className="selected-doc-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div className="selected-file-meta">
              <span className="selected-file-name" title={file.name}>
                {file.name}
              </span>
              <span className="selected-file-size">
                {file.isSample ? file.sampleSize : formatBytes(file.size)} • PDF Ready
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn-remove-selected"
            onClick={(e) => {
              e.stopPropagation();
              setFile(null);
            }}
            disabled={disabled}
            aria-label="Remove selected document"
            title="Remove file"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ) : (
        <div
          className={`dropzone-stage-card ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Drop your PDF here or click to browse files"
        >
          <div className="dropzone-graphic-box">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>

          <h2 className="dropzone-main-title">
            Drop your PDF study notes here, or <span className="browse-text">browse files</span>
          </h2>
          <p className="dropzone-meta-hint">
            Supports scans, multi-page PDFs &amp; lecture slides up to 50MB
          </p>

          <div className="dropzone-capability-row">
            <span className="dropzone-cap-pill">
              <span className="cap-pill-dot" /> Multi-page PDF
            </span>
            <span className="dropzone-cap-pill">
              <span className="cap-pill-dot" /> Scans &amp; Xerox
            </span>
            <span className="dropzone-cap-pill">
              <span className="cap-pill-dot" /> LaTeX &amp; Tables Intact
            </span>
            <span className="dropzone-cap-pill">
              <span className="cap-pill-dot" /> Max 50MB
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
