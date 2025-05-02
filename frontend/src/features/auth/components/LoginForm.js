import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../components/Button/Button';
import Input from '../../../components/Input/Input';
import styles from './LoginForm.module.css';
import useAuthStore from '../../../store/authStore';

const LoginForm = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });
  const clearError = useAuthStore((state) => state.clearError);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    clearError();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { identifier, password } = formData;

    const isEmail = identifier.includes('@');

    const payload = {
      password: password,
    };
    if (isEmail) {
      payload.email = identifier;
    } else {
      payload.username = identifier;
    }

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <Input
        label="Email or Username"
        id="identifier"
        name="identifier"
        type="text"
        value={formData.identifier}
        onChange={handleChange}
        required
        disabled={isLoading}
        autoComplete="username email"
        placeholder="your@email.com or username"
      />
      <Input
        label="Password"
        id="password"
        name="password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        required
        disabled={isLoading}
        autoComplete="current-password"
        placeholder="Enter your password"
      />
      <Button
        type="submit"
        variant="primary"
        disabled={isLoading}
        className={styles.submitButton}
        fullWidth
      >
        {isLoading ? 'Logging in...' : 'Login'}
      </Button>
    </form>
  );
};

LoginForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

export default LoginForm; 