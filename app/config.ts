// API configuration
const getApiBaseUrl = () => {
  // Use environment variable in production, fallback to localhost in development
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
};

export const API_BASE_URL = getApiBaseUrl(); 