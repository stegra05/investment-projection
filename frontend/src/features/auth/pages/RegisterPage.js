import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import RegisterForm from '../components/RegisterForm';
import Layout from '../../../components/Layout/Layout';
import authService from '../../../api/authService';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const handleRegister = async (userData) => {
    clearMessages();
    setIsLoading(true);
    try {
      await authService.register(userData);
      setSuccessMessage('Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed. Please check your input and try again.';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto mt-10 p-8 border border-gray-200 rounded-lg shadow-sm bg-white">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Create Account</h1>
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-md border border-green-200">
            {successMessage}
          </div>
        )}
        <RegisterForm
          onSubmit={handleRegister}
          isLoading={isLoading}
          error={error}
          clearMessages={clearMessages}
        />
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

export default RegisterPage; 