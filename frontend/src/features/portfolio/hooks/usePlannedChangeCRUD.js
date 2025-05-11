import portfolioService from '../../../api/portfolioService';
import {
  SUCCESS_PLANNED_CHANGE_SAVED,
  SUCCESS_PLANNED_CHANGE_DELETED,
  ERROR_PLANNED_CHANGE_SAVE_FALLBACK,
  ERROR_PLANNED_CHANGE_DELETE_FALLBACK,
} from '../../../constants/textConstants';

export const usePlannedChangeCRUD = ({ portfolioId, refreshPortfolio, addNotification }) => {
  const savePlannedChange = async (changeDataFromPanel) => {
    if (!portfolioId) {
      const errorMsg = 'Portfolio not loaded. Cannot save change.';
      addNotification(errorMsg, 'error');
      throw new Error(errorMsg); // Re-throw for the calling component to handle if needed
    }

    const dataToSend = { ...changeDataFromPanel };
    const isUpdating = !!dataToSend.id;

    try {
      if (isUpdating) {
        const changeId = dataToSend.id;
        await portfolioService.updatePlannedChange(portfolioId, changeId, dataToSend);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...addData } = dataToSend; // Remove ID for add operations
        await portfolioService.addPlannedChange(portfolioId, addData);
      }
      if (refreshPortfolio) {
        await refreshPortfolio();
      }
      addNotification(SUCCESS_PLANNED_CHANGE_SAVED, 'success');
    } catch (apiError) {
      const errorMessage = apiError.response?.data?.message || apiError.response?.data?.detail || apiError.message || ERROR_PLANNED_CHANGE_SAVE_FALLBACK;
      addNotification(errorMessage, 'error');
      throw apiError; // Re-throw to be caught by UI components (e.g., AddEditChangePanel)
    }
  };

  const deletePlannedChange = async (changeId) => {
    if (!portfolioId) {
      addNotification('Portfolio not loaded. Cannot delete change.', 'error');
      return; // Don't throw, as this is often a direct UI action not in a sub-form
    }
    if (!changeId) {
      addNotification('Change ID missing. Cannot delete change.', 'error');
      return;
    }

    try {
      await portfolioService.deletePlannedChange(portfolioId, changeId);
      if (refreshPortfolio) {
        await refreshPortfolio();
      }
      addNotification(SUCCESS_PLANNED_CHANGE_DELETED, 'success');
      // Return true or some indicator of success if needed by the caller to update its state
      return true; 
    } catch (apiError) {
      const errorMessage = apiError.response?.data?.message || apiError.response?.data?.detail || apiError.message || ERROR_PLANNED_CHANGE_DELETE_FALLBACK;
      addNotification(errorMessage, 'error');
      // Optionally re-throw if the caller needs to know about the error specifically
      // throw apiError;
      return false;
    }
  };

  return {
    savePlannedChange,
    deletePlannedChange,
  };
}; 