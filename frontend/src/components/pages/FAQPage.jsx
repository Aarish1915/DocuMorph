import React, { useState } from 'react';

const FAQ_DATA = [
  {
    q: "Is using DocuMorph legal for student notes and coaching materials?",
    a: "Yes. DocuMorph is 100% legal for students and educators. Under Section 52(1)(a) of the Indian Copyright Act, 1957 and US Fair Use doctrine (17 U.S.C. § 107), students are legally entitled to 'fair dealing for private study, personal use, and research'. DocuMorph functions as a private accessibility and print-efficiency tool (like a digital photocopier or highlighter). We never host, sell, or publicly distribute any uploaded content.",
    tag: "Legal & Copyright"
  },
  {
    q: "Are my uploaded PDF files or personal study notes stored on your servers?",
    a: "No. DocuMorph operates on a strict Zero-Retention Privacy Architecture compliant with India's DPDP Act, 2023 and EU GDPR. All uploaded files, temporary page images, and compiled PDFs are processed entirely in ephemeral memory and automatically purged from our servers within 30 minutes. We never store, index, or use your notes to train AI models.",
    tag: "Data Privacy"
  },
  {
    q: "How does DocuMorph remove watermarks without damaging mathematical equations?",
    a: "DocuMorph uses a multi-layered Universal Math Siphon and sub-pixel text boundary collision detection. Rather than blurring the page, our layout engine distinguishes between decorative watermark overlays and genuine mathematical symbols, protecting inline and display LaTeX ($...$ and $$...$$) formulas, fractions, matrices, and chemical subscripts completely intact.",
    tag: "Math & Science"
  },
  {
    q: "Can coaching institutes (like Allen, PW, or Resonance) ban me for cleaning notes?",
    a: "No. Coaching institutes cannot ban students for post-processing study materials for their own personal revision or printing. Deleting background promotional banners and increasing paper brightness is the digital equivalent of using physical white-out on paper you own. As long as you do not sell or publicly republish the materials, your personal use is protected by law.",
    tag: "Student Rights"
  },
  {
    q: "How does the Page Compaction feature reduce Xerox and printing costs?",
    a: "Standard coaching slides and digital PDFs have massive whitespace gaps and large margins. DocuMorph re-structures questions, exercises, and diagrams into clean, publication-grade dual-column A4 pages. This typically condenses a 50-page lecture slide deck into 20–25 compact pages, cutting physical Xerox printing costs by 50% to 60%.",
    tag: "Printing & Savings"
  },
  {
    q: "Does DocuMorph work seamlessly on iPhone, iPad, and Android devices?",
    a: "Yes. DocuMorph features a native Web Share API and universal RFC-compliant file stream integration. When you tap Download, files save directly into your phone's native Files or Downloads folder without requiring third-party apps or iCloud Drive prompts.",
    tag: "Mobile Compatibility"
  },
  {
    q: "How does multi-language translation protect scientific terms and formulas?",
    a: "When translating English notes into Hindi, Marathi, Bengali, or other regional languages, DocuMorph applies a strict Formula Shield. All scientific symbols, variable names, physical constants, SI units (km, m/s), and LaTeX equations remain untouched, ensuring textbook accuracy for competitive exams like JEE, NEET, and UPSC.",
    tag: "Translation"
  },
  {
    q: "How can copyright owners submit a takedown request or notice?",
    a: "DocuMorph respects intellectual property rights and adheres to the DMCA (Digital Millennium Copyright Act) and Rule 3(2) of the Indian IT Intermediary Guidelines. Although DocuMorph does not host public files, intellectual property owners may contact our designated Grievance Officer at legal@documorph.com for expedited assistance.",
    tag: "Grievance & Redressal"
  }
];

export default function FAQPage({ onNavigateHome }) {
  const [openIndex, setOpenIndex] = useState(null);
  const [selectedTag, setSelectedTag] = useState('All');

  const tags = ['All', 'Legal & Copyright', 'Data Privacy', 'Math & Science', 'Student Rights', 'Printing & Savings'];

  const filteredFaqs = selectedTag === 'All' 
    ? FAQ_DATA 
    : FAQ_DATA.filter(f => f.tag === selectedTag);

  return (
    <div className="tool-page-container" style={{ maxWidth: '860px', margin: '0 auto', padding: '32px 16px' }}>
      {/* Top back navigation */}
      <nav aria-label="Breadcrumb" className="tool-page-breadcrumb">
        <button
          type="button"
          onClick={onNavigateHome}
          className="breadcrumb-back-btn"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>Back to All Tools</span>
        </button>
        <span className="breadcrumb-separator" aria-hidden="true">/</span>
        <span className="breadcrumb-current" aria-current="page">Frequently Asked Questions</span>
      </nav>

      {/* Header */}
      <div style={{ textAlign: 'center', margin: '24px 0 32px 0' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--color-primary)', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>
          <span>💡</span>
          <span>Knowledge &amp; Legal Answers</span>
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0 0 12px 0', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          Answers to Everything You Need to Know
        </h1>
        <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', maxWidth: '620px', margin: '0 auto', lineHeight: '1.6' }}>
          Direct, honest answers about copyright, data privacy, mathematical accuracy, and how DocuMorph works for students worldwide.
        </p>
      </div>

      {/* Filter Chips */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '28px' }}>
        {tags.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setSelectedTag(t)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: selectedTag === t ? '1.5px solid var(--color-primary)' : '1px solid var(--border-default)',
              background: selectedTag === t ? 'var(--color-primary)' : 'var(--surface-card)',
              color: selectedTag === t ? '#ffffff' : 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Q&A Accordion (AEO Optimized) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px' }}>
        {filteredFaqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              style={{
                background: 'var(--surface-card, #ffffff)',
                border: isOpen ? '1.5px solid var(--color-primary)' : '1px solid var(--border-default)',
                borderRadius: '12px',
                overflow: 'hidden',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                boxShadow: isOpen ? '0 4px 14px rgba(79, 70, 229, 0.08)' : 'var(--shadow-subtle)'
              }}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  padding: '18px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '14px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '18px', flexShrink: 0 }}>❓</span>
                  <h3 style={{ fontSize: '1.02rem', fontWeight: 650, color: 'var(--text-main)', margin: 0 }}>
                    {faq.q}
                  </h3>
                </div>
                <span style={{ fontSize: '18px', color: 'var(--text-muted)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>
                  ▾
                </span>
              </button>

              {isOpen && (
                <div style={{ padding: '0 20px 20px 50px', borderTop: '1px solid var(--border-subtle)' }}>
                  <p style={{ fontSize: '0.94rem', lineHeight: '1.65', color: 'var(--text-secondary)', margin: '14px 0 0 0' }}>
                    {faq.a}
                  </p>
                  <div style={{ marginTop: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', background: 'var(--surface-subtle)', color: 'var(--color-primary)', border: '1px solid var(--border-subtle)' }}>
                      Topic: {faq.tag}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Safety & Compliance Assurance Box */}
      <div style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border-default)', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚖️</div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 750, color: 'var(--text-main)', margin: '0 0 8px 0' }}>
          Statutory Compliance Guarantee
        </h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto 16px auto', lineHeight: '1.6' }}>
          DocuMorph adheres strictly to the Digital Personal Data Protection Act, 2023 (DPDP Act, India), the Information Technology Act, 2000, and the US Digital Millennium Copyright Act. All document processing is temporary and private.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={onNavigateHome}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              background: 'var(--color-primary)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 600,
              fontSize: '13.5px',
              cursor: 'pointer'
            }}
          >
            Clean Your Notes Now
          </button>
        </div>
      </div>
    </div>
  );
}
