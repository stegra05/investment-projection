import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getPortfolios, deletePortfolio } from '../services/portfolioService';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

function PortfolioListPage() {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getPortfolios();
        setPortfolios(data);
      } catch (err) {
        console.error('Failed to fetch portfolios:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this portfolio?')) {
      try {
        await deletePortfolio(id);
        setPortfolios((prev) => prev.filter((p) => p.portfolio_id !== id));
      } catch (err) {
        console.error('Delete failed:', err);
      }
    }
  };

  if (loading) {
    return <p style={{ padding: 'var(--space-l)' }}>Loading portfolios...</p>;
  }

  return (
    <main style={{ margin: 'var(--space-xl) auto', padding: 'var(--space-l)', maxWidth: '800px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-m)' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Your Portfolios</h1>
        <button
          onClick={() => navigate('/portfolios/new')}
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', backgroundColor: 'var(--color-primary)', color: 'var(--color-text-on-primary)', border: 'none', padding: 'var(--space-s)', borderRadius: '4px' }}
        >
          <PlusIcon style={{ width: '1rem', height: '1rem' }} />
          New Portfolio
        </button>
      </header>
      {portfolios.length === 0 ? (
        <p>No portfolios found. Create one to get started.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 'var(--space-m)' }}>
          {portfolios.map((p) => (
            <li key={p.portfolio_id} style={{ padding: 'var(--space-m)', border: '1px solid var(--color-border)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link to={`/portfolios/${p.portfolio_id}`} style={{ fontSize: '1.25rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                {p.name}
              </Link>
              <div style={{ display: 'flex', gap: 'var(--space-s)' }}>
                <button onClick={() => navigate(`/portfolios/${p.portfolio_id}/edit`)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  <PencilIcon style={{ width: '1rem', height: '1rem', color: 'var(--color-text-secondary)' }} />
                </button>
                <button onClick={() => handleDelete(p.portfolio_id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  <TrashIcon style={{ width: '1rem', height: '1rem', color: 'var(--color-error)' }} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default PortfolioListPage; 