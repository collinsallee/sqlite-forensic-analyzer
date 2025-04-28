// API configuration
const getApiBaseUrl = () => {
  // In production with Vercel, use relative paths for API calls
  if (typeof window !== 'undefined') {
    // We're in a browser environment
    if (window.location.hostname.includes('vercel.app') || window.location.hostname.includes('localhost')) {
      // In production or local development, use relative paths
      return '';
    }
  }
  
  // In Node.js environment (SSR), use the full URL from environment variable
  return process.env.NEXT_PUBLIC_API_URL || 'https://sqlite-forensic-analyzer-api.vercel.app';
};

// Prevents issue with the app trying to access window during SSR
let apiBaseUrl = '';
if (typeof window === 'undefined') {
  // Server-side rendering
  apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://sqlite-forensic-analyzer-api.vercel.app';
} else {
  // Client-side rendering
  apiBaseUrl = getApiBaseUrl();
}

export const API_BASE_URL = apiBaseUrl; 