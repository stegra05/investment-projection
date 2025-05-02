import React, { useState } from 'react';
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
    // Basic validation could be added here if desired
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
            {error} {/* Display registration-specific errors */}
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
      />
      <Input
        label="Email"
        id="email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        required
      />
      <Input
        label="Password"
        id="password"
        name="password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        required
      />
      <Button type="submit" disabled={isLoading} fullWidth>
        {isLoading ? 'Registering...' : 'Register'}
      </Button>
    </form>
  );
};

export default RegisterForm; 