import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth hook
import { useNavigate, Link } from 'react-router-dom';

function LoginPage() {
  const [username, setUsername] = useState(''); // Can be username or email
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth(); // Use auth context
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Determine if input is an email or username
      const payload = username.includes('@')
        ? { email: username, password }
        : { username, password };
      await login(payload);
      navigate('/'); // Redirect to dashboard on success
    } catch (err) {
      // Error is re-thrown by context, catch it here to display message
      setError(err.response?.data?.message || err.message || 'Login failed');
    }
  };

  return (
    <main style={{ margin: 'var(--space-xl) auto', padding: 'var(--space-l)', backgroundColor: 'var(--color-ui-background)', color: 'var(--color-text-primary)', borderRadius: '8px', maxWidth: '400px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 'var(--space-m)' }}>Login</h1>
      {error && <p style={{ color: 'var(--color-error)', marginBottom: 'var(--space-m)' }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-m)' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="username" style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xs)' }}>Username or Email:</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', padding: 'var(--space-xs)', border: '1px solid var(--color-border)', borderRadius: '4px', backgroundColor: 'var(--color-ui-background)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '1rem', height: '1rem', color: 'var(--color-text-secondary)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            <input
              style={{ background: 'transparent', border: 'none', width: '100%', color: 'inherit', fontSize: '1rem' }}
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="password" style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xs)' }}>Password:</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', padding: 'var(--space-xs)', border: '1px solid var(--color-border)', borderRadius: '4px', backgroundColor: 'var(--color-ui-background)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '1rem', height: '1rem', color: 'var(--color-text-secondary)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <input
              style={{ background: 'transparent', border: 'none', width: '100%', color: 'inherit', fontSize: '1rem' }}
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>
        <button type="submit" disabled={loading} style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-text-on-primary)', padding: 'var(--space-s)', fontSize: '1rem', fontWeight: 500, border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p style={{ marginTop: 'var(--space-m)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
        Don't have an account? <Link to="/register" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Register here</Link>
      </p>
      <p style={{ marginTop: 'var(--space-xs)' }}>
        <Link to="/request-password-reset" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Forgot Password?</Link>
      </p>
    </main>
  );
}

export default LoginPage; 