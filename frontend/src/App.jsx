import { useState, useEffect } from 'react';
import './DesignTokens.css';
import './index.css';
import { API_BASE } from './config';

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
      if (['clean', 'compress', 'extract', 'translate', 'home'].includes(hash)) {
        setActiveView(hash);
      } else if (!hash) {
        setActiveView('home');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateView = (view) => {
    setActiveView(view);
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

  const fetchHistory = () => {
    fetch(`${API_BASE}/api/jobs`)
      .then((r) => r.json())
      .then((d) => {
        setJobHistory(d);
        setHistoryLoading(false);
      })
      .catch(() => {
        setHistoryLoading(false);
      });
  };

  const resumeJobStream = (jobId) => {
    const evtSource = new EventSource(`${API_BASE}/api/progress/${jobId}`);
    evtSource.onmessage = (e) => {
      try {
        const s = JSON.parse(e.data);
        s.id = jobId;
        setJobStatus(s);
        if (['Completed', 'COMPLETED', 'Error', 'ERROR', 'FAILED'].includes(s.status)) {
          evtSource.close();
          fetchHistory();
        }
      } catch (err) {
        console.error('Error parsing SSE event:', err);
      }
    };
    evtSource.onerror = () => {
      evtSource.close();
    };
  };

  // Restore active job if running on mount
  useEffect(() => {
    fetchHistory();
    const activeJobId = localStorage.getItem('activeJobId');
    if (activeJobId) {
      fetch(`${API_BASE}/api/jobs`)
        .then((r) => r.json())
        .then((jobs) => {
          const job = jobs.find((j) => j.id === activeJobId);
          if (!job) {
            localStorage.removeItem('activeJobId');
          } else if (['QUEUED', 'PROCESSING', 'QUEUED_REPROCESS'].includes(job.status)) {
            setStep(4);
            if (job.service_type) setServiceType(job.service_type);
            resumeJobStream(activeJobId);
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
            if (job.service_type) setServiceType(job.service_type);
            setStep(4);
          }
        })
        .catch(() => localStorage.removeItem('activeJobId'));
    }
  }, []);

  // Navigation Handlers
  const handleBack = () => {
    if (step === 4) {
      setStep(2);
    } else if (file) {
      setFile(null);
      setStep(1);
    } else if (activeView !== 'home') {
      navigateView('home');
    } else {
      handleNewJob();
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    const currentConfig = configs[serviceType] || {};
    // Clean config: if page_range is 'all', strip page_from and page_to so backend never slices full documents
    const sanitizedConfig = { ...currentConfig };
    if (sanitizedConfig.page_range !== 'custom') {
      delete sanitizedConfig.page_from;
      delete sanitizedConfig.page_to;
    }

    const fd = new FormData();
    fd.append('file', file);
    fd.append('service_type', serviceType);
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
    setJobStatus({
      status: 'QUEUED',
      progress: 5,
      message: 'Uploading to server...',
      service_type: serviceType,
    });

    try {
      const res = await fetch(`${API_BASE}/api/process`, {
        method: 'POST',
        body: fd,
      });
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

      addToast('Uploaded successfully! Processing started.', 'success');
      localStorage.setItem('activeJobId', data.job_id);
      resumeJobStream(data.job_id);
    } catch {
      addToast('Cannot connect to backend server. Is it running on port 8000?', 'error');
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
      const res = await fetch(`${API_BASE}/api/reprocess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: activeJobId, pages: [pageInt] }),
      });
      if (res.ok) {
        addToast(`Page ${pageInt} queued for rapid re-processing!`, 'success');
        resumeJobStream(activeJobId);
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
        onNavigateView={navigateView}
        onBack={handleBack}
        onNewJob={handleNewJob}
        onToggleHistory={() => setShowHistory(true)}
        historyCount={jobHistory.length}
        onToggleSettings={() => setShowSettings(!showSettings)}
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
        ) : file ? (
          /* ── SCREEN 2: FOCUSED iLovePDF WORKSPACE WITH SMART PRESETS ── */
          <WorkspaceScreen
            file={file}
            onResetFile={() => setFile(null)}
            serviceType={serviceType}
            setServiceType={setServiceType}
            config={configs[serviceType] || {}}
            onChangeConfig={(newCfg) => {
              setConfigs((prev) => ({ ...prev, [serviceType]: newCfg }));
            }}
            isProcessing={isProcessing}
            handleProcess={handleProcess}
          />
        ) : activeView === 'clean' ? (
          /* ── DEDICATED VIEW: CLEAN & FORMAT ── */
          <CleanFormatPage
            onNavigateHome={() => navigateView('home')}
            onFileSelect={(selectedFile) => {
              setServiceType('clean_format');
              setFile(selectedFile);
              setStep(2);
            }}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
            config={configs.clean_format}
            onChangeConfig={(cfg) => setConfigs((prev) => ({ ...prev, clean_format: cfg }))}
          />
        ) : activeView === 'compress' ? (
          /* ── DEDICATED VIEW: COMPRESS & COMPACT ── */
          <CompressPage
            onNavigateHome={() => navigateView('home')}
            onFileSelect={(selectedFile) => {
              setServiceType('compress');
              setFile(selectedFile);
              setStep(2);
            }}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
            config={configs.compress}
            onChangeConfig={(cfg) => setConfigs((prev) => ({ ...prev, compress: cfg }))}
          />
        ) : activeView === 'extract' ? (
          /* ── DEDICATED VIEW: EXTRACT TEXT & TABLES ── */
          <ExtractTextPage
            onNavigateHome={() => navigateView('home')}
            onFileSelect={(selectedFile) => {
              setServiceType('extract_text');
              setFile(selectedFile);
              setStep(2);
            }}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
            config={configs.extract_text}
            onChangeConfig={(cfg) => setConfigs((prev) => ({ ...prev, extract_text: cfg }))}
          />
        ) : activeView === 'translate' ? (
          /* ── DEDICATED VIEW: MULTI-LANGUAGE TRANSLATION ── */
          <TranslatePage
            onNavigateHome={() => navigateView('home')}
            onFileSelect={(selectedFile) => {
              setServiceType('translate');
              setFile(selectedFile);
              setStep(2);
            }}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
            config={configs.translate}
            onChangeConfig={(cfg) => setConfigs((prev) => ({ ...prev, translate: cfg }))}
          />
        ) : (
          /* ── SCREEN 1: HOME HUB TOOL DIRECTORY (CLEAN iLovePDF STYLE) ── */
          <>
            <HeroSection />
            <ToolDirectory
              activeTool={activeView}
              onSelectTool={(tool) => navigateView(tool)}
            />
          </>
        )}
      </main>

      {/* ── MINIMAL FOOTER ── */}
      <footer className="site-footer">
        <span>DocuMorph AI • Clean, Fast, Ephemeral Document Processing</span>
      </footer>

      {/* ── TOAST CONTAINER ── */}
      <ToastContainer toasts={toasts} />
    </div>
  );
}
