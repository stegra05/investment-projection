import React from 'react';
import { Link } from 'react-router-dom'; // For navigation links.
import useAuthStore from '../../../store/authStore'; // Zustand store for authentication state.
import LoginForm from '../components/LoginForm'; // The actual login form UI component.
import Layout from '../../../components/Layout/Layout'; // Standard page layout component.
import AlertMessage from '../../../components/AlertMessage/AlertMessage'; // For displaying error messages.

/**
 * @page LoginPage
 * @description This page component renders the user login interface.
 * It integrates the `LoginForm` component to capture user credentials (email/username and password).
 * It connects to the global `useAuthStore` (Zustand) to:
 *   1. Access the `login` action to authenticate the user.
 *   2. Retrieve `isLoading` state to provide visual feedback during login attempts.
 *   3. Retrieve `error` state to display any authentication errors using the `AlertMessage` component.
 * The page also provides a link for users to navigate to the registration page if they don't have an account.
 * It is typically rendered by a route definition associated with the '/login' path.
 *
 * @example
 * // In a router setup:
 * // <Route path="/login" element={<LoginPage />} />
 *
 * @returns {JSX.Element} The rendered login page UI.
 */
const LoginPage = () => {
  // Access the `login` action from the auth store.
  const login = useAuthStore(state => state.login);
  // Access the `isLoading` state from the auth store to manage UI during login requests.
  const isLoading = useAuthStore(state => state.isLoading);
  // Access the `error` state from the auth store to display login errors.
  const error = useAuthStore(state => state.error);

  /**
   * Handles the submission of login credentials from the LoginForm.
   * Calls the `login` action from the auth store.
   * @param {object} credentials - An object containing user credentials, typically `{ emailOrUsername, password }`.
   */
  const handleLogin = async credentials => {
    // Asynchronously call the login action from the store.
    // The store itself will handle setting isLoading and error states, and navigation on success.
    await login(credentials);
  };

  // Process the error object from the store to ensure a displayable string message.
  let errorMessage = null;
  if (error) {
    if (typeof error === 'string') {
      errorMessage = error; // If error is already a string.
    } else if (error.message && typeof error.message === 'string') {
      errorMessage = error.message; // If error is an object with a 'message' property.
    } else {
      // Fallback for unexpected error formats.
      errorMessage = 'An unexpected error occurred. Please try again.';
      console.error('Unknown error format received on LoginPage:', error); // Log for debugging.
    }
  }

  return (
    // Use the standard application Layout component.
    <Layout>
      {/* Centered container for the login form. */}
      <div className="max-w-md mx-auto mt-10 p-8 border border-gray-200 rounded-lg shadow-sm bg-white">
        {/* Page title. */}
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Login to Investment Projection
        </h1>
        {/* Display any login errors using the AlertMessage component. */}
        <AlertMessage type="error" message={errorMessage} />
        {/* Render the LoginForm, passing the submit handler and loading state. */}
        <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
        {/* Link to the registration page for new users. */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
            Register
          </Link>
        </div>
      </div>
    </Layout>
  );
};

// Page components like LoginPage typically do not have explicit PropTypes
// as they are rendered by routing mechanisms and don't receive props directly from other components.
// Their "props" are often derived from route parameters or global state.

export default LoginPage;