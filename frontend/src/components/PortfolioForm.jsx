import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPortfolioById, createPortfolio, updatePortfolio } from '../services/portfolioService';
import Button from './Button';
import styles from './PortfolioForm.module.css';

/**
 * A page component for creating a new portfolio or editing an existing one.
 *
 * Fetches portfolio data based on the URL parameter (`id`) if editing.
 * Provides input fields for portfolio name and description.
 * Handles form submission for creating or updating the portfolio via portfolioService.
 * Navigates the user upon successful save or if loading fails.
 *
 * @returns {JSX.Element} The PortfolioForm page component.
 */
function PortfolioForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(isEditing);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdAt, setCreatedAt] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isEditing) {
      setLoading(true);
      getPortfolioById(id)
        .then((data) => {
          setName(data.name);
          setDescription(data.description || '');
          setCreatedAt(data.created_at);
          setUpdatedAt(data.updated_at);
        })
        .catch((err) => {
          console.error('Failed to load portfolio:', err);
          setError('Could not load portfolio details.');
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      let savedPortfolio;
      if (isEditing) {
        savedPortfolio = await updatePortfolio(id, { name, description });
      } else {
        savedPortfolio = await createPortfolio({ name, description });
      }
      navigate(`/portfolios/${savedPortfolio.portfolio_id || id}`);
    } catch (err) {
      console.error('Save failed:', err);
      setError(err.response?.data?.message || 'Failed to save portfolio. Please check the details.');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(isEditing ? `/portfolios/${id}` : '/portfolios');
  };

  if (loading) {
    return <p className={styles.loadingText}>Loading...</p>;
  }

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.title}>
        {isEditing ? 'Edit Portfolio' : 'New Portfolio'}
      </h1>
      {error && <p className={styles.errorMessage}>{error}</p>}

      {isEditing && (
        <div className={styles.metaInfoContainer}>
          <div className={styles.formGroup}>
            <label htmlFor="createdAt" className={styles.label}>Created At</label>
            <input
              id="createdAt"
              type="text"
              value={createdAt ? new Date(createdAt).toLocaleString() : 'N/A'}
              disabled
              className={`${styles.inputField} ${styles.inputFieldDisabled}`}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="updatedAt" className={styles.label}>Last Updated</label>
            <input
              id="updatedAt"
              type="text"
              value={updatedAt ? new Date(updatedAt).toLocaleString() : 'N/A'}
              disabled
              className={`${styles.inputField} ${styles.inputFieldDisabled}`}
            />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.portfolioForm}>
        <div className={styles.formGroup}>
          <label htmlFor="name" className={styles.label}>Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={styles.inputField}
            placeholder="e.g., Retirement Savings, House Down Payment"
            disabled={isSubmitting}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description" className={styles.label}>Description (Optional)</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className={styles.textareaField}
            placeholder="Add a brief description of this portfolio's purpose..."
            disabled={isSubmitting}
          />
        </div>

        <div className={styles.formActions}>
          <Button 
            type="button" 
            variant="secondary" 
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="primary" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Portfolio')}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default PortfolioForm; 