import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import Link for login redirect
import { useAuth } from '../contexts/AuthContext';

function RegistrationPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await register({ username, email, password });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed');
    }
  };

  return (
    <main style={{ margin: 'var(--space-xl) auto', padding: 'var(--space-l)', backgroundColor: 'var(--color-ui-background)', color: 'var(--color-text-primary)', borderRadius: '8px', maxWidth: '400px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 'var(--space-m)' }}>Register</h1>
      {error && <p style={{ color: 'var(--color-error)', marginBottom: 'var(--space-m)' }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-m)' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="username" style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xs)' }}>Username:</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', padding: 'var(--space-xs)', border: '1px solid var(--color-border)', borderRadius: '4px', backgroundColor: 'var(--color-ui-background)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '1rem', height: '1rem', color: 'var(--color-text-secondary)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            <input style={{ background: 'transparent', border: 'none', width: '100%', color: 'inherit', fontSize: '1rem' }} id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="email" style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xs)' }}>Email:</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', padding: 'var(--space-xs)', border: '1px solid var(--color-border)', borderRadius: '4px', backgroundColor: 'var(--color-ui-background)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '1rem', height: '1rem', color: 'var(--color-text-secondary)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
            <input style={{ background: 'transparent', border: 'none', width: '100%', color: 'inherit', fontSize: '1rem' }} id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="password" style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xs)' }}>Password:</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', padding: 'var(--space-xs)', border: '1px solid var(--color-border)', borderRadius: '4px', backgroundColor: 'var(--color-ui-background)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '1rem', height: '1rem', color: 'var(--color-text-secondary)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <input style={{ background: 'transparent', border: 'none', width: '100%', color: 'inherit', fontSize: '1rem' }} id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="confirmPassword" style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xs)' }}>Confirm Password:</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', padding: 'var(--space-xs)', border: '1px solid var(--color-border)', borderRadius: '4px', backgroundColor: 'var(--color-ui-background)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '1rem', height: '1rem', color: 'var(--color-text-secondary)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <input style={{ background: 'transparent', border: 'none', width: '100%', color: 'inherit', fontSize: '1rem' }} id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>
        </div>
        <button type="submit" disabled={loading} style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-text-on-primary)', padding: 'var(--space-s)', fontSize: '1rem', fontWeight: 500, border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{loading ? 'Registering...' : 'Register'}</button>
      </form>
      <p style={{ marginTop: 'var(--space-m)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Already have an account? <Link to="/login" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Login</Link></p>
    </main>
  );
}

export default RegistrationPage; 