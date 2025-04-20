import React, { useState } from 'react';
import { runProjection } from '../services/projectionService';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function ProjectionChart({ portfolioId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Input state for projection parameters
  const defaultStart = new Date().toISOString().slice(0, 10);
  const defaultEnd = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [initialValue, setInitialValue] = useState('');

  const handleRunProjection = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await runProjection(
        portfolioId,
        startDate,
        endDate,
        parseFloat(initialValue)
      );
      // The backend returns an array directly, so handle both possibilities
      const projData = Array.isArray(result)
        ? result
        : result.projection_results || [];
      setData(projData);
    } catch (err) {
      console.error('Projection calculation failed:', err);
      const server = err.response?.data;
      const errorMsg = server
        ? server.error
          ? `${server.message}: ${server.error}`
          : server.message
        : 'Projection calculation failed';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 'var(--space-m)' }}>
      {/* Projection parameter inputs */}
      <div style={{ marginBottom: 'var(--space-m)' }}>
        <label style={{ display: 'block', marginBottom: 'var(--space-xs)', color: 'var(--color-text-secondary)' }}>Start Date</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          style={{ width: '100%', padding: 'var(--space-s)', border: '1px solid var(--color-border)', borderRadius: '4px' }}
        />
      </div>
      <div style={{ marginBottom: 'var(--space-m)' }}>
        <label style={{ display: 'block', marginBottom: 'var(--space-xs)', color: 'var(--color-text-secondary)' }}>End Date</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          style={{ width: '100%', padding: 'var(--space-s)', border: '1px solid var(--color-border)', borderRadius: '4px' }}
        />
      </div>
      <div style={{ marginBottom: 'var(--space-m)' }}>
        <label style={{ display: 'block', marginBottom: 'var(--space-xs)', color: 'var(--color-text-secondary)' }}>Initial Total Value</label>
        <input
          type="number"
          step="0.01"
          value={initialValue}
          onChange={(e) => setInitialValue(e.target.value)}
          style={{ width: '100%', padding: 'var(--space-s)', border: '1px solid var(--color-border)', borderRadius: '4px' }}
        />
      </div>
      {error && <p style={{ color: 'var(--color-error)', marginBottom: 'var(--space-m)' }}>{error}</p>}
      <button
        onClick={handleRunProjection}
        disabled={loading}
        style={{
          backgroundColor: 'var(--color-primary)',
          color: 'var(--color-text-on-primary)',
          border: 'none',
          padding: 'var(--space-s)',
          borderRadius: '4px',
          fontSize: '1rem',
        }}
      >
        {loading ? 'Running...' : 'Run Projection'}
      </button>
      {data.length > 0 && (
        <div style={{ width: '100%', height: 300, marginTop: 'var(--space-l)' }}>
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" stroke="var(--color-text-secondary)" />
              <YAxis stroke="var(--color-text-secondary)" />
              <Tooltip contentStyle={{ backgroundColor: 'var(--color-ui-background)', borderColor: 'var(--color-border)' }} />
              <Line type="monotone" dataKey="value" stroke="var(--color-accent-green)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
} 