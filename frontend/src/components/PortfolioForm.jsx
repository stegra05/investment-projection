import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPortfolioById, createPortfolio, updatePortfolio } from '../services/portfolioService';

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
  const [createdAt, setCreatedAt] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isEditing) {
      getPortfolioById(id)
        .then((data) => {
          setName(data.name);
          setDescription(data.description || '');
          setCreatedAt(data.created_at);
          setUpdatedAt(data.updated_at);
        })
        .catch((err) => {
          console.error('Failed to load portfolio:', err);
          setError('Could not load portfolio.');
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isEditing) {
        await updatePortfolio(id, { name, description });
        navigate(`/portfolios/${id}`);
      } else {
        await createPortfolio({ name, description });
        navigate('/portfolios');
      }
    } catch (err) {
      console.error('Save failed:', err);
      setError(err.response?.data?.message || 'Save failed');
    }
  };

  if (loading) {
    return <p style={{ padding: 'var(--space-l)' }}>Loading...</p>;
  }

  return (
    <main style={{ margin: 'var(--space-xl) auto', padding: 'var(--space-l)', maxWidth: '600px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 'var(--space-m)' }}>
        {isEditing ? 'Edit Portfolio' : 'New Portfolio'}
      </h1>
      {error && <p style={{ color: 'var(--color-error)', marginBottom: 'var(--space-m)' }}>{error}</p>}
      {isEditing && (
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 'var(--space-m)' }}>
          <label htmlFor="createdAt" style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xs)' }}>Created At</label>
          <input
            id="createdAt"
            type="text"
            value={createdAt ? new Date(createdAt).toLocaleString() : ''}
            disabled
            style={{ padding: 'var(--space-s)', border: '1px solid var(--color-border)', borderRadius: '4px', background: 'var(--color-ui-background)', color: 'var(--color-text-secondary)' }}
          />
        </div>
      )}
      {isEditing && (
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 'var(--space-m)' }}>
          <label htmlFor="updatedAt" style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xs)' }}>Last Updated</label>
          <input
            id="updatedAt"
            type="text"
            value={updatedAt ? new Date(updatedAt).toLocaleString() : ''}
            disabled
            style={{ padding: 'var(--space-s)', border: '1px solid var(--color-border)', borderRadius: '4px', background: 'var(--color-ui-background)', color: 'var(--color-text-secondary)' }}
          />
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-m)' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="name" style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xs)' }}>Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ padding: 'var(--space-s)', border: '1px solid var(--color-border)', borderRadius: '4px', background: 'var(--color-ui-background)', color: 'inherit' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="description" style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xs)' }}>Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            style={{ padding: 'var(--space-s)', border: '1px solid var(--color-border)', borderRadius: '4px', background: 'var(--color-ui-background)', color: 'inherit' }}
          />
        </div>
        <button
          type="submit"
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-text-on-primary)', border: 'none', padding: 'var(--space-s)', borderRadius: '4px', fontSize: '1rem', fontWeight: 500, cursor: 'pointer' }}
        >
          {isEditing ? 'Save Changes' : 'Create Portfolio'}
        </button>
      </form>
    </main>
  );
}

export default PortfolioForm; 