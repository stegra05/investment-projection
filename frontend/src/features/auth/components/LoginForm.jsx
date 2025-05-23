import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../components/Button/Button'; // Reusable Button component.
import Input from '../../../components/Input/Input';   // Reusable Input component.
import styles from './LoginForm.module.css';          // CSS Modules for component-specific styling.
import useAuthStore from '../../../store/authStore';  // Zustand store for authentication state.

/**
 * @component LoginForm
 * @description A form component enabling users to log in using their email or username, and password.
 * It handles local form state, input validation (via `required` prop on Inputs), submission logic,
 * and displays a loading state during the submission process. Interacts with `useAuthStore`
 * to clear any existing authentication errors when the user starts typing.
 *
 * @example
 * const handleLoginSubmit = (credentials) => {
 *   // Call API to log in user
 *   console.log(credentials);
 * };
 * <LoginForm onSubmit={handleLoginSubmit} isLoading={isSubmitting} />
 *
 * @param {object} props - The component's props.
 * @param {Function} props.onSubmit - Callback function invoked when the form is submitted.
 *                                    It receives an object with either `email` or `username`, and `password`. Required.
 * @param {boolean} [props.isLoading=false] - If true, disables form elements and shows a loading indicator on the submit button.
 *
 * @returns {JSX.Element} The rendered login form.
 */
const LoginForm = ({ onSubmit, isLoading }) => {
  // Local state for managing form input values (identifier and password).
  const [formData, setFormData] = useState({
    identifier: '', // Can be either email or username.
    password: '',
  });

  // Access the `clearError` action from the authentication Zustand store.
  // This is called when the user starts typing, to clear any previous login error messages.
  const clearError = useAuthStore(state => state.clearError);

  /**
   * Handles changes to form inputs.
   * Updates the local `formData` state with the new value and clears any global auth errors.
   * @param {React.ChangeEvent<HTMLInputElement>} e - The input change event.
   */
  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    clearError(); // Clear global auth errors on input change.
  };

  /**
   * Handles form submission.
   * Prevents default form submission, determines if the identifier is an email or username,
   * constructs the payload, and calls the `onSubmit` prop.
   * @param {React.FormEvent<HTMLFormElement>} e - The form submission event.
   */
  const handleSubmit = e => {
    e.preventDefault(); // Prevent default browser form submission.
    const { identifier, password } = formData;

    // Determine if the identifier is an email by checking for '@'.
    const isEmail = identifier.includes('@');

    // Construct the payload for the onSubmit callback.
    const payload = {
      password: password,
    };
    if (isEmail) {
      payload.email = identifier; // Add email to payload if identifier is an email.
    } else {
      payload.username = identifier; // Add username to payload otherwise.
    }

    onSubmit(payload); // Call the parent component's submit handler.
  };

  return (
    // The form element with CSS Modules styling and submit handler.
    <form onSubmit={handleSubmit} className={styles.form}>
      {/* Input field for email or username. */}
      <Input
        label="Email or Username"
        id="identifier" // HTML id for the input.
        name="identifier" // HTML name attribute, used in handleChange.
        type="text"
        value={formData.identifier}
        onChange={handleChange}
        required // HTML5 required attribute.
        disabled={isLoading} // Disable input during loading.
        autoComplete="username email" // Browser autocompletion hint.
        placeholder="your@email.com or username"
      />
      {/* Input field for password. */}
      <Input
        label="Password"
        id="password"
        name="password"
        type="password" // Input type 'password' masks the input.
        value={formData.password}
        onChange={handleChange}
        required
        disabled={isLoading}
        autoComplete="current-password" // Browser autocompletion hint for current password.
        placeholder="Enter your password"
      />
      {/* Submit button. */}
      <Button
        type="submit" // HTML button type.
        variant="primary" // Visual style of the button.
        disabled={isLoading} // Disable button during loading.
        className={styles.submitButton} // Custom styling via CSS Modules.
        fullWidth // Makes the button span the full width of its container.
      >
        {/* Conditional text based on loading state. */}
        {isLoading ? 'Logging in...' : 'Login'}
      </Button>
    </form>
  );
};

// PropTypes for type-checking and component documentation.
LoginForm.propTypes = {
  /** 
   * Callback function that is executed when the form is submitted.
   * It receives an object containing `{ email?: string, username?: string, password: string }`.
   * Required.
   */
  onSubmit: PropTypes.func.isRequired,
  /** 
   * Boolean flag to indicate if the login process is currently active (e.g., API call is in progress).
   * If true, form inputs and the submit button are disabled, and the button text changes to 'Logging in...'.
   */
  isLoading: PropTypes.bool,
};

export default LoginForm;
