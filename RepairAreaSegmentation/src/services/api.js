// api.js — Axios service for the Road Inspector AI backend
import axios from 'axios';

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL)
  ? import.meta.env.VITE_API_URL
  : 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export const checkHealth = () => api.get('/health');

export const getConstants = () => api.get('/constants');

export const segmentArea = (payload) => api.post('/predict', payload);

// Module 1 + Module 2 combined inference endpoint
// Timeout extended to 120 s to accommodate optional depth estimation
export const repairAreaSegmentation = (formData) => api.post('/repair-area-segmentation', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
  timeout: 120000,
});

// Dedicated Depth Anything V2 monocular depth estimation endpoint
export const estimateDepth = (formData) => api.post('/depth-estimation', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
  timeout: 120000,
});

export const getHistory = () => api.get('/results');
export const uploadReport = (formData) => api.post('/uploadReport', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const uploadResult = (payload) => api.post('/results', payload);

export const getCitizenReports = () => api.get('/citizen-reports');
export const createCitizenReport = (payload) => api.post('/citizen-reports', payload);

export const getModule2Analytics = () => api.get('/analytics/module2');
export const getValidationData = () => api.get('/validation');
export const saveValidationRecord = (payload) => api.post('/validation', payload);

export default api;


