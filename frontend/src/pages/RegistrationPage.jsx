import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import Link for login redirect
import { useAuth } from '../contexts/AuthContext';
import styles from './RegistrationPage.module.css'; // Import CSS Module (can potentially reuse LoginPage styles)
// Consider import loginStyles from './LoginPage.module.css' and reuse classes if identical

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
      navigate('/'); // Navigate to dashboard on success
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed');
    }
  };

  return (
    // Using similar structure and class names as LoginPage for consistency
    <main className={styles.registrationContainer}> 
      <h1 className={styles.title}>Register</h1>
      {error && <p className={styles.errorMessage}>{error}</p>}
      <form onSubmit={handleSubmit} className={styles.registrationForm}>
        {/* Username Input */}
        <div className={styles.formGroup}>
          <label htmlFor="username" className={styles.label}>Username:</label>
          <div className={styles.inputGroup}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.inputIcon}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            <input className={styles.inputField} id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="Choose a username"/>
          </div>
        </div>
        {/* Email Input */}
        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.label}>Email:</label>
          <div className={styles.inputGroup}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.inputIcon}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
            <input className={styles.inputField} id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your.email@example.com"/>
          </div>
        </div>
        {/* Password Input */}
        <div className={styles.formGroup}>
          <label htmlFor="password" className={styles.label}>Password:</label>
          <div className={styles.inputGroup}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.inputIcon}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <input className={styles.inputField} id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Create a password"/>
          </div>
        </div>
        {/* Confirm Password Input */}
        <div className={styles.formGroup}>
          <label htmlFor="confirmPassword" className={styles.label}>Confirm Password:</label>
          <div className={styles.inputGroup}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.inputIcon}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <input className={styles.inputField} id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Confirm your password"/>
          </div>
        </div>
        <button type="submit" disabled={loading} className={styles.submitButton}>{loading ? 'Registering...' : 'Register'}</button>
      </form>
      <p className={styles.linkText}>Already have an account? <Link to="/login" className={styles.link}>Login</Link></p>
    </main>
  );
}

export default RegistrationPage; 