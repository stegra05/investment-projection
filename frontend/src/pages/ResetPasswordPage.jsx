import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

function ResetPasswordPage() {
  const { token } = useParams(); // Get the token from the URL
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    // TODO: Implement API call to reset password using the token when backend is ready
    console.log('Resetting password with token:', token, 'New password:', password);
    setMessage('Password has been reset successfully. You can now log in.');
    // Clear form
    setPassword('');
    setConfirmPassword('');

    setLoading(false);
    // Optional: Redirect to login after a short delay
    setTimeout(() => navigate('/login'), 3000);

  };

  return (
    <main style={{ margin: 'var(--space-xl) auto', padding: 'var(--space-l)', backgroundColor: 'var(--color-ui-background)', color: 'var(--color-text-primary)', borderRadius: '8px', maxWidth: '400px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 'var(--space-m)' }}>Reset Your Password</h1>
      <p style={{ fontSize: '1rem', marginBottom: 'var(--space-m)', color: 'var(--color-text-secondary)' }}>Enter your new password below.</p>
      {message && <p style={{ color: 'var(--color-success)', marginBottom: 'var(--space-m)' }}>{message}</p>}
      {error && <p style={{ color: 'var(--color-error)', marginBottom: 'var(--space-m)' }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-m)' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="password" style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xs)' }}>New Password:</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', padding: 'var(--space-xs)', border: '1px solid var(--color-border)', borderRadius: '4px', backgroundColor: 'var(--color-ui-background)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '1rem', height: '1rem', color: 'var(--color-text-secondary)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <input style={{ background: 'transparent', border: 'none', width: '100%', color: 'inherit', fontSize: '1rem' }}
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="confirmPassword" style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xs)' }}>Confirm New Password:</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', padding: 'var(--space-xs)', border: '1px solid var(--color-border)', borderRadius: '4px', backgroundColor: 'var(--color-ui-background)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '1rem', height: '1rem', color: 'var(--color-text-secondary)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
            </svg>
            <input style={{ background: 'transparent', border: 'none', width: '100%', color: 'inherit', fontSize: '1rem' }}
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        </div>
        <button type="submit" disabled={loading} style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-text-on-primary)', padding: 'var(--space-s)', fontSize: '1rem', fontWeight: 500, border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
      <p style={{ marginTop: 'var(--space-m)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
        Remembered your password? <Link to="/login" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Login</Link>
      </p>
    </main>
  );
}

export default ResetPasswordPage; 