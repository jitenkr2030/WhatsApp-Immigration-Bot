import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Visa-related endpoints
export const checkVisaEligibility = async (visaData) => {
  try {
    const response = await api.post('/visa/eligibility', visaData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const submitVisaApplication = async (applicationData) => {
  try {
    const response = await api.post('/visa/apply', applicationData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getVisaStatus = async (applicationId) => {
  try {
    const response = await api.get(`/visa/status/${applicationId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Health check endpoint
export const checkBackendHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};