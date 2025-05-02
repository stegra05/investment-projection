const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';

export const ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
  },
  PORTFOLIO: {
    LIST: `${API_BASE_URL}/portfolios`,
    DETAIL: (id) => `${API_BASE_URL}/portfolios/${id}`,
  },
  PROJECTION: {
    RUN: `${API_BASE_URL}/projection/run`,
  },
};

export default API_BASE_URL; 