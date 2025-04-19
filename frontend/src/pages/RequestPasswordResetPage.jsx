import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function RequestPasswordResetPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    // TODO: Implement API call to request password reset when backend is ready
    console.log('Requesting password reset for:', email);
    setMessage('If an account exists for this email, a password reset link has been sent.');
    // Clear form regardless of success/failure for security
    setEmail(''); 
  };

  return (
    <div>
      <h1>Forgot Password</h1>
      <p>Enter your email address below, and we'll send you a link to reset your password.</p>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button type="submit">Send Reset Link</button>
      </form>
      <p>
        Remembered your password? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}

export default RequestPasswordResetPage; 