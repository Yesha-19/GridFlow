import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Centralized logging point. Swap for a real telemetry sink (Sentry, etc.)
    // before the demo if you want to track backend flakiness live.
    const status = error.response?.status;
    const url = error.config?.url;
    console.warn(`[api] request failed${status ? ` (${status})` : ''}: ${url}`);
    return Promise.reject(error);
  }
);

export default api;
