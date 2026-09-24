import React from 'react';

export default function ProcessButton({
  hasFile,
  isProcessing,
  onClick,
}) {
  return (
    <button
      type="button"
      className="btn-process"
      onClick={onClick}
      disabled={!hasFile || isProcessing}
    >
      {isProcessing ? (
        <>
          <span className="spinner" />
          <span>Processing Document...</span>
        </>
      ) : hasFile ? (
        <>
          <span>▶</span>
          <span>Process Document</span>
        </>
      ) : (
        <span>Select or Drop a PDF to Begin</span>
      )}
    </button>
  );
}
