import { useState, useEffect, useRef } from 'react';
import './DesignTokens.css';
import './index.css';
import { API_BASE, probeBackend, getStoredConfig } from './config';

import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import SettingsModal from './components/common/SettingsModal';
import AdminDashboardModal from './components/admin/AdminDashboardModal';
import ToastContainer from './components/common/ToastContainer';
import HeroSection from './components/hero/HeroSection';
import ProgressCard from './components/progress/ProgressCard';

import ToolDirectory from './components/pages/ToolDirectory';
import CleanFormatPage from './components/pages/CleanFormatPage';
import CompressPage from './components/pages/CompressPage';
import ExtractTextPage from './components/pages/ExtractTextPage';
import TranslatePage from './components/pages/TranslatePage';
import InteractiveProofViewer from './components/common/InteractiveProofViewer';
import PrivacyModal from './components/legal/PrivacyModal';
import TermsModal from './components/legal/TermsModal';
import CookieConsent from './components/common/CookieConsent';
import NotFoundView from './components/common/NotFoundView';

const STAGES = [
  { icon: '📄', label: 'Reading',    desc: 'Loading PDF' },
  { icon: '🔍', label: 'Layout',     desc: 'Detecting structure' },
  { icon: '🧠', label: 'AI Reading', desc: 'Extracting text' },
  { icon: 'T',  label: 'Formatting', desc: 'Cleaning output' },
  { icon: '✅', label: 'Done',       desc: 'Building file' },
];

function getPipelineStage(status, progress) {
  if (status === 'QUEUED') return 0;
  if (progress <= 15) return 0;
  if (progress <= 35) return 1;
  if (progress <= 65) return 2;
  if (progress <= 90) return 3;
  return 4;
}

const DEFAULT_CONFIGS = {
  clean_format: {
    doc_type: 'auto',
    images: 'keep',
    fix_formulas: true,
    page_range: 'all',
    page_from: 1,
    page_to: 10,
  },
  extract_text: {
    output_format: 'markdown',
    preserve_structure: true,
    clean_watermarks: true,
    fix_spacing: true,
    page_range: 'all',
    page_from: 1,
    page_to: 10,
  },
  translate: {
    from_language: 'auto',
    to_language: 'English',
    preserve_formatting: true,
    protect_math: true,
    protect_code: true,
    page_range: 'all',
    page_from: 1,
    page_to: 10,
  },
  compress: {
    quality: 'balanced',
    images: 'compress',
    remove_duplicates: true,
    strip_metadata: true,
    page_range: 'all',
    page_from: 1,
    page_to: 10,
  },
};

export default function App() {
  // Wizard Steps: 1 (Select), 2 (Configure), 3 (Upload), 4 (Progress/Done)
  const [step, setStep] = useState(1);
  const [serviceType, setServiceType] = useState('clean_format');
  const [configs, setConfigs] = useState(DEFAULT_CONFIGS);

  // File & Drag state
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Execution & Job state
  const [jobStatus, setJobStatus] = useState(null);
  const [jobHistory, setJobHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  // Advanced settings & Admin Dashboard (Route Segregation)
  const [showSettings, setShowSettings] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      return hash === 'settings' || window.location.pathname === '/settings';
    }
    return false;
  });
  const [showAdmin, setShowAdmin] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      return hash === 'admin' || window.location.pathname === '/admin';
    }
    return false;
  });
  const [customApiKey, setCustomApiKey] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [toasts, setToasts] = useState([]);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  // Theme Engine (System auto-detect + localStorage + manual toggle)
  const [themeMode, setThemeMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('documorph_theme') || 'system';
    }
    return 'system';
  });

  const [appliedTheme, setAppliedTheme] = useState('light');

  useEffect(() => {
    const updateTheme = () => {
      let isDark = false;
      if (themeMode === 'dark') {
        isDark = true;
      } else if (themeMode === 'light') {
        isDark = false;
      } else {
        isDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      const active = isDark ? 'dark' : 'light';
      setAppliedTheme(active);
      document.documentElement.setAttribute('data-theme', active);
    };

    updateTheme();

    if (themeMode === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => updateTheme();
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [themeMode]);

  const toggleTheme = () => {
    const next = appliedTheme === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('documorph_theme', next);
    }
  };

  // Dedicated Tool View Routing: 'home' | 'clean' | 'compress' | 'extract' | 'translate'
  const getInitialView = () => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (['clean', 'compress', 'extract', 'translate', 'home'].includes(hash)) {
        return hash;
      }
    }
    return 'home';
  };
  const [activeView, setActiveView] = useState(getInitialView);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const path = typeof window !== 'undefined' ? window.location.pathname : '';
      if (hash === 'admin' || path === '/admin') {
        setShowAdmin(true);
      } else if (hash === 'settings') {
        setShowSettings(true);
      } else if (hash === 'processing') {
        // Active processing screen
      } else {
        setShowAdmin(false);
        setShowSettings(false);
        setStep(1);
        setFile(null);
        setJobStatus(null);
        if (['clean', 'compress', 'extract', 'translate'].includes(hash)) {
          setActiveView(hash);
        } else {
          setActiveView('home');
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const navigateView = (view) => {
    setActiveView(view);
    setFile(null);
    setStep(1);
    setJobStatus(null);
    if (typeof window !== 'undefined') {
      window.location.hash = view === 'home' ? '' : `#${view}`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };



  const addToast = (msg, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  // Service display title
  const getServiceTitle = () => {
    switch (serviceType) {
      case 'extract_text': return 'Copy Text & Tables';
      case 'translate': return 'Translate Language';
      case 'compress': return 'Compact to Fewer Pages';
      case 'clean_format':
      default: return 'Clean & Beautify';
    }
  };

  const fetchHistory = async (overrideUrl) => {
    let baseUrl = overrideUrl;
    if (!baseUrl) {
      const node = await probeBackend();
      baseUrl = node.url || API_BASE;
    }

    try {
      const r = await fetch(`${baseUrl}/api/jobs`);
      if (r.ok) {
        const d = await r.json();
        setJobHistory(d);
      }
    } catch {
      // If primary failed, try fallback
      const cfg = getStoredConfig();
      if (baseUrl !== cfg.renderUrl && cfg.renderUrl) {
        try {
          const r = await fetch(`${cfg.renderUrl}/api/jobs`);
          if (r.ok) {
            const d = await r.json();
            setJobHistory(d);
          }
        } catch {}
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  // Active stream and polling reference for lifecycle management
  const activeStreamRef = useRef({ evtSource: null, pollTimer: null, jobId: null });

  const stopActiveStream = () => {
    if (activeStreamRef.current.evtSource) {
      try { activeStreamRef.current.evtSource.close(); } catch {}
      activeStreamRef.current.evtSource = null;
    }
    if (activeStreamRef.current.pollTimer) {
      clearInterval(activeStreamRef.current.pollTimer);
      activeStreamRef.current.pollTimer = null;
    }
    activeStreamRef.current.jobId = null;
  };

  const resumeJobStream = async (jobId, overrideUrl) => {
    stopActiveStream();
    activeStreamRef.current.jobId = jobId;

    let baseUrl = overrideUrl;
    if (!baseUrl) {
      const node = await probeBackend();
      baseUrl = node.url || API_BASE;
    }

    const handleTerminalState = () => {
      stopActiveStream();
      fetchHistory(baseUrl);
    };

    // Resilient REST Polling Fallback (for mobile sleeps, network jitter, proxy drops)
    const startPollingFallback = () => {
      if (activeStreamRef.current.pollTimer) return;

      const pollOnce = async () => {
        if (activeStreamRef.current.jobId !== jobId) return;
        try {
          // 1. Try dedicated fast REST polling endpoint
          const res = await fetch(`${baseUrl}/api/progress_poll/${jobId}`);
          if (res.ok) {
            const data = await res.json();
            data.id = jobId;
            setJobStatus(data);
            if (['Completed', 'COMPLETED', 'Error', 'ERROR', 'FAILED', 'CANCELLED'].includes(data.status)) {
              handleTerminalState(data);
              return;
            }
          } else if (res.status === 404) {
            // 2. Fallback to recent jobs check
            const jobsRes = await fetch(`${baseUrl}/api/jobs`);
            if (jobsRes.ok) {
              const jobs = await jobsRes.json();
              const found = Array.isArray(jobs) ? jobs.find((j) => j.id === jobId) : null;
              if (found) {
                const s = {
                  id: jobId,
                  status: found.status,
                  progress: found.progress_pct,
                  message: found.progress_msg,
                  result_url: found.result_url,
                  download_url: found.result_url ? `/api/download/${found.id}` : null,
                  service_type: found.service_type,
                  output_format: found.output_format,
                  original_file_size: found.original_file_size,
                  compressed_file_size: found.compressed_file_size,
                };
                setJobStatus(s);
                if (['Completed', 'COMPLETED', 'Error', 'ERROR', 'FAILED', 'CANCELLED'].includes(found.status)) {
                  handleTerminalState(s);
                  return;
                }
              }
            }
          }
        } catch {
          // Retry on next timer cycle
        }
      };

      pollOnce();
      activeStreamRef.current.pollTimer = setInterval(pollOnce, 2000);
    };

    try {
      const evtSource = new EventSource(`${baseUrl}/api/progress/${jobId}`);
      activeStreamRef.current.evtSource = evtSource;

      // Watchdog: If no SSE event received within 5 seconds, activate parallel polling fallback
      let lastEventTime = Date.now();
      const watchdog = setTimeout(() => {
        if (Date.now() - lastEventTime >= 4800 && activeStreamRef.current.jobId === jobId) {
          startPollingFallback();
        }
      }, 5000);

      evtSource.onmessage = (e) => {
        lastEventTime = Date.now();
        clearTimeout(watchdog);
        try {
          const s = JSON.parse(e.data);
          s.id = jobId;
          setJobStatus(s);
          if (['Completed', 'COMPLETED', 'Error', 'ERROR', 'FAILED', 'CANCELLED'].includes(s.status)) {
            handleTerminalState(s);
          }
        } catch (err) {
          console.error('Error parsing SSE event:', err);
        }
      };

      evtSource.onerror = () => {
        try { evtSource.close(); } catch {}
        activeStreamRef.current.evtSource = null;
        startPollingFallback();
      };
    } catch {
      startPollingFallback();
    }
  };

  // Probe backend node on mount & restore active jobs
  useEffect(() => {
    probeBackend().then((nodeInfo) => {
      setActiveNode(nodeInfo);
      fetchHistory(nodeInfo.url);
    });

    const handleNodeChange = (e) => {
      if (e.detail) setActiveNode(e.detail);
    };
    window.addEventListener('documorph:backend-node', handleNodeChange);

    const activeJobId = localStorage.getItem('activeJobId');
    if (activeJobId) {
      probeBackend().then((nodeInfo) => {
        const url = nodeInfo.url || API_BASE;
        fetch(`${url}/api/jobs`)
          .then((r) => r.json())
          .then((jobs) => {
            const job = Array.isArray(jobs) ? jobs.find((j) => j.id === activeJobId) : null;
            if (!job) {
              localStorage.removeItem('activeJobId');
            } else if (['QUEUED', 'PROCESSING', 'QUEUED_REPROCESS'].includes(job.status)) {
              setStep(4);
              if (job.service_type) setServiceType(job.service_type);
              resumeJobStream(activeJobId, url);
            } else {
              localStorage.removeItem('activeJobId');
            }
          })
          .catch(() => {
            localStorage.removeItem('activeJobId');
          });
      });
    }

    // Auto-resume & poll when mobile device wakes up or user tabs back to app
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const activeId = localStorage.getItem('activeJobId');
        if (activeId) {
          probeBackend().then((nodeInfo) => {
            const url = nodeInfo?.url || API_BASE;
            resumeJobStream(activeId, url);
          });
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      window.removeEventListener('documorph:backend-node', handleNodeChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      stopActiveStream();
    };
  }, []);

  // Navigation Handlers
  const handleBack = () => {
    stopActiveStream();
    if (step === 4) {
      setStep(1);
      setJobStatus(null);
      localStorage.removeItem('activeJobId');
    } else if (file) {
      setFile(null);
      setStep(1);
      setJobStatus(null);
    } else if (activeView !== 'home') {
      navigateView('home');
    } else {
      handleNewJob();
    }
  };

  const handleProcess = async (explicitFile, explicitServiceType) => {
    const fileToProcess = explicitFile || file;
    const targetService = explicitServiceType || serviceType;
    if (!fileToProcess) return;

    setIsSubmitting(true);

    const currentConfig = configs[targetService] || {};
    // Clean config: if page_range is 'all', strip page_from and page_to so backend never slices full documents
    const sanitizedConfig = { ...currentConfig };
    if (sanitizedConfig.page_range !== 'custom') {
      delete sanitizedConfig.page_from;
      delete sanitizedConfig.page_to;
    }

    const fd = new FormData();
    fd.append('file', fileToProcess);
    fd.append('service_type', targetService);
    fd.append('config_options', JSON.stringify(sanitizedConfig));

    if (sanitizedConfig.spam_words) {
      fd.append('spam_words', sanitizedConfig.spam_words);
    }
    const langMode = sanitizedConfig.to_language || sanitizedConfig.language_mode;
    if (langMode) {
      fd.append('language_mode', langMode);
    }
    if (customApiKey) fd.append('custom_api_key', customApiKey);
    if (customPrompt) fd.append('custom_prompt', customPrompt);

    setStep(4);
    if (typeof window !== 'undefined') {
      window.location.hash = '#processing';
    }
    setJobStatus({
      status: 'QUEUED',
      progress: 5,
      message: 'Uploading to server...',
      service_type: targetService,
    });

    try {
      const activeBackend = await probeBackend();
      let targetUrl = activeBackend.url || API_BASE;

      let res;
      try {
        res = await fetch(`${targetUrl}/api/process`, {
          method: 'POST',
          body: fd,
        });
      } catch (netErr) {
        // Laptop offline or tunnel dropped — failover to Render Cloud
        const cfg = getStoredConfig();
        if (targetUrl !== cfg.renderUrl && cfg.renderUrl) {
          addToast('Local/Laptop node offline. Diverting to Render Cloud...', 'info');
          targetUrl = cfg.renderUrl;
          res = await fetch(`${targetUrl}/api/process`, {
            method: 'POST',
            body: fd,
          });
        } else {
          throw netErr;
        }
      }

      const data = await res.json();

      if (!res.ok) {
        addToast(data.detail || 'Upload failed', 'error');
        setJobStatus({
          status: 'ERROR',
          progress: -1,
          message: data.detail || 'Upload rejected',
        });
        return;
      }

      const nodeName = (targetUrl.includes('localhost') || targetUrl.includes('127.0.0.1'))
        ? 'Local High-Speed Engine'
        : targetUrl.includes('trycloudflare')
        ? 'Laptop (8GB)'
        : 'Cloud';
      addToast(`Processing started on ${nodeName}!`, 'success');
      localStorage.setItem('activeJobId', data.job_id);
      resumeJobStream(data.job_id, targetUrl);
    } catch {
      addToast('Cannot connect to backend server. Make sure local backend is running on port 8000.', 'error');
      setJobStatus({
        status: 'ERROR',
        progress: -1,
        message: 'Could not connect to server.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewJob = () => {
    stopActiveStream();
    localStorage.removeItem('activeJobId');
    setJobStatus(null);
    setFile(null);
    setStep(1);
    navigateView('home');
    addToast('Ready for a new document!', 'info');
  };

  const handleReprocessPage = async (pageNumber) => {
    const activeJobId = localStorage.getItem('activeJobId') || (jobStatus && jobStatus.id);
    if (!activeJobId) {
      addToast('No active document job found.', 'error');
      return;
    }
    const pageInt = parseInt(pageNumber);
    if (!pageInt || pageInt < 1) {
      addToast('Please enter a valid page number.', 'error');
      return;
    }

    try {
      const activeBackend = await probeBackend();
      const targetUrl = activeBackend.url || API_BASE;
      const res = await fetch(`${targetUrl}/api/reprocess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: activeJobId, pages: [pageInt] }),
      });
      if (res.ok) {
        addToast(`Page ${pageInt} queued for rapid re-processing!`, 'success');
        resumeJobStream(activeJobId, targetUrl);
      } else {
        addToast('Failed to reprocess page.', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Network error while requesting reprocessing.', 'error');
    }
  };

  const handleReprocess = async (jobId) => {
    try {
      const activeBackend = await probeBackend();
      const targetUrl = activeBackend.url || API_BASE;
      const res = await fetch(`${targetUrl}/api/reprocess/${jobId}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.detail || 'Reprocess request failed', 'error');
        return;
      }
      setShowHistory(false);
      setStep(4);
      const newJobId = data.new_job_id;
      setJobStatus({
        id: newJobId,
        status: 'QUEUED_REPROCESS',
        progress: 0,
        message: 'Re-queued for reprocessing...',
      });
      localStorage.setItem('activeJobId', newJobId);
      addToast('Document re-queued for rapid reprocessing!', 'success');
      resumeJobStream(newJobId, targetUrl);
    } catch {
      addToast('Failed to connect to backend for reprocessing.', 'error');
    }
  };

  const isProcessing = Boolean(
    isSubmitting || (jobStatus && ['QUEUED', 'PROCESSING', 'QUEUED_REPROCESS'].includes(jobStatus.status) && step === 4)
  );
  const isComplete = Boolean(jobStatus && ['COMPLETED', 'Completed'].includes(jobStatus.status));
  const isError = Boolean(jobStatus && ['ERROR', 'Error', 'FAILED', 'Failed', 'CANCELLED', 'Cancelled'].includes(jobStatus.status));
  const stageIdx = jobStatus ? getPipelineStage(jobStatus.status, jobStatus.progress) : -1;

  // Dedicated Admin Hub Screen (Active via /admin, #admin, or VITE_ADMIN_ONLY)
  if (showAdmin || import.meta.env.VITE_ADMIN_ONLY === 'true') {
    return (
      <div className="app-layout" data-theme={appliedTheme} style={{ minHeight: '100vh', width: '100%', background: 'var(--bg-main, #0f172a)' }}>
        <AdminDashboardModal
          isOpen={true}
          onClose={() => {
            setShowAdmin(false);
            if (typeof window !== 'undefined') {
              if (window.location.hash === '#admin') {
                window.location.hash = '';
              }
              if (window.location.pathname === '/admin') {
                window.history.pushState(null, '', '/');
              }
            }
          }}
          standalone={true}
        />
        <ToastContainer toasts={toasts} />
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* ── UNIFIED MINIMAL HEADER ── */}
      <Header
        step={step}
        serviceTitle={getServiceTitle(serviceType)}
        activeView={activeView}
        onNavigateView={navigateView}
        onBack={handleBack}
        onNewJob={handleNewJob}
        onToggleHistory={() => setShowHistory(true)}
        historyCount={jobHistory.length}
        onToggleSettings={() => setShowSettings(!showSettings)}
        appliedTheme={appliedTheme}
        onToggleTheme={toggleTheme}
      />

      {/* ── ADVANCED SETTINGS MODAL ── */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => {
          setShowSettings(false);
          if (typeof window !== 'undefined' && window.location.hash === '#settings') {
            window.location.hash = '';
          }
        }}
        customApiKey={customApiKey}
        setCustomApiKey={setCustomApiKey}
        customPrompt={customPrompt}
        setCustomPrompt={setCustomPrompt}
      />

      {/* ── HISTORY DRAWER ── */}
      <Sidebar
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        jobHistory={jobHistory}
        loading={historyLoading}
        onReprocess={handleReprocess}
      />

      {/* ── UNIFIED PSYCHOLOGY-DRIVEN WORKSPACE & DEDICATED TOOL PAGES ── */}
      <main className="main-wizard-workspace">
        {step === 4 ? (
          <ProgressCard
            jobStatus={jobStatus}
            stageIdx={stageIdx}
            isComplete={isComplete}
            isError={isError}
            STAGES={STAGES}
            handleReprocessPage={handleReprocessPage}
            onNewJob={handleNewJob}
          />
        ) : activeView === 'clean' ? (
          /* ── DEDICATED VIEW: CLEAN & FORMAT ── */
          <CleanFormatPage
            onNavigateHome={() => navigateView('home')}
            file={file}
            setFile={setFile}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
            config={configs.clean_format}
            onChangeConfig={(cfg) => setConfigs((prev) => ({ ...prev, clean_format: cfg }))}
            onProcess={() => {
              setServiceType('clean_format');
              handleProcess(file, 'clean_format');
            }}
            isProcessing={isProcessing}
          />
        ) : activeView === 'compress' ? (
          /* ── DEDICATED VIEW: COMPRESS & COMPACT ── */
          <CompressPage
            onNavigateHome={() => navigateView('home')}
            file={file}
            setFile={setFile}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
            config={configs.compress}
            onChangeConfig={(cfg) => setConfigs((prev) => ({ ...prev, compress: cfg }))}
            onProcess={() => {
              setServiceType('compress');
              handleProcess(file, 'compress');
            }}
            isProcessing={isProcessing}
          />
        ) : activeView === 'extract' ? (
          /* ── DEDICATED VIEW: EXTRACT TEXT & TABLES ── */
          <ExtractTextPage
            onNavigateHome={() => navigateView('home')}
            file={file}
            setFile={setFile}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
            config={configs.extract_text}
            onChangeConfig={(cfg) => setConfigs((prev) => ({ ...prev, extract_text: cfg }))}
            onProcess={() => {
              setServiceType('extract_text');
              handleProcess(file, 'extract_text');
            }}
            isProcessing={isProcessing}
          />
        ) : activeView === 'translate' ? (
          /* ── DEDICATED VIEW: MULTI-LANGUAGE TRANSLATION ── */
          <TranslatePage
            onNavigateHome={() => navigateView('home')}
            file={file}
            setFile={setFile}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
            config={configs.translate}
            onChangeConfig={(cfg) => setConfigs((prev) => ({ ...prev, translate: cfg }))}
            onProcess={() => {
              setServiceType('translate');
              handleProcess(file, 'translate');
            }}
            isProcessing={isProcessing}
          />
        ) : activeView === 'home' ? (
          /* ── SCREEN 1: HOME HUB TOOL DIRECTORY & QUALITY SHOWCASE ── */
          <>
            <HeroSection />
            <ToolDirectory
              activeTool={activeView}
              onSelectTool={(tool) => navigateView(tool)}
            />
            <section className="home-showcase-section">
              <div className="home-showcase-header">
                <h2 className="home-showcase-title">Quality Preview</h2>
              </div>
              <InteractiveProofViewer
                title="Live Quality Test"
                beforeImg="/samples/doc_1_before.jpg"
                afterImg="/samples/doc_1_after.jpg"
                beforeLabel="Original Scan"
                afterLabel="Cleaned Note"
              />
            </section>
          </>
        ) : (
          /* ── CUSTOM 404 FALLBACK (Checklist Item 15) ── */
          <NotFoundView onNavigateHome={() => navigateView('home')} />
        )}
      </main>

      {/* ── FOOTER WITH PRIVACY & TERMS LINKS (Checklist Items 1, 2) ── */}
      <footer className="site-footer" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '24px 16px', maxWidth: '860px', margin: '0 auto', fontSize: '13px', color: 'var(--text-muted)' }}>
        <span>DocuMorph • 100% Private &amp; Secure Processing. Files are never stored.</span>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button type="button" onClick={() => setShowPrivacy(true)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}>Privacy Policy</button>
          <button type="button" onClick={() => setShowTerms(true)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}>Terms of Service</button>
        </div>
      </footer>

      {/* ── LEGAL & CONSENT MODALS ── */}
      <PrivacyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
      <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
      <CookieConsent onOpenPrivacy={() => setShowPrivacy(true)} />

      {/* ── TOAST CONTAINER ── */}
      <ToastContainer toasts={toasts} />
    </div>
  );
}
