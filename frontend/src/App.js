import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';

// Layout Components
const Layout = ({ children }) => (
  <div className="min-h-screen bg-gray-50">
    <main className="container mx-auto py-8">
      {children}
    </main>
  </div>
);

// Route Components
const LoginPage = () => {
  const login = useAuthStore(state => state.login);
  const isLoading = useAuthStore(state => state.isLoading);
  const error = useAuthStore(state => state.error);

  const handleLogin = async (credentials) => {
    await login(credentials);
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center mb-8">Login to Investment Projection</h1>
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}
        <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
      </div>
    </Layout>
  );
};

const DashboardPage = () => (
  <Layout>
    <h1 className="text-2xl font-bold mb-8">Dashboard</h1>
    <p>Welcome to your investment dashboard.</p>
  </Layout>
);

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App; 