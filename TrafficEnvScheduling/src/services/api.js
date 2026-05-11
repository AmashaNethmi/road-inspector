// api.js — Axios service for the Flask AI backend
import axios from 'axios';

const API_BASE = 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export const checkHealth = () => api.get('/health');

export const getConstants = () => api.get('/constants');

export const predictTraffic = (payload) => api.post('/predict', payload);

export const getHistory = () => api.get('/history');

export default api;
