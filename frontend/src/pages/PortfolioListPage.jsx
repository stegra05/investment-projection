import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getPortfolios, deletePortfolio } from '../services/portfolioService';
import Button from '../components/Button';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import styles from './PortfolioListPage.module.css';

function PortfolioListPage() {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getPortfolios();
        setPortfolios(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch portfolios:', err);
        setError('Could not load portfolios. Please try again later.');
        setPortfolios([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete the portfolio "${name}"? This action cannot be undone.`)) {
      try {
        await deletePortfolio(id);
        setPortfolios((prev) => prev.filter((p) => p.portfolio_id !== id));
        setError(null);
      } catch (err) {
        console.error('Delete failed:', err);
        setError(`Failed to delete portfolio "${name}".`);
      }
    }
  };

  if (loading) {
    return <p className={styles.loadingText}>Loading portfolios...</p>;
  }

  return (
    <main className={styles.listContainer}>
      <header className={styles.listHeader}>
        <h1 className={styles.listTitle}>Your Portfolios</h1>
        <Button
          onClick={() => navigate('/portfolios/new')}
          icon={<PlusIcon />}
          variant="filled"
        >
          New Portfolio
        </Button>
      </header>

      {error && <p className={styles.errorMessage}>{error}</p>}

      {portfolios.length === 0 && !loading && !error ? (
        <p className={styles.emptyMessage}>No portfolios found. Create one to get started.</p>
      ) : (
        <ul className={styles.portfolioList}>
          {portfolios.map((p) => (
            <li key={p.portfolio_id} className={styles.portfolioItem}>
              <Link to={`/portfolios/${p.portfolio_id}`} className={styles.portfolioLink}>
                {p.name}
              </Link>
              <div className={styles.actionButtons}>
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/portfolios/${p.portfolio_id}/edit`)}
                  icon={<PencilIcon />}
                  title={`Edit portfolio ${p.name}`}
                  className={styles.actionButton}
                  iconOnly={true}
                >
                  <span className="sr-only">Edit {p.name}</span>
                </Button>
                <Button
                  variant="text"
                  color="error"
                  onClick={() => handleDelete(p.portfolio_id, p.name)}
                  icon={<TrashIcon />}
                  title={`Delete portfolio ${p.name}`}
                  className={styles.actionButton}
                  iconOnly={true}
                >
                  <span className="sr-only">Delete {p.name}</span>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default PortfolioListPage; 