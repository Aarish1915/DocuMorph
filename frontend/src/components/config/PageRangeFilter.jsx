import React from 'react';

export default function PageRangeFilter({
  pageRange = 'all',
  pageFrom = 1,
  pageTo = 10,
  onChangeRange,
  onChangeFrom,
  onChangeTo,
}) {
  const isCustom = pageRange === 'custom';

  return (
    <div className="option-selector-block">
      <p className="insider-label">Which pages would you like to process?</p>
      <div className="options-pills-grid">
        <button
          type="button"
          className={`option-pill ${!isCustom ? 'active' : ''}`}
          onClick={() => onChangeRange('all')}
        >
          All pages (Full document)
        </button>
        <button
          type="button"
          className={`option-pill ${isCustom ? 'active' : ''}`}
          onClick={() => onChangeRange('custom')}
        >
          Custom page range
        </button>
      </div>

      {isCustom && (
        <div className="range-inputs-row">
          <div className="input-group">
            <label>From page</label>
            <input
              type="number"
              min={1}
              value={pageFrom}
              onChange={(e) => onChangeFrom(Math.max(1, parseInt(e.target.value, 10) || 1))}
            />
          </div>
          <div className="input-group">
            <label>To page</label>
            <input
              type="number"
              min={pageFrom}
              value={pageTo}
              onChange={(e) => onChangeTo(Math.max(pageFrom, parseInt(e.target.value, 10) || pageFrom))}
            />
          </div>
        </div>
      )}
    </div>
  );
}
