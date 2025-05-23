import instance from './axiosInstance';

/**
 * @typedef {object} ProjectionParams
 * @property {string} start_date - Start date for the projection in 'YYYY-MM-DD' format.
 * @property {string} end_date - End date for the projection in 'YYYY-MM-DD' format.
 * @property {number} initial_total_value - The initial total value of the portfolio for the projection.
 * @property {Array<PlannedChange>} [planned_changes] - Optional array of planned changes to include in the projection.
 */

/**
 * @typedef {object} PlannedChange
 * @property {string} date - Date of the change (YYYY-MM-DD).
 * @property {string} type - Type of change (e.g., 'DEPOSIT', 'WITHDRAWAL', 'REBALANCE_TARGETS').
 * @property {number} [value] - Value for deposit/withdrawal.
 * @property {string} [description] - Description of the change.
 * @property {Array<object>} [target_allocations] - For rebalancing, target allocations (e.g., [{asset_id: 'AAPL', percentage: 50}]).
 */

/**
 * @typedef {object} TaskStatus
 * @property {string} task_id - The ID of the task.
 * @property {'PENDING'|'STARTED'|'SUCCESS'|'FAILURE'|'RETRY'|'REVOKED'} status - Current status of the task.
 * @property {object} [result] - The result of the task if completed (structure depends on the task).
 *                               For projections, this might include URLs to data or embedded data.
 * @property {string} [error_message] - Error message if the task failed.
 * @property {number} [progress_percent] - Optional progress percentage.
 */

/**
 * @typedef {object} ProjectionPreviewResult
 * @property {object} data - The timeseries data for the projection, typically an object mapping dates to values.
 *                           Example: `{"2024-01-01": 10000, "2024-01-02": 10050, ...}`
 * @property {object} [summary] - Optional summary statistics of the projection.
 */

/**
 * Service for handling portfolio projection operations.
 * This includes starting asynchronous projection tasks, checking task statuses,
 * and running synchronous projection previews.
 */
const projectionService = {
  /**
   * Initiates an asynchronous portfolio projection calculation task on the backend.
   * Makes a POST request to `/portfolios/{portfolioId}/projections`.
   * @param {string|number} portfolioId - The ID of the portfolio to project.
   * @param {ProjectionParams} params - Projection parameters including dates, initial value, and any planned changes.
   * @returns {Promise<string>} A promise that resolves to the task ID (string) for tracking the projection status.
   * @throws {Error} Throws an error if the API request fails (e.g., non-200/202 status) or if the task ID is not found in the response.
   */
  startProjection: async (portfolioId, params) => {
    const response = await instance.post(`/portfolios/${portfolioId}/projections`, params, {
      headers: {
        'Content-Type': 'application/json', // Ensure server expects JSON
      },
    });

    // Backend should ideally return 202 Accepted for async tasks, but 200 OK might also be used.
    if (response.status !== 200 && response.status !== 202) {
      throw new Error(`Unexpected status code from startProjection: ${response.status}`);
    }

    if (!response.data?.task_id) {
      throw new Error('Task ID not found in startProjection response');
    }

    return response.data.task_id;
  },

  /**
   * Retrieves the status and result (if available) of a previously initiated projection task.
   * Makes a GET request to `/tasks/{taskId}`.
   * @param {string} taskId - The ID of the projection task to check.
   * @returns {Promise<TaskStatus>} A promise that resolves to the task status object,
   *                                which includes the current state, and potentially results or errors.
   * @throws {Error} Throws an error if the API request fails.
   */
  getProjectionTaskStatus: async taskId => {
    const response = await instance.get(`/tasks/${taskId}`, {
      headers: {
        Accept: 'application/json', // Ensure server returns JSON
      },
    });
    // Assuming the response data directly matches the TaskStatus structure.
    return response.data;
  },

  /**
   * Runs a synchronous "preview" projection for a portfolio, typically including a single draft planned change.
   * This is useful for showing users the immediate impact of a change before it's saved.
   * Makes a POST request to `/portfolios/{portfolioId}/projections/preview`.
   * @param {string|number} portfolioId - The ID of the portfolio.
   * @param {Omit<ProjectionParams, 'planned_changes'>} params - Core projection parameters (start_date, end_date, initial_total_value).
   *                                                              Planned changes are usually handled by `draftChange` for previews.
   * @param {PlannedChange} draftChange - The draft planned change to include in the preview calculation.
   * @returns {Promise<ProjectionPreviewResult>} A promise that resolves to the preview projection data,
   *                                             typically including a timeseries.
   * @throws {Error} Throws an error if the API request fails (e.g., non-200 status).
   */
  runPreviewProjection: async (portfolioId, params, draftChange) => {
    const payload = {
      projection_params: params, // Core parameters like dates, initial value
      draft_change: draftChange,   // The specific change to preview
    };

    const response = await instance.post(
      `/portfolios/${portfolioId}/projections/preview`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status !== 200) {
      throw new Error(`Error running preview projection: Status ${response.status}`);
    }

    // Assumes the API returns an object that matches ProjectionPreviewResult.
    // Specifically, ProjectionPanel.js uses resultData.data for the timeseries.
    return response.data;
  },
};

export default projectionService;
