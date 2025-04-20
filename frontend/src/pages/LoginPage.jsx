import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth hook
import { useNavigate, Link } from 'react-router-dom';
import styles from './LoginPage.module.css'; // Import CSS Module

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
    <main className={styles.loginContainer}>
      <h1 className={styles.title}>Login</h1>
      {error && <p className={styles.errorMessage}>{error}</p>}
      <form onSubmit={handleSubmit} className={styles.loginForm}>
        <div className={styles.formGroup}>
          <label htmlFor="username" className={styles.label}>Username or Email:</label>
          <div className={styles.inputGroup}>
            {/* User Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.inputIcon}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            <input
              className={styles.inputField}
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="your.email@example.com or username"
            />
          </div>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="password" className={styles.label}>Password:</label>
          <div className={styles.inputGroup}>
            {/* Lock Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.inputIcon}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <input
              className={styles.inputField}
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Password"
            />
          </div>
        </div>
        <button type="submit" disabled={loading} className={styles.submitButton}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p className={styles.linkText}>
        Don't have an account? <Link to="/register" className={styles.link}>Register here</Link>
      </p>
      <p className={styles.linkTextSmall}>
        <Link to="/request-password-reset" className={styles.link}>Forgot Password?</Link>
      </p>
    </main>
  );
}

export default LoginPage; 