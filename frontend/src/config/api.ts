/**
 * Centralized API Configuration for DocuFlow AI Frontend
 * Validates and normalizes backend endpoints for local dev and cloud hosting (Netlify/Vercel/Render).
 */

const getNormalizedApiUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;

  // Local development fallback
  if (!envUrl) {
    if (import.meta.env.DEV) {
      return 'http://localhost:5000/api/v1';
    }
    // Production default fallback - points to relative /api/v1 or root API
    console.warn(
      '⚠️ [DOCUFLOW CONFIG] VITE_API_URL environment variable is not defined in production build. Please set VITE_API_URL in your hosting provider (e.g. Netlify) settings.'
    );
    return '/api/v1';
  }

  // Remove trailing slashes
  let cleanUrl = envUrl.trim().replace(/\/+$/, '');

  // Safety check for production builds pointing to private local IP or localhost
  if (import.meta.env.PROD) {
    const isLocalhost = /localhost|127\.0\.0\.1|192\.168\.|10\.\d+\.\d+\.\d+/.test(cleanUrl);
    if (isLocalhost) {
      console.error(
        `🚨 [DOCUFLOW NETWORK WARNING] Production frontend is configured to call a local address (${cleanUrl}). Mobile devices and external networks will fail with Network Error. Please set VITE_API_URL to your public HTTPS backend URL.`
      );
    }
  }

  return cleanUrl;
};

export const API_BASE_URL = getNormalizedApiUrl();

if (import.meta.env.DEV) {
  console.log(`📡 [DOCUFLOW API] Initialized with Base URL: ${API_BASE_URL}`);
}
