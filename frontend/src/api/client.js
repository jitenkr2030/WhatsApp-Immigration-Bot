import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const visaAPI = {
  checkEligibility: (data) => apiClient.post('/visa/eligibility', data),
  submitApplication: (data) => apiClient.post('/visa/apply', data),
  getStatus: (applicationId) => apiClient.get(`/visa/status/${applicationId}`)
};

export const documentsAPI = {
  upload: (formData) => apiClient.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getList: () => apiClient.get('/documents')
};

export const userAPI = {
  login: (credentials) => apiClient.post('/users/login', credentials),
  register: (userData) => apiClient.post('/users/register', userData),
  getProfile: () => apiClient.get('/users/profile')
};

export const paymentsAPI = {
  createSession: (serviceType) => apiClient.post('/payments/create-session', { serviceType }),
  getHistory: () => apiClient.get('/payments/history')
};

export default apiClient;