// Dual-Backend Hybrid Edge Router
// Primary: Local Laptop via Cloudflare Tunnel (High-Speed, 8GB RAM, unmetered OCR)
// Fallback: Cloud Backend on Render (Always-on 24/7 failover)

const DEFAULT_LAPTOP_TUNNEL = '';
const DEFAULT_RENDER_CLOUD = import.meta.env.VITE_API_URL || import.meta.env.VITE_RENDER_URL || 'https://documorph-backend.onrender.com';

export function getStoredConfig() {
  if (typeof window === 'undefined') {
    return {
      laptopUrl: '',
      renderUrl: DEFAULT_RENDER_CLOUD,
      preferred: 'auto',
    };
  }

  const envCloudUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_RENDER_URL || DEFAULT_RENDER_CLOUD;
  return {
    laptopUrl: localStorage.getItem('documorph_tunnel_url') || import.meta.env.VITE_TUNNEL_URL || '',
    renderUrl: localStorage.getItem('documorph_render_url') || envCloudUrl,
    preferred: localStorage.getItem('documorph_backend_pref') || 'auto', // 'auto' | 'laptop' | 'render'
  };
}

let cachedActiveBase = null;
let lastProbeTime = 0;
let lastProbeResult = { node: 'unknown', url: '', online: false };
const PROBE_TTL_MS = 25000; // Cache probe result for 25 seconds

export async function probeBackend(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedActiveBase && (now - lastProbeTime < PROBE_TTL_MS)) {
    return lastProbeResult;
  }

  const config = getStoredConfig();

  // 1. If user explicitly forced Render
  if (config.preferred === 'render') {
    cachedActiveBase = config.renderUrl;
    lastProbeTime = now;
    lastProbeResult = { node: 'render', url: config.renderUrl, online: true };
    return lastProbeResult;
  }

  // 2. If user explicitly forced Laptop Node
  if (config.preferred === 'laptop' && config.laptopUrl) {
    cachedActiveBase = config.laptopUrl;
    lastProbeTime = now;
    lastProbeResult = { node: 'laptop', url: config.laptopUrl, online: true };
    return lastProbeResult;
  }

  // 3. If running on local machine, probe localhost:8000 first (only if VITE_API_URL does not force an external URL)
  const envApi = import.meta.env.VITE_API_URL;
  const hasExternalEnvApi = envApi && !envApi.includes('localhost') && !envApi.includes('127.0.0.1');

  if (!hasExternalEnvApi && typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 600);
      const res = await fetch('http://localhost:8000/api/settings', { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        cachedActiveBase = 'http://localhost:8000';
        lastProbeTime = now;
        lastProbeResult = { node: 'local', url: cachedActiveBase, online: true };
        return lastProbeResult;
      }
    } catch {
      // Local port 8000 is not running; proceed to tunnel or Render fallback below
    }
  }

  // 4. Try probing Laptop Tunnel (Primary) with 1600ms timeout
  if (config.laptopUrl) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1600);
      const res = await fetch(`${config.laptopUrl}/api/settings`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        cachedActiveBase = config.laptopUrl;
        lastProbeTime = now;
        lastProbeResult = { node: 'laptop', url: config.laptopUrl, online: true };
        window.dispatchEvent(new CustomEvent('documorph:backend-node', { detail: lastProbeResult }));
        return lastProbeResult;
      }
    } catch {
      // Laptop is off, asleep, or tunnel unreachable — proceed to fallback
    }
  }

  // 5. Fallback to Cloud Render Node
  const fallbackUrl = config.renderUrl || DEFAULT_RENDER_CLOUD;
  cachedActiveBase = fallbackUrl;
  lastProbeTime = now;
  lastProbeResult = { node: 'render', url: fallbackUrl, online: true };
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('documorph:backend-node', { detail: lastProbeResult }));
  }
  return lastProbeResult;
}

// Synchronous getter for immediate URL resolution
export function getApiBaseSync() {
  if (cachedActiveBase) return cachedActiveBase;
  const config = getStoredConfig();
  if (config.preferred === 'render') {
    return config.renderUrl;
  }
  if (config.preferred === 'laptop' && config.laptopUrl) {
    return config.laptopUrl;
  }
  const envApi = import.meta.env.VITE_API_URL;
  if (envApi) {
    return envApi;
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return config.laptopUrl || config.renderUrl || 'http://localhost:8000';
  }
  return config.laptopUrl || config.renderUrl || DEFAULT_RENDER_CLOUD;
}

// Backward-compatible export
export const API_BASE = getApiBaseSync();

