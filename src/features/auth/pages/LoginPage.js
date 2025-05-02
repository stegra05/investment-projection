import React from 'react';
import { Link } from 'react-router-dom'; // Added for step 1.4.5
import useAuthStore from '../../../store/authStore';
import LoginForm from '../components/LoginForm';
import Layout from '../../../components/Layout/Layout'; // Adjust import path if Layout is moved

// Extracted LoginPage Component
const LoginPage = () => {
  const login = useAuthStore(state => state.login);
  const isLoading = useAuthStore(state => state.isLoading);
  const error = useAuthStore(state => state.error);

  const handleLogin = async (credentials) => {
    await login(credentials);
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto mt-10 p-8 border border-gray-200 rounded-lg shadow-sm bg-white">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Login to Investment Projection</h1>
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
            {error}
          </div>
        )}
        <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
        {/* 1.4.5: Add Link to Register */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
            Register
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default LoginPage; 