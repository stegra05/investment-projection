import instance from './axiosInstance';

const projectionService = {
  /**
   * Initiates a portfolio projection calculation task.
   * @param {string|number} portfolioId - The ID of the portfolio to project.
   * @param {object} params - Projection parameters.
   * @param {string} params.start_date - Start date in 'YYYY-MM-DD' format.
   * @param {string} params.end_date - End date in 'YYYY-MM-DD' format.
   * @param {number} params.initial_total_value - Initial portfolio value.
   * @returns {Promise<string>} A promise that resolves to the task ID.
   * @throws {Error} Throws an error if the API request fails.
   */
  startProjection: async (portfolioId, params) => {
    try {
      console.log('Starting projection with params:', { portfolioId, params });

      const response = await instance.post(`/portfolios/${portfolioId}/projections`, params, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Projection response:', {
        status: response.status,
        data: response.data,
        headers: response.headers,
      });

      if (response.status !== 200 && response.status !== 202) {
        throw new Error(`Unexpected status code: ${response.status}`);
      }

      if (!response.data?.task_id) {
        console.error('Invalid response format:', response.data);
        throw new Error('Task ID not found in response');
      }

      return response.data.task_id;
    } catch (error) {
      console.error('Error starting projection:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },

  /**
   * Retrieves the status of a projection task.
   * @param {string} taskId - The ID of the task to check.
   * @returns {Promise<object>} A promise that resolves to the task status object.
   * @throws {Error} Throws an error if the API request fails.
   */
  getProjectionTaskStatus: async taskId => {
    try {
      const response = await instance.get(`/tasks/${taskId}`, {
        headers: {
          Accept: 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error checking task status for task ${taskId}:`, {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },

  /**
   * Runs a preview projection for a portfolio with a draft change.
   * @param {string|number} portfolioId - The ID of the portfolio.
   * @param {object} params - Projection parameters (start_date, end_date, initial_total_value).
   * @param {object} draftChange - The draft planned change to include in the preview.
   * @returns {Promise<object>} A promise that resolves to the preview projection data.
   * @throws {Error} Throws an error if the API request fails.
   */
  runPreviewProjection: async (portfolioId, params, draftChange) => {
    try {
      const payload = {
        projection_params: params,
        draft_change: draftChange,
      };
      console.log('Running preview projection with payload:', { portfolioId, payload });

      // Assuming the preview endpoint is /portfolios/{portfolioId}/projections/preview
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
        console.error('Preview projection API error:', {
          status: response.status,
          data: response.data,
        });
        throw new Error(`Error running preview projection: Status ${response.status}`);
      }

      // ProjectionPanel.js expects resultData.data to be the timeseries.
      // We assume the API for preview returns an object structured like: { data: { "date1": value1, ... } }
      console.log('Preview projection response data:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in runPreviewProjection service call:', {
        message: error.message,
        responseStatus: error.response?.status,
        responseData: error.response?.data,
      });
      throw error; // Rethrow the original error to be handled by the caller
    }
  },
};

export default projectionService;
