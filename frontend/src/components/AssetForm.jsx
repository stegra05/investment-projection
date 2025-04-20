import React, { useState, useEffect } from 'react';
import assetService from '../services/assetService';
import { PlusIcon } from '@heroicons/react/24/outline';

// Form to add or edit an asset
export default function AssetForm({ portfolioId, existingAsset, onSaved, onCancel }) {
  const isEditing = Boolean(existingAsset);
  const [assetType, setAssetType] = useState('');
  const [customAssetType, setCustomAssetType] = useState('');
  const [ticker, setTicker] = useState('');
  const [allocationPercentage, setAllocationPercentage] = useState(0);
  const [expectedReturn, setExpectedReturn] = useState(0);
  const [loading, setLoading] = useState(isEditing);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing && existingAsset) {
        if (['Stock', 'Bond'].includes(existingAsset.asset_type)) {
            setAssetType(existingAsset.asset_type);
            setCustomAssetType(''); // Reset custom type if standard is selected
        } else {
            setAssetType('Other');
            setCustomAssetType(existingAsset.asset_type);
        }
        setTicker(existingAsset.name_or_ticker || '');
        setAllocationPercentage(existingAsset.allocation_percentage ?? 0);
        setExpectedReturn(existingAsset.manual_expected_return ?? 0);
        setLoading(false);
    } else {
        // Reset form for adding new asset
        setAssetType('');
        setCustomAssetType('');
        setTicker('');
        setAllocationPercentage(0);
        setExpectedReturn(0);
        setLoading(false);
    }
  }, [existingAsset, isEditing]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const finalAssetType = assetType === 'Other' ? customAssetType : assetType;
      // Basic validation
      if (!finalAssetType || !ticker) {
          setError('Asset Type and Name/Ticker are required.');
          return;
      }
      if (assetType === 'Other' && !customAssetType) {
          setError('Please specify the custom asset type.');
          return;
      }

      const payload = {
        asset_type: finalAssetType,
        name_or_ticker: ticker,
        allocation_percentage: parseFloat(allocationPercentage) || 0,
        manual_expected_return: parseFloat(expectedReturn) || 0,
      };

      if (isEditing && existingAsset) {
        await assetService.updateAsset(portfolioId, existingAsset.asset_id, payload);
      } else {
        await assetService.createAsset(portfolioId, payload);
      }
      onSaved(); // Call the callback to signal success
    } catch (err) {
      console.error('Asset save failed:', err);
      setError(err.response?.data?.message || 'Failed to save asset. Please check the details.');
    }
  };

  if (loading) {
    return <p>Loading asset details...</p>;
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 'var(--space-l)', border: '1px solid var(--color-border-light)', padding: 'var(--space-m)', borderRadius: '4px', background: 'var(--color-ui-background-light)' }}>
      <h3 style={{ marginTop: 0, marginBottom: 'var(--space-m)', fontSize: '1.25rem', fontWeight: 600 }}>
        {isEditing ? 'Edit Asset' : 'Add New Asset'}
      </h3>
      {error && <p style={{ color: 'var(--color-error-light)', marginBottom: 'var(--space-m)', background: 'rgba(222, 53, 11, 0.1)', padding: 'var(--space-s)', borderRadius: '4px' }}>{error}</p>}
      <div style={{ marginBottom: 'var(--space-m)' }}>
        <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.875rem', color: 'var(--color-text-secondary-light)' }}>Asset Type*</label>
        <select
          value={assetType}
          onChange={(e) => setAssetType(e.target.value)}
          required
          style={{ width: '100%', padding: 'var(--space-s)', border: '1px solid var(--color-border-light)', borderRadius: '4px', background: 'var(--color-ui-background-light)', color: 'var(--color-text-primary-light)' }}
        >
          <option value="" disabled>-- Select Asset Type --</option>
          <option value="Stock">Stock</option>
          <option value="Bond">Bond</option>
          {/* Consider adding more common types like ETF, Mutual Fund, Real Estate, Cash? */}
          <option value="Other">Other (custom)</option>
        </select>
        {assetType === 'Other' && (
          <input
            type="text"
            placeholder="Enter custom asset type"
            value={customAssetType}
            onChange={(e) => setCustomAssetType(e.target.value)}
            required={assetType === 'Other'}
            style={{ width: '100%', padding: 'var(--space-s)', marginTop: 'var(--space-s)', border: '1px solid var(--color-border-light)', borderRadius: '4px', background: 'var(--color-ui-background-light)', color: 'var(--color-text-primary-light)' }}
          />
        )}
      </div>
      <div style={{ marginBottom: 'var(--space-m)' }}>
        <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.875rem', color: 'var(--color-text-secondary-light)' }}>Name/Ticker*</label>
        <input
          type="text"
          placeholder="e.g., AAPL, VTI, My Rental Property"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          required
          style={{ width: '100%', padding: 'var(--space-s)', border: '1px solid var(--color-border-light)', borderRadius: '4px', background: 'var(--color-ui-background-light)', color: 'var(--color-text-primary-light)' }}
        />
      </div>
      <div style={{ marginBottom: 'var(--space-m)' }}>
        <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.875rem', color: 'var(--color-text-secondary-light)' }}>Target Allocation (%)</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-s)'}}>
            <input
              type="range"
              min="0" max="100" step="1"
              value={allocationPercentage}
              onChange={(e) => setAllocationPercentage(e.target.value)}
              style={{ flexGrow: 1, accentColor: 'var(--color-primary)' }}
            />
            <span style={{ fontVariantNumeric: 'tabular-nums', minWidth: '4ch', textAlign: 'right' }}>{allocationPercentage}%</span>
        </div>
      </div>
      <div style={{ marginBottom: 'var(--space-l)' }}>
        <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.875rem', color: 'var(--color-text-secondary-light)' }}>Manual Expected Return (%, optional)</label>
         <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-s)'}}>
            <input
              type="range"
              min="-10" max="25" step="0.1" // Adjusted range
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(e.target.value)}
              style={{ flexGrow: 1, accentColor: 'var(--color-primary)' }}
            />
             <span style={{ fontVariantNumeric: 'tabular-nums', minWidth: '5ch', textAlign: 'right' }}>{parseFloat(expectedReturn).toFixed(1)}%</span>
        </div>
        <small style={{ display: 'block', marginTop: 'var(--space-xs)', color: 'var(--color-text-secondary-light)'}}>Leave at 0 to let the system estimate (if possible for the asset type).</small>
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
          {isEditing ? 'Update Asset' : 'Add Asset'}
        </button>
      </div>
    </form>
  );
} 