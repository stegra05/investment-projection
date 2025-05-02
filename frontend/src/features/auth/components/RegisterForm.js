import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../components/Button/Button';
import Input from '../../../components/Input/Input';

const RegisterForm = ({ onSubmit, isLoading, error }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
          {error}
        </div>
      )}
      <Input
        label="Username"
        id="username"
        name="username"
        type="text"
        value={formData.username}
        onChange={handleChange}
        required
        autoComplete="username"
      />
      <Input
        label="Email"
        id="email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        required
        autoComplete="email"
      />
      <Input
        label="Password"
        id="password"
        name="password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        required
        autoComplete="new-password"
      />
      <Button type="submit" disabled={isLoading} fullWidth>
        {isLoading ? 'Registering...' : 'Register'}
      </Button>
    </form>
  );
};

RegisterForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.string,
};

export default RegisterForm; 