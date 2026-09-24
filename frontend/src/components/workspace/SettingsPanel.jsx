import React, { useState } from 'react';
import StudentExamLanguageSelector from '../common/StudentExamLanguageSelector';

export default function SettingsPanel({
  tool,
  config = {},
  onChangeConfig,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const update = (key, val) => {
    onChangeConfig({ ...config, [key]: val });
  };

  const whiteningLevel = config.whitening_level || 'high';
  const cleanWatermarks = config.clean_watermarks !== false;
  const fixFormulas = config.fix_formulas !== false;
  const printMargins = config.print_margins === true;
  const compactMode = config.compact_mode || 'smart_dense';
  const imageDpi = config.image_dpi || '200';

  return (
    <div className="settings-accordion">
      <button
        type="button"
        className="settings-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)' }}>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span style={{ fontWeight: 600 }}>⚙️ Options &amp; Calibration</span>
          <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 400 }}>
            ({isOpen ? 'click to collapse' : 'smart defaults active'})
          </span>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 600 }}>
          {isOpen ? '▲ Hide' : '▼ Options'}
        </span>
      </button>

      {isOpen && (
        <div className="settings-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)', marginTop: '8px', border: '1px solid var(--border-subtle)' }}>
          {tool === 'clean_format' && (
            <>
              {/* Paper Brightness Level */}
              <div className="settings-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>Paper Brightness:</label>
                <div style={{ display: 'inline-flex', gap: '6px' }}>
                  {[
                    { id: 'natural', label: 'Natural' },
                    { id: 'high', label: 'Bright White' },
                    { id: 'ultra', label: 'Deep Clean' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`mini-pill ${whiteningLevel === p.id ? 'active' : ''}`}
                      onClick={() => update('whitening_level', p.id)}
                      disabled={disabled}
                      style={{
                        padding: '5px 12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        borderRadius: 'var(--radius-full)',
                        border: whiteningLevel === p.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                        background: whiteningLevel === p.id ? 'var(--accent-soft)' : 'var(--bg-surface)',
                        color: whiteningLevel === p.id ? 'var(--accent)' : 'var(--text-2)',
                        cursor: 'pointer'
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-1)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={cleanWatermarks}
                    onChange={(e) => update('clean_watermarks', e.target.checked)}
                    disabled={disabled}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <span>Erase coaching stamps &amp; ads</span>
                </label>

                {cleanWatermarks && (
                  <input
                    type="text"
                    placeholder="Specific words to erase: e.g. ALLEN, Sir Name (optional)"
                    value={config.spam_words || ''}
                    onChange={(e) => update('spam_words', e.target.value)}
                    disabled={disabled}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '12.5px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-surface)',
                      color: 'var(--text-1)'
                    }}
                  />
                )}

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-1)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={fixFormulas}
                    onChange={(e) => update('fix_formulas', e.target.checked)}
                    disabled={disabled}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <span>Protect math formulas</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-1)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={printMargins}
                    onChange={(e) => update('print_margins', e.target.checked)}
                    disabled={disabled}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <span>Add 12mm binding margin</span>
                </label>
              </div>

              {/* Language & Context Selector */}
              <StudentExamLanguageSelector
                selectedMode={config.doc_type || 'auto'}
                onChangeMode={(mode) => update('doc_type', mode)}
              />
            </>
          )}

          {tool === 'compress' && (
            <>
              {/* Compaction Mode Pills */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>Compaction Profile:</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {[
                    { id: 'smart_dense', label: '⚡ Smart Fit A4 (~48% paper saved)' },
                    { id: 'two_up', label: '📑 2 Pages / Sheet' },
                    { id: 'max_compression', label: '🗜️ Ultra Small MB' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => update('compact_mode', m.id)}
                      disabled={disabled}
                      style={{
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 600,
                        borderRadius: 'var(--radius-full)',
                        border: compactMode === m.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                        background: compactMode === m.id ? 'var(--accent-soft)' : 'var(--bg-surface)',
                        color: compactMode === m.id ? 'var(--accent)' : 'var(--text-2)',
                        cursor: 'pointer'
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Resolution */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>Image Resolution:</label>
                <div style={{ display: 'inline-flex', gap: '6px' }}>
                  {[
                    { id: '150', label: '150 DPI (Fast)' },
                    { id: '200', label: '200 DPI (Balanced)' },
                    { id: '300', label: '300 DPI (Print HD)' }
                  ].map((dpi) => (
                    <button
                      key={dpi.id}
                      type="button"
                      onClick={() => update('image_dpi', dpi.id)}
                      disabled={disabled}
                      style={{
                        padding: '5px 12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        borderRadius: 'var(--radius-full)',
                        border: imageDpi === dpi.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                        background: imageDpi === dpi.id ? 'var(--accent-soft)' : 'var(--bg-surface)',
                        color: imageDpi === dpi.id ? 'var(--accent)' : 'var(--text-2)',
                        cursor: 'pointer'
                      }}
                    >
                      {dpi.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duplicate & metadata toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-1)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={config.remove_duplicates !== false}
                    onChange={(e) => update('remove_duplicates', e.target.checked)}
                    disabled={disabled}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <span>Purge Blank / Duplicate Pages</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-1)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={config.strip_metadata !== false}
                    onChange={(e) => update('strip_metadata', e.target.checked)}
                    disabled={disabled}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <span>Strip Scanner Tracking Metadata</span>
                </label>
              </div>
            </>
          )}

          {tool === 'extract_text' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>Output Format:</label>
                <div style={{ display: 'inline-flex', gap: '6px' }}>
                  {[
                    { id: 'markdown', label: 'Markdown (.md with LaTeX & Tables)' },
                    { id: 'plain', label: 'Plain Text (.txt)' }
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => update('output_format', fmt.id)}
                      disabled={disabled}
                      style={{
                        padding: '5px 12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        borderRadius: 'var(--radius-full)',
                        border: (config.output_format || 'markdown') === fmt.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                        background: (config.output_format || 'markdown') === fmt.id ? 'var(--accent-soft)' : 'var(--bg-surface)',
                        color: (config.output_format || 'markdown') === fmt.id ? 'var(--accent)' : 'var(--text-2)',
                        cursor: 'pointer'
                      }}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-1)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={config.clean_watermarks !== false}
                    onChange={(e) => update('clean_watermarks', e.target.checked)}
                    disabled={disabled}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <span>Filter Watermarks &amp; Channel Promos</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-1)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={config.preserve_structure !== false}
                    onChange={(e) => update('preserve_structure', e.target.checked)}
                    disabled={disabled}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <span>Preserve Heading &amp; Outline Levels</span>
                </label>
              </div>
            </>
          )}

          {tool === 'translate' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>Target Language:</label>
                <select
                  value={config.to_language || 'Hindi'}
                  onChange={(e) => update('to_language', e.target.value)}
                  disabled={disabled}
                  style={{
                    padding: '6px 12px',
                    fontSize: '13px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-1)'
                  }}
                >
                  <option value="Hindi">Hindi (हिंदी)</option>
                  <option value="Tamil">Tamil (தமிழ்)</option>
                  <option value="Telugu">Telugu (తెలుగు)</option>
                  <option value="Marathi">Marathi (मराठी)</option>
                  <option value="Bengali">Bengali (বাংলা)</option>
                  <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                  <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                  <option value="Malayalam">Malayalam (മലയാളം)</option>
                  <option value="English">English</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-1)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={config.protect_math !== false}
                    onChange={(e) => update('protect_math', e.target.checked)}
                    disabled={disabled}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <span>Formula Shield (Lock LaTeX Math)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-1)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={config.protect_code !== false}
                    onChange={(e) => update('protect_code', e.target.checked)}
                    disabled={disabled}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <span>Preserve Code &amp; Chemistry Blocks</span>
                </label>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
