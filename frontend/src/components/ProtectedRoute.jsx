import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Corrected path

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Optional: Show a loading indicator while auth state is initializing
  // This is basic, a more robust solution might involve checking token validity async
  if (loading && !isAuthenticated) {
    // Avoid redirecting immediately if we are just checking the initial state
    // You might want a more sophisticated loading state management
    // For now, just rendering loading text or null might be sufficient
    return <div>Loading Authentication...</div>; // Or a spinner component
  }

  if (!isAuthenticated && !loading) {
    // If not loading and not authenticated, redirect to login
    return <Navigate to="/login" replace />;
  }

  // If authenticated or still loading but potentially authenticated (initial check),
  // render the child components.
  // Using <Outlet /> allows this component to work correctly with nested routes defined within it.
  // If used directly wrapping a component like <ProtectedRoute><Dashboard /></ProtectedRoute>,
  // 'children' prop will be used.
  return children ? children : <Outlet />;
};

export default ProtectedRoute; 