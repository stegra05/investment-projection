import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import RegisterForm from '../components/RegisterForm';
import Layout from '../../../components/Layout/Layout';
import authService from '../../../api/authService';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRegister = async (userData) => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.register(userData);
      // Using alert for now, replace with toast/notification
      alert('Registration successful! Please log in.');
      navigate('/login');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed. Please check your input and try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto mt-10 p-8 border border-gray-200 rounded-lg shadow-sm bg-white">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Create Account</h1>
        <RegisterForm onSubmit={handleRegister} isLoading={isLoading} error={error} />
        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Login
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default RegisterPage; 