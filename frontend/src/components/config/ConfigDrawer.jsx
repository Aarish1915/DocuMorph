import React, { useState } from 'react';
import AccordionCard from './AccordionCard';
import LanguageSelector from './LanguageSelector';
import DensitySelector from './DensitySelector';
import AdRemovalFilter from './AdRemovalFilter';
import PageRangeFilter from './PageRangeFilter';
import FormatSelector from './FormatSelector';

export default function ConfigDrawer({
  serviceType = 'clean_format',
  config = {},
  onChangeConfig,
  onClose,
}) {
  // Local state for which accordion cards are open
  const [openCards, setOpenCards] = useState({
    language: true,  // Language open by default
    density: false,  // Compaction density
    ads: false,      // Ad removal
    pages: false,    // Page selection
    format: false,   // Text export format
  });

  const toggle = (key) => {
    setOpenCards((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const update = (key, val) => {
    onChangeConfig({ ...config, [key]: val });
  };

  const getLanguageLabel = () => {
    const mode = config.language_mode || 'auto';
    switch (mode) {
      case 'only_hindi': return 'Only Hindi';
      case 'only_english': return 'Only English';
      case 'math+hindi': return 'Math + Hindi';
      case 'en+math': return 'English + Math';
      case 'only_math': return 'Math Only';
      default: return 'Auto (Hindi + English + Math)';
    }
  };

  const getDensityLabel = () => {
    const q = config.quality || 'balanced';
    switch (q) {
      case 'max': return 'Ultra-Dense (~60% space saved)';
      case 'high': return 'Standard Textbook';
      case 'bytes_only': return 'Shrink MB Only';
      default: return 'Compact A4 (~40% space saved)';
    }
  };

  const getPagesLabel = () => {
    if (config.page_range === 'custom') {
      return `Pages ${config.page_from || 1}–${config.page_to || 10}`;
    }
    return 'All pages';
  };

  const getFormatLabel = () => {
    return (config.output_format || 'markdown').toUpperCase();
  };

  return (
    <div className="config-drawer-container">
      <div className="drawer-header-info">
        <div className="drawer-header-left">
          <span className="drawer-title">Advanced Document Tuning (Optional)</span>
          <span className="drawer-subtitle">
            Smart defaults are active. Expand any card to fine-tune your output.
          </span>
        </div>
        {onClose && (
          <button type="button" className="btn-close-drawer" onClick={onClose}>
            Done Tuning ✓
          </button>
        )}
      </div>

      <div className="accordion-cards-list">
        {/* 1. Language & Subject Mode (Relevant to clean_format, translate, extract_text) */}
        <AccordionCard
          isOpen={openCards.language}
          onToggle={() => toggle('language')}
          icon={<span>🌐</span>}
          title="Language & Subject Mode"
          hint="Isolate Hindi, English, or retain mathematical formulas"
          activeBadge={getLanguageLabel()}
        >
          <LanguageSelector
            languageMode={config.language_mode}
            onChange={(val) => update('language_mode', val)}
          />
        </AccordionCard>

        {/* 2. Compaction Density (Relevant to clean_format, compress) */}
        {(serviceType === 'clean_format' || serviceType === 'compress') && (
          <AccordionCard
            isOpen={openCards.density}
            onToggle={() => toggle('density')}
            icon={<span>📉</span>}
            title="Page Compaction Density"
            hint="Control page margins and spacing to save physical printing paper"
            activeBadge={getDensityLabel()}
          >
            <DensitySelector
              quality={config.quality}
              onChange={(val) => update('quality', val)}
            />
          </AccordionCard>
        )}

        {/* 3. Text Export Format (Relevant to extract_text) */}
        {serviceType === 'extract_text' && (
          <AccordionCard
            isOpen={openCards.format}
            onToggle={() => toggle('format')}
            icon={<span>📋</span>}
            title="Output Text Format"
            hint="Choose Markdown, Plain Text, or Structured JSON"
            activeBadge={getFormatLabel()}
          >
            <FormatSelector
              outputFormat={config.output_format}
              onChange={(val) => update('output_format', val)}
            />
          </AccordionCard>
        )}

        {/* 4. Coaching Ad & Watermark Filter */}
        <AccordionCard
          isOpen={openCards.ads}
          onToggle={() => toggle('ads')}
          icon={<span>🛡</span>}
          title="Ad & Watermark Filter"
          hint="Remove academy banners, fees, and custom institute text"
          activeBadge={config.clean_watermarks !== false ? 'Auto-Filter On' : 'Filter Off'}
        >
          <AdRemovalFilter
            cleanWatermarks={config.clean_watermarks !== false}
            spamWords={config.spam_words || ''}
            onChangeClean={(val) => update('clean_watermarks', val)}
            onChangeSpamWords={(val) => update('spam_words', val)}
          />
        </AccordionCard>

        {/* 5. Page Range Selection */}
        <AccordionCard
          isOpen={openCards.pages}
          onToggle={() => toggle('pages')}
          icon={<span>📄</span>}
          title="Page Selection"
          hint="Process the whole document or extract specific pages"
          activeBadge={getPagesLabel()}
        >
          <PageRangeFilter
            pageRange={config.page_range || 'all'}
            pageFrom={config.page_from || 1}
            pageTo={config.page_to || 10}
            onChangeRange={(val) => update('page_range', val)}
            onChangeFrom={(val) => update('page_from', val)}
            onChangeTo={(val) => update('page_to', val)}
          />
        </AccordionCard>
      </div>
    </div>
  );
}
