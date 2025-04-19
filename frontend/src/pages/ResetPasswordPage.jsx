import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

function ResetPasswordPage() {
  const { token } = useParams(); // Get the token from the URL
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // TODO: Implement API call to reset password using the token when backend is ready
    console.log('Resetting password with token:', token, 'New password:', password);
    setMessage('Password has been reset successfully. You can now log in.');
    // Clear form
    setPassword('');
    setConfirmPassword('');

    // Optional: Redirect to login after a short delay
    setTimeout(() => navigate('/login'), 3000);

  };

  return (
    <div>
      <h1>Reset Your Password</h1>
      <p>Enter your new password below.</p>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="password">New Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="confirmPassword">Confirm New Password:</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Reset Password</button>
      </form>
    </div>
  );
}

export default ResetPasswordPage; 