import React from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../../store/authStore';
import LoginForm from '../components/LoginForm';
import Layout from '../../../components/Layout/Layout';

const LoginPage = () => {
  const login = useAuthStore(state => state.login);
  const isLoading = useAuthStore(state => state.isLoading);
  const error = useAuthStore(state => state.error);

  const handleLogin = async (credentials) => {
    await login(credentials);
  };

  // Determine the error message to display
  let errorMessage = null;
  if (error) {
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error.message && typeof error.message === 'string') {
      errorMessage = error.message;
    } else {
      // Fallback if error is an object without a standard message
      errorMessage = 'An unexpected error occurred. Please try again.'; 
      console.error('Unknown error format:', error); // Log for debugging
    }
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto mt-10 p-8 border border-gray-200 rounded-lg shadow-sm bg-white">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Login to Investment Projection</h1>
        {/* Display the extracted error message */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
            {errorMessage}
          </div>
        )}
        {/* Pass isLoading, but not error, to LoginForm */}
        <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
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

export default LoginPage; 