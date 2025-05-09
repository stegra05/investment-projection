import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Input from '../../../components/Input/Input'; // Assuming path is correct
import Button from '../../../components/Button/Button'; // Assuming path is correct

function CreatePortfolioModal({
  isOpen = false,
  onClose = () => {},
  onSubmit = () => {},
  isLoading = false,
  error = null,
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleInternalSubmit = e => {
    e.preventDefault();
    // Basic validation (can be expanded)
    if (!name.trim()) {
      // Handle validation error (e.g., show a message)
      console.warn('Portfolio name is required.');
      return;
    }
    onSubmit({ name, description }); // Pass data up to parent
  };

  if (!isOpen) {
    return null;
  }

  return (
    // Basic Modal structure (overlay + content box)
    // Consider using a dedicated Modal component if available
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Create New Portfolio</h2>
        <form onSubmit={handleInternalSubmit}>
          <div className="mb-4">
            <Input
              label="Portfolio Name"
              id="portfolioName"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Retirement Savings"
              required
              disabled={isLoading}
            />
          </div>
          <div className="mb-6">
            <Input
              label="Description (Optional)"
              id="portfolioDescription"
              type="text" // Or could be textarea if Input supports it
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g., Long-term investments"
              disabled={isLoading}
            />
          </div>

          {error && <p className="text-red-600 mb-4">Error: {error}</p>}

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading}>
              {isLoading ? 'Creating...' : 'Create Portfolio'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

CreatePortfolioModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.string,
};

export default CreatePortfolioModal;
