import React, { useState, useEffect, useRef } from 'react';
import './DesignTokens.css';
import './index.css';
import { API_BASE, probeBackend, getStoredConfig } from './config';

import Header from './components/common/Header';
import DonorTicker from './components/common/DonorTicker';
import MobileSupportFab from './components/common/MobileSupportFab';
import Workspace from './components/workspace/Workspace';
import CommunityWall from './components/community/CommunityWall';
import Footer from './components/common/Footer';

import AdminDashboardModal from './components/admin/AdminDashboardModal';
import ToastContainer from './components/common/ToastContainer';
import DonationModal from './components/common/DonationModal';
import SubmitUtrModal from './components/common/SubmitUtrModal';
import WriteReviewModal from './components/home/WriteReviewModal';
import CookieConsent from './components/common/CookieConsent';
import NotFoundView from './components/common/NotFoundView';

import FAQPage from './components/pages/FAQPage';
import PrivacyPage from './components/pages/PrivacyPage';
import TermsPage from './components/pages/TermsPage';

import AcademicScoreboard from './components/home/AcademicScoreboard';
import MetricsStatGrid from './components/home/MetricsStatGrid';
import HowItWorksThreePass from './components/home/HowItWorksThreePass';
import AspirantTestimonials from './components/home/AspirantTestimonials';
import PopularToolsFooter from './components/common/PopularToolsFooter';

const DEFAULT_CONFIGS = {
  clean_format: {
    doc_type: 'auto',
    images: 'keep',
    fix_formulas: true,
  },
  compress: {
    quality: 'balanced',
    remove_duplicates: true,
    strip_metadata: true,
  },
  extract_text: {
    output_format: 'markdown',
    clean_watermarks: true,
    preserve_structure: true,
  },
  translate: {
    from_language: 'auto',
    to_language: 'Hindi',
    protect_math: true,
    protect_code: true,
  },
};

function getPipelineStage(status, progress) {
  if (status === 'QUEUED' || status === 'UPLOADING') return 0;
  if (progress <= 15) return 0;
  if (progress <= 35) return 1;
  if (progress <= 65) return 2;
  if (progress <= 90) return 3;
  return 4;
}

function uploadWithProgress(url, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const startTime = Date.now();

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        const elapsedSec = Math.max(0.1, (Date.now() - startTime) / 1000);
        const speedMBps = (event.loaded / (1024 * 1024)) / elapsedSec;
        const pct = Math.round((event.loaded / event.total) * 100);
        const loadedMB = (event.loaded / (1024 * 1024)).toFixed(1);
        const totalMB = (event.total / (1024 * 1024)).toFixed(1);
        const speedStr = speedMBps >= 1 ? `${speedMBps.toFixed(1)} MB/s` : `${Math.round(speedMBps * 1024)} KB/s`;

        onProgress({
          pct,
          loadedMB,
          totalMB,
          speedStr,
        });
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ ok: true, data });
        } else {
          resolve({ ok: false, data, status: xhr.status });
        }
      } catch {
        resolve({ ok: false, data: { detail: xhr.statusText || 'Upload response parse error' }, status: xhr.status });
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.ontimeout = () => reject(new Error('Upload timed out'));
    xhr.timeout = 180000;
    xhr.open('POST', url);
    xhr.send(formData);
  });
}

export default function App() {
  // Service & Config
  const [serviceType, setServiceType] = useState('clean_format');
  const [configs, setConfigs] = useState(DEFAULT_CONFIGS);

  // File & Drag State
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Job Execution State
  const [jobStatus, setJobStatus] = useState(null);

  // Modals & Navigation
  const [toasts, setToasts] = useState([]);
  const [showDonation, setShowDonation] = useState(false);
  const [showSubmitUtr, setShowSubmitUtr] = useState(false);
  const [showWriteReview, setShowWriteReview] = useState(false);

  // Admin Segregation
  const [showAdmin, setShowAdmin] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      return hash === 'admin' || window.location.pathname === '/admin';
    }
    return false;
  });

  // Theme Engine
  const [themeMode, setThemeMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cleannotes_theme') || 'system';
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
      localStorage.setItem('cleannotes_theme', next);
    }
  };

  // Route Views: 'home' | 'community' | 'faq' | 'privacy' | 'terms'
  const getInitialView = () => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      const path = window.location.pathname.replace(/^\/+/, '');
      const candidate = hash || path;
      if (candidate === 'backers' || candidate === 'community') return 'community';
      if (['faq', 'privacy', 'terms', 'home'].includes(candidate)) {
        return candidate;
      }
    }
    return 'home';
  };

  const [activeView, setActiveView] = useState(getInitialView);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const path = typeof window !== 'undefined' ? window.location.pathname.replace(/^\/+/, '') : '';

      if (hash === 'admin' || path === 'admin') {
        setShowAdmin(true);
      } else {
        setShowAdmin(false);
        const candidate = hash || path;
        if (candidate === 'backers' || candidate === 'community') {
          setActiveView('community');
        } else if (['faq', 'privacy', 'terms'].includes(candidate)) {
          setActiveView(candidate);
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

  // Stream & Polling Ref
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

    const updateJobStatus = (data) => {
      setJobStatus((prev) => {
        if (!prev) return data;
        const isTerminal = ['Completed', 'COMPLETED', 'Error', 'ERROR', 'FAILED', 'CANCELLED'].includes(data.status);
        const prevProg = typeof prev.progress === 'number' ? prev.progress : 0;
        const newProg = typeof data.progress === 'number' ? data.progress : prevProg;
        return {
          ...prev,
          ...data,
          progress: isTerminal ? newProg : Math.max(prevProg, newProg)
        };
      });
    };

    const handleTerminalState = () => {
      stopActiveStream();
    };

    // Polling fallback
    const startPollingFallback = () => {
      if (activeStreamRef.current.pollTimer) {
        clearInterval(activeStreamRef.current.pollTimer);
        activeStreamRef.current.pollTimer = null;
      }

      const pollOnce = async () => {
        if (activeStreamRef.current.jobId !== jobId) return;
        try {
          const res = await fetch(`${baseUrl}/api/progress_poll/${jobId}`);
          if (res.ok) {
            const data = await res.json();
            data.id = jobId;
            updateJobStatus(data);
            if (['Completed', 'COMPLETED', 'Error', 'ERROR', 'FAILED', 'CANCELLED'].includes(data.status)) {
              handleTerminalState();
            }
          }
        } catch {
          // Retry next timer cycle
        }
      };

      pollOnce();
      activeStreamRef.current.pollTimer = setInterval(pollOnce, 750);
    };

    try {
      const evtSource = new EventSource(`${baseUrl}/api/progress/${jobId}`);
      activeStreamRef.current.evtSource = evtSource;

      evtSource.onmessage = (e) => {
        try {
          const s = JSON.parse(e.data);
          s.id = jobId;
          updateJobStatus(s);
          if (['Completed', 'COMPLETED', 'Error', 'ERROR', 'FAILED', 'CANCELLED'].includes(s.status)) {
            handleTerminalState();
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

  // Restore active job if present
  useEffect(() => {
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

    return () => {
      stopActiveStream();
    };
  }, []);

  const handleProcess = async (fileToProcess, targetService) => {
    if (!fileToProcess) return;

    setIsSubmitting(true);
    const currentConfig = configs[targetService] || {};

    const fd = new FormData();
    fd.append('file', fileToProcess);
    fd.append('service_type', targetService);
    fd.append('config_options', JSON.stringify(currentConfig));

    if (currentConfig.to_language) {
      fd.append('language_mode', currentConfig.to_language);
    }

    const fileSizeMB = fileToProcess.size ? (fileToProcess.size / (1024 * 1024)).toFixed(1) : '0';
    setJobStatus({
      status: 'UPLOADING',
      progress: 5,
      upload_pct: 0,
      loaded_mb: '0.0',
      total_mb: fileSizeMB,
      upload_speed: 'Starting...',
      message: `Connecting & uploading document (${fileSizeMB} MB)...`,
      service_type: targetService,
    });

    const onUploadProgress = (upData) => {
      setJobStatus({
        status: 'UPLOADING',
        progress: Math.min(99, Math.max(5, Math.round(upData.pct * 0.95))),
        upload_pct: upData.pct,
        loaded_mb: upData.loadedMB,
        total_mb: upData.totalMB,
        upload_speed: upData.speedStr,
        message: `Uploading: ${upData.loadedMB} MB / ${upData.totalMB} MB (${upData.pct}%) • ${upData.speedStr}`,
        service_type: targetService,
      });
    };

    try {
      const activeBackend = await probeBackend();
      let targetUrl = activeBackend.url || API_BASE;

      let uploadRes;
      try {
        uploadRes = await uploadWithProgress(`${targetUrl}/api/process`, fd, onUploadProgress);
      } catch (netErr) {
        const cfg = getStoredConfig();
        if (targetUrl !== cfg.renderUrl && cfg.renderUrl) {
          addToast('Primary node busy. Switching to fallback cloud node...', 'info');
          targetUrl = cfg.renderUrl;
          uploadRes = await uploadWithProgress(`${targetUrl}/api/process`, fd, onUploadProgress);
        } else {
          throw netErr;
        }
      }

      const { ok, data } = uploadRes;

      if (!ok) {
        addToast(data.detail || 'Upload failed', 'error');
        setJobStatus({
          status: 'ERROR',
          progress: -1,
          message: data.detail || 'Upload rejected',
        });
        return;
      }

      setJobStatus({
        status: 'QUEUED',
        progress: 10,
        message: 'Uploaded! Queueing on server...',
        service_type: targetService,
      });

      addToast('Document queued for high-speed processing!', 'success');
      localStorage.setItem('activeJobId', data.job_id);
      resumeJobStream(data.job_id, targetUrl);
    } catch {
      addToast('Cannot connect to backend server. Ensure backend is running.', 'error');
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
    addToast('Ready for a new document!', 'info');
  };

  const isProcessing = Boolean(
    isSubmitting || (jobStatus && ['QUEUED', 'PROCESSING', 'QUEUED_REPROCESS', 'UPLOADING'].includes(jobStatus.status))
  );
  const isComplete = Boolean(jobStatus && ['COMPLETED', 'Completed'].includes(jobStatus.status));
  const isError = Boolean(jobStatus && ['ERROR', 'Error', 'FAILED', 'Failed', 'CANCELLED', 'Cancelled'].includes(jobStatus.status));
  const stageIdx = jobStatus ? getPipelineStage(jobStatus.status, jobStatus.progress) : -1;

  // Dedicated Admin Hub Screen
  if (showAdmin || import.meta.env.VITE_ADMIN_ONLY === 'true') {
    return (
      <div className="app-shell" data-theme={appliedTheme}>
        <AdminDashboardModal
          isOpen={true}
          onClose={() => {
            setShowAdmin(false);
            if (typeof window !== 'undefined') {
              if (window.location.hash === '#admin') window.location.hash = '';
              if (window.location.pathname === '/admin') window.history.pushState(null, '', '/');
            }
          }}
          standalone={true}
        />
        <ToastContainer toasts={toasts} />
      </div>
    );
  }

  return (
    <div className="app-shell" data-theme={appliedTheme}>
      {/* Top Header */}
      <Header
        activeView={activeView}
        onNavigateView={navigateView}
        appliedTheme={appliedTheme}
        onToggleTheme={toggleTheme}
        onOpenDonation={() => setShowDonation(true)}
      />

      {/* Top Donors Ticker Banner (Desktop Only) */}
      <DonorTicker
        onNavigateCommunity={() => navigateView('community')}
        onOpenDonation={() => setShowDonation(true)}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {activeView === 'home' && (
          <>
            <Workspace
              serviceType={serviceType}
              setServiceType={setServiceType}
              config={configs[serviceType]}
              onChangeConfig={(newCfg) => setConfigs((prev) => ({ ...prev, [serviceType]: newCfg }))}
              file={file}
              setFile={setFile}
              isDragging={isDragging}
              setIsDragging={setIsDragging}
              handleProcess={handleProcess}
              isProcessing={isProcessing}
              isComplete={isComplete}
              isError={isError}
              jobStatus={jobStatus}
              stageIdx={stageIdx}
              onNewJob={handleNewJob}
              onOpenDonation={() => setShowDonation(true)}
              onToast={addToast}
            />

            {/* Empirical Proof Scoreboard */}
            <AcademicScoreboard />

            {/* Key Platform Metric Proof Points */}
            <MetricsStatGrid />

            {/* 3-Pass High-Fidelity Engine Breakdown */}
            <HowItWorksThreePass />

            {/* Verified Student Wall - Kota to Mukherjee Nagar Testimonials */}
            <AspirantTestimonials />

            {/* Popular Academic Transformation Tools (4 Pillars) */}
            <PopularToolsFooter
              onNavigateView={(toolKey) => {
                const map = {
                  clean: 'clean_format',
                  compress: 'compress',
                  extract: 'extract_text',
                  translate: 'translate'
                };
                if (map[toolKey]) {
                  setServiceType(map[toolKey]);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
            />
          </>
        )}

        {activeView === 'community' && (
          <CommunityWall
            onNavigateHome={() => navigateView('home')}
            onOpenDonation={() => setShowDonation(true)}
            onOpenUtrModal={() => setShowSubmitUtr(true)}
            onOpenWriteReview={() => setShowWriteReview(true)}
          />
        )}

        {activeView === 'faq' && (
          <FAQPage onNavigateHome={() => navigateView('home')} />
        )}

        {activeView === 'privacy' && (
          <PrivacyPage onNavigateHome={() => navigateView('home')} />
        )}

        {activeView === 'terms' && (
          <TermsPage onNavigateHome={() => navigateView('home')} />
        )}

        {activeView !== 'home' &&
         activeView !== 'community' &&
         activeView !== 'faq' &&
         activeView !== 'privacy' &&
         activeView !== 'terms' && (
          <NotFoundView onNavigateHome={() => navigateView('home')} />
        )}
      </main>

      {/* Redesigned Multi-Column Academic Footer */}
      <Footer
        onNavigateView={navigateView}
        onOpenDonation={() => setShowDonation(true)}
        onSelectTool={(toolId) => {
          setServiceType(toolId);
          setActiveView('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Mobile Floating Action Button */}
      <MobileSupportFab onOpenDonation={() => setShowDonation(true)} />

      {/* Donation Flow Modals */}
      <DonationModal
        isOpen={showDonation}
        onClose={() => setShowDonation(false)}
        onOpenUtrModal={() => setShowSubmitUtr(true)}
      />

      <SubmitUtrModal
        isOpen={showSubmitUtr}
        onClose={() => setShowSubmitUtr(false)}
        onDonationRecorded={(donor) => {
          addToast(`🎉 Verified ${donor.name} on the Wall of Fame!`, 'success');
        }}
      />

      <WriteReviewModal
        isOpen={showWriteReview}
        onClose={() => setShowWriteReview(false)}
        onReviewSubmitted={(rev) => {
          addToast(`⭐ Verified review added for ${rev.student_name}!`, 'success');
        }}
      />

      {/* Cookie Consent & Toast Container */}
      <CookieConsent onOpenPrivacy={() => navigateView('privacy')} />
      <ToastContainer toasts={toasts} />
    </div>
  );
}
