import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function RequestPasswordResetPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    // TODO: Implement API call to request password reset when backend is ready
    console.log('Requesting password reset for:', email);
    setMessage('If an account exists for this email, a password reset link has been sent.');
    // Clear form regardless of success/failure for security
    setEmail(''); 
    setLoading(false);
  };

  return (
    <main style={{ margin: 'var(--space-xl) auto', padding: 'var(--space-l)', backgroundColor: 'var(--color-ui-background)', color: 'var(--color-text-primary)', borderRadius: '8px', maxWidth: '400px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 'var(--space-m)' }}>Forgot Password</h1>
      <p style={{ fontSize: '1rem', marginBottom: 'var(--space-m)', color: 'var(--color-text-secondary)' }}>Enter your email address below, and we'll send you a link to reset your password.</p>
      {message && <p style={{ color: 'var(--color-success)', marginBottom: 'var(--space-m)' }}>{message}</p>}
      {error && <p style={{ color: 'var(--color-error)', marginBottom: 'var(--space-m)' }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-m)' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="email" style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xs)' }}>Email:</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', padding: 'var(--space-xs)', border: '1px solid var(--color-border)', borderRadius: '4px', backgroundColor: 'var(--color-ui-background)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '1rem', height: '1rem', color: 'var(--color-text-secondary)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
            <input style={{ background: 'transparent', border: 'none', width: '100%', color: 'inherit', fontSize: '1rem' }}
              type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>
        <button type="submit" disabled={loading} style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-text-on-primary)', padding: 'var(--space-s)', fontSize: '1rem', fontWeight: 500, border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
      <p style={{ marginTop: 'var(--space-m)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
        Remembered your password? <Link to="/login" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Login</Link>
      </p>
    </main>
  );
}

export default RequestPasswordResetPage; 