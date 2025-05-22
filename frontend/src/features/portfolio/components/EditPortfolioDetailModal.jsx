import React from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmationModal from '../../../components/Modal/ConfirmationModal';
import Input from '../../../components/Input/Input';
import AlertMessage from '../../../components/AlertMessage/AlertMessage';
import {
  PLACEHOLDER_PORTFOLIO_DESCRIPTION,
  PLACEHOLDER_PORTFOLIO_NAME,
} from '../../../constants/textConstants';

const EditPortfolioDetailModal = ({
  isOpen,
  onClose,
  onSave,
  editingField, // 'name' or 'description'
  editValue,
  setEditValue,
  isSubmitting,
  notification, // { type: '', message: '' }
}) => {
  if (!isOpen) return null;

  const fieldLabel = editingField === 'name' ? 'Portfolio Name' : 'Portfolio Description';
  const inputType = editingField === 'description' ? 'textarea' : 'text';
  const placeholder = 
    editingField === 'description'
      ? PLACEHOLDER_PORTFOLIO_DESCRIPTION || 'Add a description...'
      : editingField === 'name'
        ? PLACEHOLDER_PORTFOLIO_NAME || 'Enter portfolio name'
        : '';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
        >
          <ConfirmationModal
            isOpen={isOpen} // Manages internal elements but main visibility by AnimatePresence
            onClose={onClose}
            onConfirm={onSave}
            title={`Edit ${editingField.charAt(0).toUpperCase() + editingField.slice(1)}`}
            confirmText={isSubmitting ? 'Saving...' : 'Save Changes'}
            isConfirming={isSubmitting}
          >
            <div className="my-4">
              {notification && notification.message && (
                <div className="mb-3">
                  <AlertMessage type={notification.type} message={notification.message} />
                </div>
              )}
              <Input
                label={fieldLabel}
                type={inputType}
                id={`edit-${editingField}`}
                name={`edit-${editingField}`}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                rows={editingField === 'description' ? 4 : undefined}
                placeholder={placeholder}
                // Add any necessary aria attributes or classes for styling
              />
            </div>
          </ConfirmationModal>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Define PropTypes
EditPortfolioDetailModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  editingField: PropTypes.oneOf(['name', 'description']).isRequired,
  editValue: PropTypes.string.isRequired,
  setEditValue: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  notification: PropTypes.shape({
    type: PropTypes.string,
    message: PropTypes.string,
  }).isRequired,
};

export default EditPortfolioDetailModal; 