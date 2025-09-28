import axios from 'axios';

// Base API configuration with fallback to production server
const getApiBaseUrl = () => {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl) {
    return envUrl;
  }
  
  // Check if we're in development (localhost available)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  
  // Fallback to production server
  return 'https://zyra-dao.onrender.com/api';
};

const API_BASE_URL = getApiBaseUrl();
console.log('API Base URL:', API_BASE_URL);

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('🔍 API Request - Token from localStorage:', token ? token.substring(0, 20) + '...' : 'No token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Added Authorization header to request');
    } else {
      console.log('❌ No token found in localStorage');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors and connection failures
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Only redirect if not already on the home page to prevent loops
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    
    // Handle connection failures - could implement retry logic here
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
      console.warn('🔄 Connection failed, consider switching to production server');
    }
    
    return Promise.reject(error);
  }
);

// API endpoints
export const api = {
  // Auth endpoints
  auth: {
    login: (data: { address: string; message: string; signature: string }) =>
      apiClient.post('/auth/authenticate', data),
    register: (data: { address: string; message: string; signature: string }) =>
      apiClient.post('/auth/register', data),
    me: () => apiClient.get('/auth/me'),
  },

  // Proposal endpoints
  proposals: {
    getAll: (params?: { page?: number; limit?: number; status?: string }) =>
      apiClient.get('/proposals', { params }),
    getById: (id: string) => apiClient.get(`/proposals/${id}`),
    create: (data: any) => apiClient.post('/proposals', data),
    update: (id: string, data: any) => apiClient.put(`/proposals/${id}`, data),
    delete: (id: string) => apiClient.delete(`/proposals/${id}`),
  },

  // Voting endpoints
  voting: {
    commit: (data: { proposalId: string; commitHash: string }) =>
      apiClient.post('/voting/commit', data),
    reveal: (data: { proposalId: string; vote: boolean; salt: string }) =>
      apiClient.post('/voting/reveal', data),
    getVotes: (proposalId: string) => apiClient.get(`/voting/${proposalId}/votes`),
  },

  // Treasury endpoints
  treasury: {
    getSummary: () => apiClient.get('/treasury/balance'),
    getTransactions: (params?: { page?: number; limit?: number }) =>
      apiClient.get('/treasury/transactions', { params }),
    createTransaction: (data: any) =>
      apiClient.post('/treasury/transactions', data),
    executeProposal: (proposalId: string) =>
      apiClient.post(`/treasury/execute/${proposalId}`),
    simulateAllocation: (data: any) =>
      apiClient.post('/treasury/simulate', data),
  },

  // AI endpoints
  ai: {
    summarizeProposal: (data: { text: string }) =>
      apiClient.post('/ai/summarize', data),
    generateTreasuryInsights: (data: { data: any }) =>
      apiClient.post('/ai/treasury-insights', data),
  },

  // Members endpoints
  members: {
    getAll: (params?: { page?: number; limit?: number; role?: string; search?: string }) =>
      apiClient.get('/members', { params }),
    getById: (walletAddress: string) =>
      apiClient.get(`/members/${walletAddress}`),
    getStats: (walletAddress: string) =>
      apiClient.get(`/members/${walletAddress}/stats`),
    getLeaderboard: (type?: string, limit?: number) =>
      apiClient.get('/members/leaderboard', { params: { type, limit } }),
    getDAOStats: () =>
      apiClient.get('/members/stats'),
    updateProfile: (data: any) =>
      apiClient.put('/members/profile', data),
    createOrUpdate: (data: { walletAddress: string }) =>
      apiClient.post('/members', data),
  },

  // Health check
  health: () => apiClient.get('/health'),
};

export default api;