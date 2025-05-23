/**
 * @file api.js
 * @description Configuration for API endpoints and the base URL.
 * This file centralizes all API endpoint definitions, making it easier to manage and update
 * API paths across the application.
 */

/**
 * Base URL for all API requests.
 * It attempts to read from the `VITE_API_BASE_URL` environment variable (set at build time, typical for Vite projects).
 * If the environment variable is not set, it defaults to a local development URL.
 * This allows for different API endpoints in development, staging, and production environments.
 * @type {string}
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * A structured object containing all API endpoint paths used in the application.
 * Endpoints are categorized by resource (e.g., `AUTH`, `PORTFOLIO`).
 * Some endpoints are static strings, while others are functions that generate dynamic URLs
 * based on provided parameters (e.g., portfolio ID, asset ID).
 * All endpoints are constructed using the `API_BASE_URL`.
 * @namespace ENDPOINTS
 */
export const ENDPOINTS = {
  /**
   * @memberof ENDPOINTS
   * @namespace AUTH
   * @description Authentication related endpoints.
   */
  AUTH: {
    /** User login endpoint. */
    LOGIN: `${API_BASE_URL}/auth/login`,
    /** User registration endpoint. */
    REGISTER: `${API_BASE_URL}/auth/register`,
    /** User logout endpoint. */
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    /** Endpoint to fetch current authenticated user's details. */
    ME: `${API_BASE_URL}/users/me`,
  },
  /**
   * @memberof ENDPOINTS
   * @namespace PORTFOLIO
   * @description Portfolio related endpoints.
   */
  PORTFOLIO: {
    /** Endpoint to list all portfolios for the current user or create a new portfolio. */
    LIST: `${API_BASE_URL}/portfolios/`,
    /**
     * Generates endpoint for fetching, updating, or deleting a specific portfolio.
     * @param {string|number} portfolioId - The ID of the portfolio.
     * @returns {string} The portfolio detail endpoint URL.
     */
    DETAIL: portfolioId => `${API_BASE_URL}/portfolios/${portfolioId}/`,
    /**
     * Generates endpoint for adding an asset to a specific portfolio.
     * @param {string|number} portfolioId - The ID of the portfolio.
     * @returns {string} The add asset endpoint URL.
     */
    ADD_ASSET: portfolioId => `${API_BASE_URL}/portfolios/${portfolioId}/assets/`,
    /**
     * Generates endpoint for updating a specific asset within a portfolio.
     * @param {string|number} portfolioId - The ID of the portfolio.
     * @param {string|number} assetId - The ID of the asset.
     * @returns {string} The update asset endpoint URL.
     */
    UPDATE_ASSET: (portfolioId, assetId) =>
      `${API_BASE_URL}/portfolios/${portfolioId}/assets/${assetId}/`,
    /**
     * Generates endpoint for deleting a specific asset from a portfolio.
     * @param {string|number} portfolioId - The ID of the portfolio.
     * @param {string|number} assetId - The ID of the asset.
     * @returns {string} The delete asset endpoint URL.
     */
    DELETE_ASSET: (portfolioId, assetId) =>
      `${API_BASE_URL}/portfolios/${portfolioId}/assets/${assetId}/`,
    /**
     * Generates endpoint for fetching planned changes for a specific portfolio.
     * Also used for adding a new planned change if POSTing to this collection.
     * @param {string|number} portfolioId - The ID of the portfolio.
     * @returns {string} The planned changes list/add endpoint URL.
     */
    GET_PLANNED_CHANGES: portfolioId => `${API_BASE_URL}/portfolios/${portfolioId}/changes/`,
    /**
     * Generates endpoint for adding a new planned change to a specific portfolio. (Often same as GET_PLANNED_CHANGES for RESTful collections)
     * @param {string|number} portfolioId - The ID of the portfolio.
     * @returns {string} The add planned change endpoint URL.
     */
    ADD_PLANNED_CHANGE: portfolioId => `${API_BASE_URL}/portfolios/${portfolioId}/changes/`,
    /**
     * Generates endpoint for updating a specific planned change within a portfolio.
     * @param {string|number} portfolioId - The ID of the portfolio.
     * @param {string|number} changeId - The ID of the planned change.
     * @returns {string} The update planned change endpoint URL.
     */
    UPDATE_PLANNED_CHANGE: (portfolioId, changeId) =>
      `${API_BASE_URL}/portfolios/${portfolioId}/changes/${changeId}/`,
    /**
     * Generates endpoint for deleting a specific planned change from a portfolio.
     * @param {string|number} portfolioId - The ID of the portfolio.
     * @param {string|number} changeId - The ID of the planned change.
     * @returns {string} The delete planned change endpoint URL.
     */
    DELETE_PLANNED_CHANGE: (portfolioId, changeId) =>
      `${API_BASE_URL}/portfolios/${portfolioId}/changes/${changeId}/`,
    /**
     * Generates endpoint for running a projection for a specific portfolio.
     * @param {string|number} portfolioId - The ID of the portfolio.
     * @returns {string} The run projection endpoint URL.
     */
    RUN_PROJECTION: portfolioId => `${API_BASE_URL}/portfolios/${portfolioId}/projections/`,
    /**
     * Generates endpoint for previewing a projection for a specific portfolio, often with draft changes.
     * @param {string|number} portfolioId - The ID of the portfolio.
     * @returns {string} The preview projection endpoint URL.
     */
    PREVIEW_PROJECTION: portfolioId =>
      `${API_BASE_URL}/portfolios/${portfolioId}/projections/preview/`,
  },
  // Other resource categories (e.g., USER_SETTINGS, TASKS) can be added here.
};

/**
 * The base URL for API requests. Exported for direct use if needed, though `ENDPOINTS` is preferred for most cases.
 * @type {string}
 */
export default API_BASE_URL;
