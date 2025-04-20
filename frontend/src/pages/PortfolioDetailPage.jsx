import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPortfolio } from '../services/portfolioService';
import assetService from '../services/assetService';
import axios from 'axios';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Form to add or edit an asset
function AssetForm({ portfolioId, existingAsset, onSaved, onCancel }) {
  const isEditing = Boolean(existingAsset);
  const [assetType, setAssetType] = useState('');
  const [customAssetType, setCustomAssetType] = useState('');
  const [ticker, setTicker] = useState('');
  const [allocationPercentage, setAllocationPercentage] = useState(0);
  const [expectedReturn, setExpectedReturn] = useState(0);
  const [loading, setLoading] = useState(isEditing);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing) {
      if (['Stock','Bond'].includes(existingAsset.asset_type)) {
        setAssetType(existingAsset.asset_type);
      } else {
        setAssetType('Other');
        setCustomAssetType(existingAsset.asset_type);
      }
      setTicker(existingAsset.name_or_ticker);
      setAllocationPercentage(existingAsset.allocation_percentage ?? 0);
      setExpectedReturn(existingAsset.manual_expected_return ?? 0);
      setLoading(false);
    }
  }, [existingAsset, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const finalAssetType = assetType === 'Other' ? customAssetType : assetType;
      const payload = {
        asset_type: finalAssetType,
        name_or_ticker: ticker,
        allocation_percentage: parseFloat(allocationPercentage),
        manual_expected_return: parseFloat(expectedReturn),
      };
      if (isEditing) {
        await assetService.updateAsset(portfolioId, existingAsset.asset_id, payload);
      } else {
        await assetService.createAsset(portfolioId, payload);
      }
      onSaved();
    } catch (err) {
      console.error('Asset save failed:', err);
      setError(err.response?.data?.message || 'Asset save failed');
    }
  };

  if (loading) {
    return <p>Loading asset...</p>;
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 'var(--space-l)', border: '1px solid var(--color-border)', padding: 'var(--space-m)', borderRadius: '4px' }}>
      {error && <p style={{ color: 'var(--color-error)', marginBottom: 'var(--space-m)' }}>{error}</p>}
      <div style={{ marginBottom: 'var(--space-m)' }}>
        <label style={{ display: 'block', marginBottom: 'var(--space-xs)', color: 'var(--color-text-secondary)' }}>Asset Type</label>
        <select
          value={assetType}
          onChange={(e) => setAssetType(e.target.value)}
          required
          style={{ width: '100%', padding: 'var(--space-s)', border: '1px solid var(--color-border)', borderRadius: '4px' }}
        >
          <option value="">-- Select Asset Type --</option>
          <option value="Stock">Stock</option>
          <option value="Bond">Bond</option>
          <option value="Other">Other (custom)</option>
        </select>
        {assetType === 'Other' && (
          <input
            type="text"
            placeholder="Enter custom asset type"
            value={customAssetType}
            onChange={(e) => setCustomAssetType(e.target.value)}
            required
            style={{ width: '100%', padding: 'var(--space-s)', marginTop: 'var(--space-xs)', border: '1px solid var(--color-border)', borderRadius: '4px' }}
          />
        )}
      </div>
      <div style={{ marginBottom: 'var(--space-m)' }}>
        <label style={{ display: 'block', marginBottom: 'var(--space-xs)', color: 'var(--color-text-secondary)' }}>Name/Ticker</label>
        <input
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          required
          style={{ width: '100%', padding: 'var(--space-s)', border: '1px solid var(--color-border)', borderRadius: '4px' }}
        />
      </div>
      <div style={{ marginBottom: 'var(--space-m)' }}>
        <label style={{ display: 'block', marginBottom: 'var(--space-xs)', color: 'var(--color-text-secondary)' }}>Allocation (%)</label>
        <input
          type="range"
          min="0" max="100" step="1"
          value={allocationPercentage}
          onChange={(e) => setAllocationPercentage(e.target.value)}
          style={{ width: '100%' }}
        />
        <span style={{ marginLeft: 'var(--space-xs)' }}>{allocationPercentage}%</span>
      </div>
      <div style={{ marginBottom: 'var(--space-m)' }}>
        <label style={{ display: 'block', marginBottom: 'var(--space-xs)', color: 'var(--color-text-secondary)' }}>Expected Return (%)</label>
        <input
          type="range"
          min="0" max="20" step="0.1"
          value={expectedReturn}
          onChange={(e) => setExpectedReturn(e.target.value)}
          style={{ width: '100%' }}
        />
        <span style={{ marginLeft: 'var(--space-xs)' }}>{expectedReturn}%</span>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-s)' }}>
        <button
          type="submit"
          style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--color-primary)', color: 'var(--color-text-on-primary)', border: 'none', padding: 'var(--space-s)', borderRadius: '4px' }}
        >
          <PlusIcon style={{ width: '1rem', height: '1rem', marginRight: 'var(--space-xs)' }} />
          {isEditing ? 'Update Asset' : 'Add Asset'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} style={{ background: 'transparent', border: 'none', color: 'var(--color-secondary)' }}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

// Form to add or edit a planned change
function ChangeForm({ portfolioId, existingChange, onSaved, onCancel }) {
  const isEditing = Boolean(existingChange);
  const [changeType, setChangeType] = useState('');
  const [changeDate, setChangeDate] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(isEditing);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (isEditing) {
      setChangeType(existingChange.change_type);
      setChangeDate(existingChange.change_date);
      setAmount(existingChange.amount ?? '');
      setDescription(existingChange.description ?? '');
      setLoading(false);
    }
  }, [existingChange, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        change_type: changeType,
        change_date: changeDate,
        amount: parseFloat(amount),
        description,
      };
      const config = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } };
      if (isEditing) {
        await axios.put(`${API_URL}/portfolios/${portfolioId}/changes/${existingChange.change_id}`, payload, config);
      } else {
        await axios.post(`${API_URL}/portfolios/${portfolioId}/changes`, payload, config);
      }
      onSaved();
    } catch (err) {
      console.error('Change save failed:', err);
      setError(err.response?.data?.message || 'Change save failed');
    }
  };

  if (loading) {
    return <p>Loading change...</p>;
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 'var(--space-l)', border: '1px solid var(--color-border)', padding: 'var(--space-m)', borderRadius: '4px' }}>
      {error && <p style={{ color: 'var(--color-error)', marginBottom: 'var(--space-m)' }}>{error}</p>}
      <div style={{ marginBottom: 'var(--space-m)' }}>
        <label style={{ display: 'block', marginBottom: 'var(--space-xs)', color: 'var(--color-text-secondary)' }}>Change Type</label>
        <input
          type="text"
          value={changeType}
          onChange={(e) => setChangeType(e.target.value)}
          required
          style={{ width: '100%', padding: 'var(--space-s)', border: '1px solid var(--color-border)', borderRadius: '4px' }}
        />
      </div>
      <div style={{ marginBottom: 'var(--space-m)' }}>
        <label style={{ display: 'block', marginBottom: 'var(--space-xs)', color: 'var(--color-text-secondary)' }}>Date</label>
        <input
          type="date"
          value={changeDate}
          onChange={(e) => setChangeDate(e.target.value)}
          required
          style={{ width: '100%', padding: 'var(--space-s)', border: '1px solid var(--color-border)', borderRadius: '4px' }}
        />
      </div>
      <div style={{ marginBottom: 'var(--space-m)' }}>
        <label style={{ display: 'block', marginBottom: 'var(--space-xs)', color: 'var(--color-text-secondary)' }}>Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          style={{ width: '100%', padding: 'var(--space-s)', border: '1px solid var(--color-border)', borderRadius: '4px' }}
        />
      </div>
      <div style={{ marginBottom: 'var(--space-m)' }}>
        <label style={{ display: 'block', marginBottom: 'var(--space-xs)', color: 'var(--color-text-secondary)' }}>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          style={{ width: '100%', padding: 'var(--space-s)', border: '1px solid var(--color-border)', borderRadius: '4px' }}
        />
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-s)' }}>
        <button
          type="submit"
          style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: 'var(--color-primary)', color: 'var(--color-text-on-primary)', border: 'none', padding: 'var(--space-s)', borderRadius: '4px' }}
        >
          <PlusIcon style={{ width: '1rem', height: '1rem', marginRight: 'var(--space-xs)' }} />
          {isEditing ? 'Update Change' : 'Add Change'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} style={{ background: 'transparent', border: 'none', color: 'var(--color-secondary)' }}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

// Main detail page
export default function PortfolioDetailPage() {
  const { id } = useParams();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState(null);
  const [showChangeForm, setShowChangeForm] = useState(false);
  const [changeToEdit, setChangeToEdit] = useState(null);
  const token = localStorage.getItem('token');

  const fetchPortfolio = async () => {
    try {
      const data = await getPortfolio(id);
      setPortfolio(data);
    } catch (err) {
      console.error('Failed to load portfolio:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, [id]);

  const handleAssetSaved = () => {
    setShowAssetForm(false);
    setAssetToEdit(null);
    fetchPortfolio();
  };

  const handleChangeSaved = () => {
    setShowChangeForm(false);
    setChangeToEdit(null);
    fetchPortfolio();
  };

  const handleDeleteAsset = async (asset) => {
    if (window.confirm('Remove this asset?')) {
      try {
        await assetService.deleteAsset(id, asset.asset_id);
        fetchPortfolio();
      } catch (err) {
        console.error('Delete asset failed:', err);
      }
    }
  };

  const handleDeleteChange = async (change) => {
    if (window.confirm('Remove this planned change?')) {
      try {
        await axios.delete(`${API_URL}/portfolios/${id}/changes/${change.change_id}`, { headers: { Authorization: `Bearer ${token}` } });
        fetchPortfolio();
      } catch (err) {
        console.error('Delete change failed:', err);
      }
    }
  };

  if (loading) {
    return <p style={{ padding: 'var(--space-l)' }}>Loading portfolio...</p>;
  }

  if (!portfolio) {
    return <p style={{ padding: 'var(--space-l)' }}>Portfolio not found.</p>;
  }

  return (
    <main style={{ margin: 'var(--space-xl) auto', padding: 'var(--space-l)', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>{portfolio.name}</h1>
      {portfolio.description && <p style={{ marginBottom: 'var(--space-l)' }}>{portfolio.description}</p>}

      <section style={{ marginBottom: 'var(--space-xxl)' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Assets</h2>
          <button onClick={() => { setShowAssetForm(true); setAssetToEdit(null); }} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', background: 'transparent', border: 'none', color: 'var(--color-primary)' }}>
            <PlusIcon style={{ width: '1rem', height: '1rem' }} /> Add Asset
          </button>
        </header>
        {showAssetForm && <AssetForm portfolioId={id} existingAsset={assetToEdit} onSaved={handleAssetSaved} onCancel={() => setShowAssetForm(false)} />}
        {portfolio.assets.length === 0 ? (
          <p>No assets added.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, marginTop: 'var(--space-m)' }}>
            {portfolio.assets.map((asset) => (
              <li key={asset.asset_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-s)', border: '1px solid var(--color-border)', borderRadius: '4px', marginBottom: 'var(--space-s)' }}>
                <div>
                  <strong>{asset.name_or_ticker}</strong> ({asset.asset_type}) — {asset.allocation_percentage}%<br />
                  {asset.manual_expected_return != null && <span>Return: {asset.manual_expected_return}%</span>}
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-s)' }}>
                  <button onClick={() => { setAssetToEdit(asset); setShowAssetForm(true); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    <PencilIcon style={{ width: '1rem', height: '1rem', color: 'var(--color-text-secondary)' }} />
                  </button>
                  <button onClick={() => handleDeleteAsset(asset)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    <TrashIcon style={{ width: '1rem', height: '1rem', color: 'var(--color-error)' }} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Planned Changes</h2>
          <button onClick={() => { setShowChangeForm(true); setChangeToEdit(null); }} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', background: 'transparent', border: 'none', color: 'var(--color-primary)' }}>
            <PlusIcon style={{ width: '1rem', height: '1rem' }} /> Add Change
          </button>
        </header>
        {showChangeForm && <ChangeForm portfolioId={id} existingChange={changeToEdit} onSaved={handleChangeSaved} onCancel={() => setShowChangeForm(false)} />}
        {portfolio.planned_changes.length === 0 ? (
          <p>No planned changes.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, marginTop: 'var(--space-m)' }}>
            {portfolio.planned_changes.map((change) => (
              <li key={change.change_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-s)', border: '1px solid var(--color-border)', borderRadius: '4px', marginBottom: 'var(--space-s)' }}>
                <div>
                  <strong>{change.change_type}</strong> on {change.change_date} — Amount: {change.amount}<br />
                  {change.description && <span>{change.description}</span>}
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-s)' }}>
                  <button onClick={() => { setChangeToEdit(change); setShowChangeForm(true); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    <PencilIcon style={{ width: '1rem', height: '1rem', color: 'var(--color-text-secondary)' }} />
                  </button>
                  <button onClick={() => handleDeleteChange(change)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    <TrashIcon style={{ width: '1rem', height: '1rem', color: 'var(--color-error)' }} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
} 