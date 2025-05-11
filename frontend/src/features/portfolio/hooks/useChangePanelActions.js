import { useState } from 'react';
import { prepareFinalPlannedChangeData } from '../utils/plannedChangeUtils';

export const useChangePanelActions = ({
  formData,
  allocationSum,
  targetAllocationsDisplay,
  onSave,
  onPreviewRequest,
  onClose, // To close panel on successful save
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  const handleSubmit = async (event) => {
    if (event) event.preventDefault(); 
    setSubmitError(null); // Clear previous errors
    const { error, data: dataToSave } = prepareFinalPlannedChangeData(formData, allocationSum, targetAllocationsDisplay);

    if (error) {
      setSubmitError(error);
      return;
    }
    // Defensive check, though prepareFinalPlannedChangeData should handle this
    if (!dataToSave) { 
        setSubmitError("No data available to save. Please check form inputs.");
        return;
    }

    setIsSubmitting(true);
    try {
      await onSave(dataToSave);
      if (onClose) onClose(); // Close panel on success
    } catch (err) { 
      console.error('Submission failed in hook:', err);
      setSubmitError(err.message || 'Failed to save planned change. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreview = async () => {
    setPreviewError(null); // Clear previous errors
    const { error, data: dataForPreview } = prepareFinalPlannedChangeData(formData, allocationSum, targetAllocationsDisplay);

    if (error) {
      setPreviewError(error);
      return;
    }
    // Defensive check
    if (!dataForPreview) { 
        setPreviewError("No data available for preview. Please check form inputs.");
        return;
    }
    
    setIsPreviewing(true);
    try {
      await onPreviewRequest(dataForPreview);
    } catch (err) { 
      console.error('Preview request failed in hook:', err);
      setPreviewError(err.message || 'Failed to request preview. Please try again.');
    } finally {
      setIsPreviewing(false);
    }
  };

  return {
    handleSubmit,
    handlePreview,
    isSubmitting,
    submitError,
    setSubmitError, // Expose setters to allow clearing them from the component if needed
    isPreviewing,
    previewError,
    setPreviewError, // Expose setters
  };
}; 