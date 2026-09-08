// Centralized API configuration for local dev and cloud deployment (Vercel / Render / Railway)
export const API_BASE = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8000'
    : '');
