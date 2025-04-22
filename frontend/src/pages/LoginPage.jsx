import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth hook
import { useNavigate, Link } from 'react-router-dom';
import styles from './LoginPage.module.css'; // Import CSS Module
import toast from 'react-hot-toast'; // Import toast

// Basic email regex (adjust as needed for stricter validation)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginPage() {
  const [username, setUsername] = useState(''); // Can be username or email
  const [password, setPassword] = useState('');
  const [apiError, setApiError] = useState(''); // For errors from the login API call (used by toast)
  const [fieldErrors, setFieldErrors] = useState({}); // For inline field validation errors
  const { login, loading } = useAuth(); // Use auth context
  const navigate = useNavigate();

  const validateForm = () => {
    const errors = {};
    if (!username) {
      errors.username = 'Username or Email is required.';
    } else if (username.includes('@') && !EMAIL_REGEX.test(username)) {
      errors.username = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    }
    // Add more password validation if needed (e.g., length)

    setFieldErrors(errors);
    return Object.keys(errors).length === 0; // Return true if no errors
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(''); // Clear previous API errors
    setFieldErrors({}); // Clear previous field errors on new submission attempt

    if (!validateForm()) {
      return; // Stop submission if validation fails
    }

    try {
      // Determine if input is an email or username
      const payload = username.includes('@')
        ? { email: username, password }
        : { username, password };
      await login(payload);
      navigate('/'); // Redirect to dashboard on success
      toast.success('Login successful!'); // Optional: Add success toast
    } catch (err) {
      // Error is re-thrown by context, catch it here to display message via toast
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      setApiError(errorMessage); // Keep state if needed elsewhere, but display via toast
      toast.error(errorMessage);
    }
  };

  return (
    <main className={styles.loginContainer}>
      <h1 className={styles.title}>Login</h1>
      {/* Display API Error via toast, remove banner */}
      {/* {apiError && <p className={styles.errorMessage}>{apiError}</p>} */}
      <form onSubmit={handleSubmit} className={styles.loginForm} noValidate> {/* Add noValidate to prevent browser default validation */}
        <div className={styles.formGroup}>
          {/* Add required indicator */}
          <label htmlFor="username" className={styles.label}>
            Username or Email: <span className={styles.requiredIndicator}>*</span>
          </label>
          <div className={styles.inputGroup}>
            {/* User Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.inputIcon}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            <input
              // Add error class conditionally
              className={`${styles.inputField} ${fieldErrors.username ? styles.inputError : ''}`}
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              // Remove basic required, handle via state
              // required
              placeholder="your.email@example.com or username"
              // Add ARIA attributes for accessibility
              aria-invalid={!!fieldErrors.username}
              aria-describedby={fieldErrors.username ? "username-error" : undefined}
            />
          </div>
          {/* Display inline error message */}
          {fieldErrors.username && <p id="username-error" className={styles.errorMessageInline}>{fieldErrors.username}</p>}
        </div>
        <div className={styles.formGroup}>
           {/* Add required indicator */}
          <label htmlFor="password" className={styles.label}>
            Password: <span className={styles.requiredIndicator}>*</span>
          </label>
          <div className={styles.inputGroup}>
            {/* Lock Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.inputIcon}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <input
              // Add error class conditionally
              className={`${styles.inputField} ${fieldErrors.password ? styles.inputError : ''}`}
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              // Remove basic required, handle via state
              // required
              placeholder="Password"
              // Add ARIA attributes for accessibility
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? "password-error" : undefined}
            />
          </div>
          {/* Display inline error message */}
          {fieldErrors.password && <p id="password-error" className={styles.errorMessageInline}>{fieldErrors.password}</p>}
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