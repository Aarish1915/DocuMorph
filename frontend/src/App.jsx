import { useState, useEffect } from 'react';
import './DesignTokens.css';
import './index.css';
import { API_BASE, probeBackend, getStoredConfig } from './config';

import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import SettingsModal from './components/common/SettingsModal';
import ToastContainer from './components/common/ToastContainer';
import HeroSection from './components/hero/HeroSection';
import WorkspaceScreen from './components/workspace/WorkspaceScreen';
import ProgressCard from './components/progress/ProgressCard';

import ToolDirectory from './components/pages/ToolDirectory';
import CleanFormatPage from './components/pages/CleanFormatPage';
import CompressPage from './components/pages/CompressPage';
import ExtractTextPage from './components/pages/ExtractTextPage';
import TranslatePage from './components/pages/TranslatePage';
import InteractiveProofViewer from './components/common/InteractiveProofViewer';

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
      if (hash === 'processing') {
        // Active processing screen
      } else {
        // Phone back pressed from processing, or navigating back
        setStep(1);
        setFile(null);
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
    if (typeof window !== 'undefined') {
      window.location.hash = view === 'home' ? '' : `#${view}`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // File & Drag state
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Execution & Job state
  const [jobStatus, setJobStatus] = useState(null);
  const [jobHistory, setJobHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  // Advanced settings
  const [showSettings, setShowSettings] = useState(false);
  const [customApiKey, setCustomApiKey] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [activeNode, setActiveNode] = useState(null);

  // Toast notifications
  const [toasts, setToasts] = useState([]);
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

  const resumeJobStream = async (jobId, overrideUrl) => {
    let baseUrl = overrideUrl;
    if (!baseUrl) {
      const node = await probeBackend();
      baseUrl = node.url || API_BASE;
    }

    const evtSource = new EventSource(`${baseUrl}/api/progress/${jobId}`);
    evtSource.onmessage = (e) => {
      try {
        const s = JSON.parse(e.data);
        s.id = jobId;
        setJobStatus(s);
        if (['Completed', 'COMPLETED', 'Error', 'ERROR', 'FAILED'].includes(s.status)) {
          evtSource.close();
          fetchHistory(baseUrl);
        }
      } catch (err) {
        console.error('Error parsing SSE event:', err);
      }
    };
    evtSource.onerror = () => {
      evtSource.close();
    };
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
            const job = jobs.find((j) => j.id === activeJobId);
            if (!job) {
              localStorage.removeItem('activeJobId');
            } else if (['QUEUED', 'PROCESSING', 'QUEUED_REPROCESS'].includes(job.status)) {
              setStep(4);
              if (job.service_type) setServiceType(job.service_type);
              resumeJobStream(activeJobId, url);
            } else {
              setJobStatus({
                id: job.id,
                status: job.status,
                progress: 100,
                message: 'Previous document result',
                result_url: job.result_url,
                download_url: job.download_url,
                service_type: job.service_type,
                output_format: job.output_format,
                original_file_size: job.original_file_size,
                compressed_file_size: job.compressed_file_size,
              });
            }
          })
          .catch(() => {});
      });
    }

    return () => {
      window.removeEventListener('documorph:backend-node', handleNodeChange);
    };
  }, []);

  // Navigation Handlers
  const handleBack = () => {
    if (step === 4) {
      setStep(1);
      setJobStatus(null);
    } else if (file) {
      setFile(null);
      setStep(1);
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
    if (sanitizedConfig.language_mode) {
      fd.append('language_mode', sanitizedConfig.language_mode);
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
          addToast('Laptop node offline. Diverting to Render Cloud...', 'info');
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

      const nodeName = targetUrl.includes('trycloudflare') ? 'Laptop (8GB)' : 'Cloud';
      addToast(`Processing started on ${nodeName}!`, 'success');
      localStorage.setItem('activeJobId', data.job_id);
      resumeJobStream(data.job_id, targetUrl);
    } catch {
      addToast('Cannot connect to backend server. Check Settings or launch tunnel.', 'error');
      setJobStatus({
        status: 'ERROR',
        progress: -1,
        message: 'Could not connect to server.',
      });
    }
  };

  const handleNewJob = () => {
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

  const isProcessing = jobStatus && !['COMPLETED', 'Completed', 'ERROR', 'FAILED'].includes(jobStatus.status);
  const isComplete = jobStatus && ['COMPLETED', 'Completed'].includes(jobStatus.status);
  const isError = jobStatus && ['ERROR', 'FAILED'].includes(jobStatus.status);
  const stageIdx = jobStatus ? getPipelineStage(jobStatus.status, jobStatus.progress) : -1;

  const headerStep = step === 4 ? 3 : file ? 2 : 1;

  return (
    <div className="app-root">
      {/* ── HEADER ── */}
      <Header
        step={headerStep}
        serviceTitle={getServiceTitle()}
        activeView={activeView}
        activeNode={activeNode}
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
        onClose={() => setShowSettings(false)}
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
        ) : (
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
        )}
      </main>

      {/* ── MINIMAL FOOTER ── */}
      <footer className="site-footer">
        <span>DocuMorph • 100% Private. Files are never stored.</span>
      </footer>

      {/* ── TOAST CONTAINER ── */}
      <ToastContainer toasts={toasts} />
    </div>
  );
}
