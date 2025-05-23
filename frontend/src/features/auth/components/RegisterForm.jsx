import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import zxcvbn from 'zxcvbn'; // For password strength estimation.
import Button from '../../../components/Button/Button';
import Input from '../../../components/Input/Input';
import AlertMessage from '../../../components/AlertMessage/AlertMessage'; // For displaying general errors.

/**
 * @component RegisterForm
 * @description A form component for new user registration. It collects username, email, and password,
 * includes password confirmation, estimates password strength using `zxcvbn`,
 * validates password matching, and manages loading/error states.
 *
 * @example
 * const handleRegister = (userData) => {
 *   // API call to register user
 *   console.log(userData);
 * };
 * <RegisterForm
 *   onSubmit={handleRegister}
 *   isLoading={isSubmitting}
 *   error={registrationError}
 *   clearMessages={clearAuthErrorAction}
 * />
 *
 * @param {object} props - The component's props.
 * @param {Function} props.onSubmit - Callback function invoked when the form is submitted.
 *                                    Receives an object with `email`, `password`, and `username`. Required.
 * @param {boolean} [props.isLoading=false] - If true, disables form elements and shows a loading indicator on the submit button.
 * @param {string} [props.error] - An error message string to display (e.g., from an API response).
 * @param {Function} props.clearMessages - Callback function to clear any displayed error messages (e.g., on input change). Required.
 *
 * @returns {JSX.Element} The rendered registration form.
 */
const RegisterForm = ({ onSubmit, isLoading, error, clearMessages }) => {
  // Local state for managing form input values.
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // State for password strength score (0-4) from zxcvbn.
  const [passwordScore, setPasswordScore] = useState(0);
  // State for textual feedback on password strength from zxcvbn.
  const [passwordFeedback, setPasswordFeedback] = useState('');
  // State for displaying an error message if passwords do not match.
  const [passwordMismatchError, setPasswordMismatchError] = useState('');

  /**
   * Handles changes to form inputs.
   * Updates the corresponding field in `formData` state.
   * Clears password mismatch error if password or confirmPassword fields are changed.
   * Calls `clearMessages` to clear general form errors.
   * @param {React.ChangeEvent<HTMLInputElement>} e - The input change event.
   */
  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));

    // Clear password mismatch error when user types in password or confirm password fields.
    if (name === 'password' || name === 'confirmPassword') {
      setPasswordMismatchError('');
    }
    // Clear general form errors (e.g., from API) passed via props.
    clearMessages();
  };

  // `useEffect` to calculate password strength using zxcvbn whenever the password field changes.
  useEffect(() => {
    if (formData.password) {
      const result = zxcvbn(formData.password);
      setPasswordScore(result.score); // Score: 0 (worst) to 4 (best).
      // Provides warning or suggestions if available.
      setPasswordFeedback(
        result.feedback?.warning || result.feedback?.suggestions?.join(' ') || ''
      );
    } else {
      // Reset score and feedback if password field is empty.
      setPasswordScore(0);
      setPasswordFeedback('');
    }
  }, [formData.password]); // Dependency: re-run only if password changes.

  // `useEffect` to check for password mismatch whenever password or confirmPassword fields change.
  useEffect(() => {
    // Only show mismatch error if confirmPassword has a value and it doesn't match password.
    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      setPasswordMismatchError('Passwords do not match.');
    } else {
      setPasswordMismatchError(''); // Clear error if they match or confirmPassword is empty.
    }
  }, [formData.password, formData.confirmPassword]); // Dependencies: re-run if either password field changes.

  /**
   * Handles form submission.
   * Prevents default form action, checks for password mismatch, then calls `onSubmit` prop.
   * @param {React.FormEvent<HTMLFormElement>} e - The form submission event.
   */
  const handleSubmit = e => {
    e.preventDefault();
    // Final check for password mismatch before submission.
    if (formData.password !== formData.confirmPassword) {
      setPasswordMismatchError('Passwords do not match.');
      return; // Prevent submission if passwords don't match.
    }
    const { email, password, username } = formData;
    onSubmit({ email, password, username }); // Pass relevant data to parent onSubmit handler.
  };

  // Determine if the submit button should be disabled.
  // Disabled if `isLoading` is true or if `confirmPassword` has a value and passwords don't match.
  const isSubmitDisabled =
    isLoading || (!!formData.confirmPassword && formData.password !== formData.confirmPassword);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Display general registration errors (e.g., from API) if any. */}
      <AlertMessage type="error" message={error} />
      
      {/* Username input field. */}
      <Input
        label="Username"
        id="username"
        name="username"
        type="text"
        value={formData.username}
        onChange={handleChange}
        required
        autoComplete="username"
        placeholder="Choose a username"
      />
      {/* Email input field. */}
      <Input
        label="Email"
        id="email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        required
        autoComplete="email"
        placeholder="your@email.com"
      />
      {/* Password input field with ARIA attributes for accessibility. */}
      <Input
        label="Password"
        id="password"
        name="password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        required
        autoComplete="new-password" // Hint for password managers.
        // Links input to hint text and feedback for screen readers.
        aria-describedby={`password-hint ${passwordFeedback ? 'password-feedback' : ''}`.trim()}
        placeholder="Enter a strong password"
      />
      {/* Static helper text for password requirements. */}
      <small id="password-hint" className="form-helper-text">
        Password must be at least 8 characters long.
      </small>
      {/* Password strength meter and feedback, displayed only if password field is not empty. */}
      {formData.password && (
        <div className="mt-1" id="password-feedback"> {/* ID for aria-describedby */}
          <progress
            // Dynamically sets class for styling based on password score.
            className={`w-full h-2 rounded password-strength-${passwordScore}`}
            value={passwordScore} // Current strength score.
            max="4" // Max score value.
            aria-label={`Password strength: ${passwordScore}/4`} // Accessibility label.
          />
          {/* Display textual feedback from zxcvbn if available. */}
          {passwordFeedback && <p className="text-xs text-gray-500 mt-1">{passwordFeedback}</p>}
        </div>
      )}
      {/* Confirm Password input field. Displays mismatch error directly via `error` prop. */}
      <Input
        label="Confirm Password"
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        value={formData.confirmPassword}
        onChange={handleChange}
        required
        autoComplete="new-password"
        placeholder="Confirm your password"
        error={passwordMismatchError} // Pass mismatch error to Input's error display.
      />
      {/* Submit button, disabled based on loading state or password mismatch. */}
      <Button type="submit" disabled={isSubmitDisabled} fullWidth>
        {isLoading ? 'Registering...' : 'Register'}
      </Button>
    </form>
  );
};

// PropTypes for type-checking and component documentation.
RegisterForm.propTypes = {
  /** 
   * Callback function executed upon successful form submission.
   * Receives an object: `{ email, password, username }`. Required.
   */
  onSubmit: PropTypes.func.isRequired,
  /** 
   * Boolean indicating if the registration process is active (e.g., API call in progress).
   * Disables form elements and shows 'Registering...' on the button if true.
   */
  isLoading: PropTypes.bool,
  /** 
   * Error message string from a previous submission attempt or other sources.
   * Displayed in an AlertMessage component.
   */
  error: PropTypes.string,
  /** 
   * Callback function to clear messages, typically global error messages in a store.
   * Called on input changes. Required.
   */
  clearMessages: PropTypes.func.isRequired,
};

export default RegisterForm;
