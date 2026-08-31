/**
 * Centralized API Configuration for DocuFlow AI Frontend
 * Validates, normalizes, and constructs unambiguous backend endpoints
 * for Local Development, Netlify, Vercel, and Render Cloud Hosting.
 */

const getNormalizedApiUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;

  // 1. If environment variable is not defined
  if (!envUrl || !envUrl.trim()) {
    if (import.meta.env.DEV) {
      return 'http://localhost:5000/api/v1';
    }
    // Production default fallback - points to Render / Production API backend
    return 'https://duckflow-ai.onrender.com/api/v1';
  }

  // 2. Remove trailing slashes
  let cleanUrl = envUrl.trim().replace(/\/+$/, '');

  // 3. Ensure API version prefix (/api/v1) is present without duplicating
  if (!cleanUrl.endsWith('/api/v1') && !cleanUrl.endsWith('/api')) {
    cleanUrl = `${cleanUrl}/api/v1`;
  }

  // 4. Safety check for production builds pointing to private local IP or localhost
  if (import.meta.env.PROD) {
    const isLocalhost = /localhost|127\.0\.0\.1|192\.168\.|10\.\d+\.\d+\.\d+/.test(cleanUrl);
    if (isLocalhost) {
      console.warn(
        `🚨 [DOCUFLOW NETWORK WARNING] Production frontend is pointing to a local address (${cleanUrl}). External devices will fail. Please configure VITE_API_URL in your hosting provider (Netlify).`
      );
    }
  }

  return cleanUrl;
};

export const API_BASE_URL = getNormalizedApiUrl();

if (import.meta.env.DEV) {
  console.log(`📡 [DOCUFLOW API] Initialized with Base URL: ${API_BASE_URL}`);
}
