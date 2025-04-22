import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import Link for login redirect
import { useAuth } from '../contexts/AuthContext';
import styles from './RegistrationPage.module.css'; // Import CSS Module (can potentially reuse LoginPage styles)
import toast from 'react-hot-toast'; // Import toast
// Consider import loginStyles from './LoginPage.module.css' and reuse classes if identical
// Import zxcvbn and language packs
import { zxcvbn, zxcvbnOptions } from '@zxcvbn-ts/core';
import * as zxcvbnCommonPackage from '@zxcvbn-ts/language-common';
import * as zxcvbnEnPackage from '@zxcvbn-ts/language-en'; // Import English pack

// Basic email regex (can be shared in a utils file)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Password regex (example: min 8 chars, at least one letter and one number)
// const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

// Initialize zxcvbn options
const options = {
  dictionary: {
    ...zxcvbnCommonPackage.dictionary,
    ...zxcvbnEnPackage.dictionary, // Add English dictionary
  },
  graphs: zxcvbnCommonPackage.adjacencyGraphs,
  translations: zxcvbnEnPackage.translations, // Add English translations
};
zxcvbnOptions.setOptions(options);

function RegistrationPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [apiError, setApiError] = useState(''); // For API errors (used by toast)
  const [fieldErrors, setFieldErrors] = useState({}); // For field validation errors
  const [passwordStrength, setPasswordStrength] = useState(null); // State for password strength score (0-4)
  const [passwordFeedback, setPasswordFeedback] = useState(null); // State for feedback object
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const errors = {};
    if (!username) {
      errors.username = 'Username is required.';
    }
    // Add other username rules if needed (e.g., length, characters)

    if (!email) {
      errors.email = 'Email is required.';
    } else if (!EMAIL_REGEX.test(email)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } 
    // else if (!PASSWORD_REGEX.test(password)) {
    //   errors.password = 'Password must be at least 8 characters long and include a letter and a number.';
    // }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (password && confirmPassword !== password) { // Only check if password has a value
      errors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0; // True if valid
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);

    if (newPassword) {
      const result = zxcvbn(newPassword);
      setPasswordStrength(result.score);
      setPasswordFeedback(result.feedback);
    } else {
      setPasswordStrength(null); // Reset strength if password is empty
      setPasswordFeedback(null);
    }
  };

  const getStrengthLabel = (score) => {
    switch (score) {
      case 0: return 'Very Weak';
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return '';
    }
  };

  const getStrengthColor = (score) => {
     switch (score) {
      case 0: return styles.strengthVeryWeak; // Red
      case 1: return styles.strengthWeak; // Orange
      case 2: return styles.strengthFair; // Yellow
      case 3: return styles.strengthGood; // Light Green
      case 4: return styles.strengthStrong; // Dark Green
      default: return '';
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(''); // Clear previous API error
    setFieldErrors({}); // Clear previous field errors

    // Validate form first
    if (!validateForm()) {
      return; // Stop if validation fails
    }

    // The check for password match is now in validateForm
    // if (password !== confirmPassword) {
    //   setError('Passwords do not match');
    //   return;
    // }

    try {
      await register({ username, email, password });
      navigate('/'); // Navigate to dashboard on success
      toast.success('Registration successful!'); // Optional: Success toast
    } catch (err) {
      // Handle API errors separately via toast
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed';
      setApiError(errorMessage); // Keep state if needed, but display via toast
      toast.error(errorMessage);
      // setApiError(err.response?.data?.message || err.message || 'Registration failed'); // Original
    }
  };

  return (
    // Using similar structure and class names as LoginPage for consistency
    <main className={styles.registrationContainer}> 
      <h1 className={styles.title}>Register</h1>
      {/* Display API Error via toast, remove banner */}
      {/* {apiError && <p className={styles.errorMessage}>{apiError}</p>} */}
      <form onSubmit={handleSubmit} className={styles.registrationForm} noValidate>
        {/* Username Input */}
        <div className={styles.formGroup}>
          <label htmlFor="username" className={styles.label}>Username: <span className={styles.requiredIndicator}>*</span></label>
          <div className={`${styles.inputGroup} ${fieldErrors.username ? styles.inputError : ''}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.inputIcon}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            <input 
              className={styles.inputField} 
              id="username" 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              // required // Handled by validation state
              placeholder="Choose a username"
              aria-invalid={!!fieldErrors.username}
              aria-describedby={fieldErrors.username ? "username-error" : undefined}
            />
          </div>
          {fieldErrors.username && <p id="username-error" className={styles.errorMessageInline}>{fieldErrors.username}</p>}
        </div>
        {/* Email Input */}
        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.label}>Email: <span className={styles.requiredIndicator}>*</span></label>
          <div className={`${styles.inputGroup} ${fieldErrors.email ? styles.inputError : ''}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.inputIcon}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
            <input 
              className={styles.inputField} 
              id="email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              // required // Handled by validation state
              placeholder="your.email@example.com"
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
            />
          </div>
           {fieldErrors.email && <p id="email-error" className={styles.errorMessageInline}>{fieldErrors.email}</p>}
        </div>
        {/* Password Input */}
        <div className={styles.formGroup}>
          <label htmlFor="password" className={styles.label}>Password: <span className={styles.requiredIndicator}>*</span></label>
          <div className={`${styles.inputGroup} ${fieldErrors.password ? styles.inputError : ''}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.inputIcon}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <input 
              className={styles.inputField} 
              id="password" 
              type="password" 
              value={password} 
              onChange={handlePasswordChange}
              // required // Handled by validation state
              placeholder="Create a password"
              aria-invalid={!!fieldErrors.password}
              aria-describedby={`${fieldErrors.password ? 'password-error ' : ''}password-strength-indicator`}
            />
          </div>
          {fieldErrors.password && <p id="password-error" className={styles.errorMessageInline}>{fieldErrors.password}</p>}
          {/* Password Strength Indicator */}
          {password && ( // Only show when password is not empty
            <div id="password-strength-indicator" className={styles.strengthIndicatorContainer}>
              {/* Segmented Bar */}
              <div className={styles.strengthSegmentsContainer}>
                {[...Array(4)].map((_, index) => {
                  const segmentScore = index + 1; // Score this segment represents (1 to 4)
                  let segmentClass = styles.strengthSegment;
                  // Determine if segment should be filled and which color to use
                  if (passwordStrength !== null && passwordStrength >= segmentScore) {
                    // Segment is filled, use the color corresponding to the *overall* strength
                    segmentClass += ` ${getStrengthColor(passwordStrength)}`;
                  } else {
                    // Segment is empty
                    segmentClass += ` ${styles.strengthSegmentEmpty}`;
                  }
                  return <div key={index} className={segmentClass}></div>;
                })}
              </div>
              {/* Only show label if strength is calculated */}
              {passwordStrength !== null && (
                <span className={styles.strengthLabel}>
                  Strength: {getStrengthLabel(passwordStrength)}
                </span>
              )}
              {passwordFeedback?.warning && (
                <p className={styles.strengthWarning}>{passwordFeedback.warning}</p>
              )}
              {passwordFeedback?.suggestions?.length > 0 && (
                 <ul className={styles.strengthSuggestions}>
                  {passwordFeedback.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        {/* Confirm Password Input */}
        <div className={styles.formGroup}>
          <label htmlFor="confirmPassword" className={styles.label}>Confirm Password: <span className={styles.requiredIndicator}>*</span></label>
          <div className={`${styles.inputGroup} ${fieldErrors.confirmPassword ? styles.inputError : ''}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={styles.inputIcon}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <input 
              className={styles.inputField} 
              id="confirmPassword" 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              // required // Handled by validation state
              placeholder="Confirm your password"
              aria-invalid={!!fieldErrors.confirmPassword}
              aria-describedby={fieldErrors.confirmPassword ? "confirm-password-error" : undefined}
            />
          </div>
          {fieldErrors.confirmPassword && <p id="confirm-password-error" className={styles.errorMessageInline}>{fieldErrors.confirmPassword}</p>}
        </div>
        <button type="submit" disabled={loading} className={styles.submitButton}>{loading ? 'Registering...' : 'Register'}</button>
      </form>
      <p className={styles.linkText}>Already have an account? <Link to="/login" className={styles.link}>Login</Link></p>
    </main>
  );
}

export default RegistrationPage; 