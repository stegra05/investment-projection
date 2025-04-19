import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth hook
import { useNavigate, Link } from 'react-router-dom';

function LoginPage() {
  const [username, setUsername] = useState(''); // Can be username or email
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth(); // Use auth context
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Determine if input is an email or username
      const payload = username.includes('@')
        ? { email: username, password }
        : { username, password };
      await login(payload);
      navigate('/'); // Redirect to dashboard on success
    } catch (err) {
      // Error is re-thrown by context, catch it here to display message
      setError(err.response?.data?.message || err.message || 'Login failed');
    }
  };

  return (
    <div>
      <h1>Login</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username or Email:</label>
          <input
            type="text" // Changed from email to text to allow username
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      {/* TODO: Add link to registration page */}
      {/* TODO: Add link to password reset page */}
      <p>
        Don't have an account? <Link to="/register">Register here</Link>
      </p>
      <p>
        <Link to="/request-password-reset">Forgot Password?</Link>
      </p>
    </div>
  );
}

export default LoginPage; 