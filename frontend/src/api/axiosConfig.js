import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
});

const clearContentType = (headers) => {
  if (!headers) return;

  if (typeof headers.delete === 'function') {
    headers.delete('Content-Type');
    headers.delete('content-type');
    return;
  }

  delete headers['Content-Type'];
  delete headers['content-type'];
};

// Add a request interceptor to inject the token
api.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      clearContentType(config.headers);
    } else if (!config.headers?.['Content-Type'] && !config.headers?.['content-type']) {
      config.headers['Content-Type'] = 'application/json';
    }

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
