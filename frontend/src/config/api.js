const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';

export const ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    ME: `${API_BASE_URL}/users/me`,
  },
  PORTFOLIO: {
    LIST: `${API_BASE_URL}/portfolios/`,
    DETAIL: portfolioId => `${API_BASE_URL}/portfolios/${portfolioId}/`,
    ADD_ASSET: portfolioId => `${API_BASE_URL}/portfolios/${portfolioId}/assets/`,
    UPDATE_ASSET: (portfolioId, assetId) =>
      `${API_BASE_URL}/portfolios/${portfolioId}/assets/${assetId}/`,
    DELETE_ASSET: (portfolioId, assetId) =>
      `${API_BASE_URL}/portfolios/${portfolioId}/assets/${assetId}/`,
    GET_PLANNED_CHANGES: portfolioId => `${API_BASE_URL}/portfolios/${portfolioId}/changes/`,
    ADD_PLANNED_CHANGE: portfolioId => `${API_BASE_URL}/portfolios/${portfolioId}/changes/`,
    UPDATE_PLANNED_CHANGE: (portfolioId, changeId) =>
      `${API_BASE_URL}/portfolios/${portfolioId}/changes/${changeId}/`,
    DELETE_PLANNED_CHANGE: (portfolioId, changeId) =>
      `${API_BASE_URL}/portfolios/${portfolioId}/changes/${changeId}/`,
    RUN_PROJECTION: portfolioId => `${API_BASE_URL}/portfolios/${portfolioId}/projections/`,
    PREVIEW_PROJECTION: portfolioId =>
      `${API_BASE_URL}/portfolios/${portfolioId}/projections/preview/`,
  },
};

export default API_BASE_URL;
