import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // For navigation links and programmatic navigation.
import RegisterForm from '../components/RegisterForm'; // The actual registration form UI component.
import Layout from '../../../components/Layout/Layout'; // Standard page layout component.
import authService from '../../../api/authService'; // API service for authentication calls.

/**
 * @page RegisterPage
 * @description This page component renders the user registration interface.
 * It integrates the `RegisterForm` component to capture new user details (username, email, password).
 * It manages local state for loading indicators, success messages, and error messages related to the registration process.
 * On successful registration, it displays a success message and automatically navigates the user to the login page.
 * It directly uses `authService` to make the registration API call.
 * It is typically rendered by a route definition associated with the '/register' path.
 *
 * @example
 * // In a router setup:
 * // <Route path="/register" element={<RegisterPage />} />
 *
 * @returns {JSX.Element} The rendered registration page UI.
 */
const RegisterPage = () => {
  // Hook from react-router-dom for programmatic navigation (e.g., after successful registration).
  const navigate = useNavigate();
  // Local state to manage the loading status during API calls.
  const [isLoading, setIsLoading] = useState(false);
  // Local state to store and display any error messages from the registration attempt.
  const [error, setError] = useState(null);
  // Local state to store and display a success message upon successful registration.
  const [successMessage, setSuccessMessage] = useState(null);

  /**
   * Clears any existing error or success messages.
   * This is typically passed to the RegisterForm to be called on input changes,
   * ensuring stale messages are removed when the user starts correcting input.
   */
  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  /**
   * Handles the submission of registration data from the RegisterForm.
   * It calls the `authService.register` API, manages loading states,
   * sets success or error messages, and navigates to login on success.
   * @param {object} userData - An object containing user registration data,
   *                            typically `{ username, email, password }`.
   */
  const handleRegister = async userData => {
    clearMessages(); // Clear any previous messages.
    setIsLoading(true); // Set loading state to true.
    try {
      // Call the registration API service.
      await authService.register(userData);
      // On success, set a success message.
      setSuccessMessage('Registration successful! Redirecting to login...');
      // Navigate to the login page after a short delay to allow the user to read the message.
      setTimeout(() => {
        navigate('/login');
      }, 1500); // 1.5-second delay.
    } catch (err) {
      // On failure, extract a user-friendly error message or use a fallback.
      const errorMessage =
        err.response?.data?.message || // Prioritize backend error message.
        'Registration failed. Please check your input and try again.'; // Fallback message.
      setError(errorMessage);
      setIsLoading(false); // Reset loading state.
    }
    // Note: setIsLoading(false) is not explicitly called in the success path
    // because the component will unmount upon navigation, effectively ending the loading state.
  };

  return (
    // Use the standard application Layout component.
    <Layout>
      {/* Centered container for the registration form. */}
      <div className="max-w-md mx-auto mt-10 p-8 border border-gray-200 rounded-lg shadow-sm bg-white">
        {/* Page title. */}
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Create Account</h1>
        {/* Conditionally render a success message div if successMessage is set. */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-md border border-green-200">
            {successMessage}
          </div>
        )}
        {/* Render the RegisterForm, passing necessary props. */}
        <RegisterForm
          onSubmit={handleRegister} // Handler for form submission.
          isLoading={isLoading}    // Propagates loading state to the form.
          error={error}            // Passes any error messages to the form (could be displayed by RegisterForm itself or an AlertMessage within it).
          clearMessages={clearMessages} // Function to clear messages, typically on input change.
        />
        {/* Conditionally render the link to the login page. Hidden if a success message is shown (as user will be redirected). */}
        {!successMessage && (
          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Login
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
};

// Page components like RegisterPage typically do not have explicit PropTypes
// as they are rendered by routing mechanisms and don't receive props directly from other components.

export default RegisterPage;