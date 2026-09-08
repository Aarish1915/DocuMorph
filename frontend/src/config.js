// Dual-Backend Hybrid Edge Router
// Primary: Local Laptop via Cloudflare Tunnel (High-Speed, 8GB RAM, unmetered OCR)
// Fallback: Cloud Backend on Render (Always-on 24/7 failover)

const DEFAULT_LAPTOP_TUNNEL = 'https://lcd-acknowledged-plc-parameters.trycloudflare.com';
const DEFAULT_RENDER_CLOUD = 'https://documorph-backend.onrender.com';

export function getStoredConfig() {
  if (typeof window === 'undefined') {
    return {
      laptopUrl: DEFAULT_LAPTOP_TUNNEL,
      renderUrl: DEFAULT_RENDER_CLOUD,
      preferred: 'auto',
    };
  }

  return {
    laptopUrl: localStorage.getItem('documorph_tunnel_url') || import.meta.env.VITE_TUNNEL_URL || DEFAULT_LAPTOP_TUNNEL,
    renderUrl: localStorage.getItem('documorph_render_url') || import.meta.env.VITE_RENDER_URL || DEFAULT_RENDER_CLOUD,
    preferred: localStorage.getItem('documorph_backend_pref') || 'auto', // 'auto' | 'laptop' | 'render'
  };
}

let cachedActiveBase = null;
let lastProbeTime = 0;
let lastProbeResult = { node: 'unknown', url: '', online: false };
const PROBE_TTL_MS = 25000; // Cache probe result for 25 seconds

export async function probeBackend(forceRefresh = false) {
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    cachedActiveBase = 'http://localhost:8000';
    lastProbeResult = { node: 'local', url: cachedActiveBase, online: true };
    return lastProbeResult;
  }

  const now = Date.now();
  if (!forceRefresh && cachedActiveBase && (now - lastProbeTime < PROBE_TTL_MS)) {
    return lastProbeResult;
  }

  const config = getStoredConfig();

  // If user explicitly forced Render
  if (config.preferred === 'render') {
    cachedActiveBase = config.renderUrl;
    lastProbeTime = now;
    lastProbeResult = { node: 'render', url: config.renderUrl, online: true };
    return lastProbeResult;
  }

  // 1. Try probing Laptop Tunnel (Primary) with 1500ms timeout
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

  // 2. Fallback to Cloud Render Node
  cachedActiveBase = config.renderUrl;
  lastProbeTime = now;
  lastProbeResult = { node: 'render', url: config.renderUrl, online: true };
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('documorph:backend-node', { detail: lastProbeResult }));
  }
  return lastProbeResult;
}

// Synchronous getter for immediate URL resolution
export function getApiBaseSync() {
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:8000';
  }
  if (cachedActiveBase) return cachedActiveBase;
  const config = getStoredConfig();
  return config.laptopUrl || config.renderUrl;
}

// Backward-compatible export
export const API_BASE = getApiBaseSync();
