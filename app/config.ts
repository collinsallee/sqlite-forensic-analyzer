// API configuration
const getApiBaseUrl = () => {
  // In the browser, use relative URL for API calls which will be handled by our API route
  if (typeof window !== 'undefined') {
    return '';
  }
  // In server context (SSR), use the full URL from environment variable
  return process.env.NEXT_PUBLIC_API_URL || 'https://sqlite-forensic-analyzer-api.vercel.app';
};

export const API_BASE_URL = getApiBaseUrl(); 