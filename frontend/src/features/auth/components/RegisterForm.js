import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import zxcvbn from 'zxcvbn';
import Button from '../../../components/Button/Button';
import Input from '../../../components/Input/Input';

const RegisterForm = ({ onSubmit, isLoading, error, clearMessages }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [passwordScore, setPasswordScore] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState('');
  const [passwordMismatchError, setPasswordMismatchError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));

    if (name === 'password' || name === 'confirmPassword') {
      setPasswordMismatchError('');
    }
    clearMessages();
  };

  useEffect(() => {
    if (formData.password) {
      const result = zxcvbn(formData.password);
      setPasswordScore(result.score);
      setPasswordFeedback(result.feedback?.warning || result.feedback?.suggestions?.join(' ') || '');
    } else {
      setPasswordScore(0);
      setPasswordFeedback('');
    }
  }, [formData.password]);

  useEffect(() => {
    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      setPasswordMismatchError('Passwords do not match.');
    } else {
      setPasswordMismatchError('');
    }
  }, [formData.password, formData.confirmPassword]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setPasswordMismatchError('Passwords do not match.');
      return;
    }
    const { email, password, username } = formData;
    onSubmit({ email, password, username });
  };

  const isSubmitDisabled = isLoading || (!!formData.confirmPassword && formData.password !== formData.confirmPassword);

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
        placeholder="Choose a username"
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
        placeholder="your@email.com"
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
        aria-describedby={`password-hint ${passwordFeedback ? 'password-feedback' : ''}`.trim()}
        placeholder="Enter a strong password"
      />
      <small id="password-hint" className="form-helper-text">
        Password must be at least 8 characters long.
      </small>
      {formData.password && (
        <div className="mt-1" id="password-feedback">
          <progress
            className={`w-full h-2 rounded password-strength-${passwordScore}`}
            value={passwordScore}
            max="4"
            aria-label={`Password strength: ${passwordScore}/4`}
          />
          {passwordFeedback && (
            <p className="text-xs text-gray-500 mt-1">
              {passwordFeedback}
            </p>
          )}
        </div>
      )}
      <Input
        label="Confirm Password"
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        value={formData.confirmPassword}
        onChange={handleChange}
        required
        autoComplete="new-password"
        aria-describedby={passwordMismatchError ? 'password-mismatch-error' : undefined}
        placeholder="Confirm your password"
      />
      {passwordMismatchError && (
        <p id="password-mismatch-error" className="text-xs text-red-600 mt-1" role="alert">
          {passwordMismatchError}
        </p>
      )}
      <Button type="submit" disabled={isSubmitDisabled} fullWidth>
        {isLoading ? 'Registering...' : 'Register'}
      </Button>
    </form>
  );
};

RegisterForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  clearMessages: PropTypes.func.isRequired,
};

export default RegisterForm; 