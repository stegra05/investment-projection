import React, { useState, useEffect } from 'react';
// import axios from 'axios'; // Use apiClient instead
import apiClient from '../services/apiClient'; // Import the shared apiClient
import { PlusIcon } from '@heroicons/react/24/outline';

// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'; // Handled by apiClient

/**
 * A form component for creating or editing a planned future change within a portfolio.
 *
 * Handles input fields for change type, date, amount, and description.
 * Manages loading and error states. Calls appropriate service functions via apiClient
 * on submit.
 *
 * @param {object} props - The component props.
 * @param {string|number} props.portfolioId - The ID of the portfolio this change belongs to.
 * @param {object} [props.existingChange=null] - If provided, the form will be pre-filled with this change's data
 *                                              for editing. If null, the form is for creating a new change.
 * @param {Function} props.onSaved - Callback function executed successfully after creating or updating a change.
 * @param {Function} [props.onCancel] - Optional callback function executed when the cancel button is clicked.
 * @returns {JSX.Element} The ChangeForm component.
 */
export default function ChangeForm({ portfolioId, existingChange = null, onSaved, onCancel }) {
  const isEditing = Boolean(existingChange);
  const [changeType, setChangeType] = useState('');
  const [changeDate, setChangeDate] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(isEditing);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (isEditing && existingChange) {
      setChangeType(existingChange.change_type || '');
      // Ensure date is in yyyy-mm-dd format for input type="date"
      setChangeDate(existingChange.change_date ? new Date(existingChange.change_date).toISOString().split('T')[0] : '');
      setAmount(existingChange.amount ?? '');
      setDescription(existingChange.description ?? '');
      setLoading(false);
    } else {
        // Reset form for adding new
        setChangeType('');
        setChangeDate('');
        setAmount('');
        setDescription('');
        setLoading(false);
    }
  }, [existingChange, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // No need to check token explicitly, apiClient handles it
    // if (!token) {
    //     setError('Authentication error. Please log in again.');
    //     return;
    // }
    if (!changeType || !changeDate || amount === '') {
        setError('Change Type, Date, and Amount are required fields.');
        return;
    }

    try {
      const payload = {
        change_type: changeType,
        change_date: changeDate,
        amount: parseFloat(amount),
        description,
      };
      // const config = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }; // Not needed with apiClient

      if (isEditing && existingChange) {
        await apiClient.put(`/portfolios/${portfolioId}/changes/${existingChange.change_id}`, payload);
        // await axios.put(`${API_URL}/portfolios/${portfolioId}/changes/${existingChange.change_id}`, payload, config);
      } else {
        await apiClient.post(`/portfolios/${portfolioId}/changes`, payload);
        // await axios.post(`${API_URL}/portfolios/${portfolioId}/changes`, payload, config);
      }
      onSaved(); // Signal success
    } catch (err) {
      console.error('Change save failed:', err);
      setError(err.response?.data?.message || 'Failed to save change. Please check the details.');
    }
  };

  if (loading) {
    return <p>Loading change details...</p>;
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 'var(--space-l)', border: '1px solid var(--color-border-light)', padding: 'var(--space-m)', borderRadius: '4px', background: 'var(--color-ui-background-light)' }}>
      <h3 style={{ marginTop: 0, marginBottom: 'var(--space-m)', fontSize: '1.25rem', fontWeight: 600 }}>
        {isEditing ? 'Edit Planned Change' : 'Add New Planned Change'}
      </h3>
      {error && <p style={{ color: 'var(--color-error-light)', marginBottom: 'var(--space-m)', background: 'rgba(222, 53, 11, 0.1)', padding: 'var(--space-s)', borderRadius: '4px' }}>{error}</p>}

      <div style={{ marginBottom: 'var(--space-m)' }}>
        <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.875rem', color: 'var(--color-text-secondary-light)' }}>Change Type*</label>
        <input
          type="text"
          placeholder="e.g., Contribution, Withdrawal, Rebalance"
          value={changeType}
          onChange={(e) => setChangeType(e.target.value)}
          required
          style={{ width: '100%', padding: 'var(--space-s)', border: '1px solid var(--color-border-light)', borderRadius: '4px', background: 'var(--color-ui-background-light)', color: 'var(--color-text-primary-light)' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-m)', marginBottom: 'var(--space-m)' }}>
        <div>
            <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.875rem', color: 'var(--color-text-secondary-light)' }}>Date*</label>
            <input
              type="date"
              value={changeDate}
              onChange={(e) => setChangeDate(e.target.value)}
              required
              style={{ width: '100%', padding: 'var(--space-s)', border: '1px solid var(--color-border-light)', borderRadius: '4px', background: 'var(--color-ui-background-light)', color: 'var(--color-text-primary-light)' }}
            />
        </div>
        <div>
            <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.875rem', color: 'var(--color-text-secondary-light)' }}>Amount*</label>
            <input
              type="number"
              placeholder="e.g., 5000, -1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              style={{ width: '100%', padding: 'var(--space-s)', border: '1px solid var(--color-border-light)', borderRadius: '4px', background: 'var(--color-ui-background-light)', color: 'var(--color-text-primary-light)', fontVariantNumeric: 'tabular-nums' }}
            />
        </div>
      </div>

      <div style={{ marginBottom: 'var(--space-l)' }}>
        <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.875rem', color: 'var(--color-text-secondary-light)' }}>Description (optional)</label>
        <textarea
          placeholder="e.g., Annual IRA contribution, House down payment"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          style={{ width: '100%', padding: 'var(--space-s)', border: '1px solid var(--color-border-light)', borderRadius: '4px', background: 'var(--color-ui-background-light)', color: 'var(--color-text-primary-light)' }}
        />
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-s)', justifyContent: 'flex-end' }}>
        {onCancel && (
          <button type="button" onClick={onCancel} style={{ background: 'transparent', border: '1px solid var(--color-border-light)', color: 'var(--color-text-secondary-light)', padding: 'var(--space-s) var(--space-m)', borderRadius: '4px', cursor: 'pointer' }}>
            Cancel
          </button>
        )}
        <button
          type="submit"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-xs)', backgroundColor: 'var(--color-primary)', color: 'var(--color-text-on-primary-light)', border: 'none', padding: 'var(--space-s) var(--space-m)', borderRadius: '4px', cursor: 'pointer' }}
        >
          <PlusIcon style={{ width: '1rem', height: '1rem' }} />
          {isEditing ? 'Update Change' : 'Add Change'}
        </button>
      </div>
    </form>
  );
} 