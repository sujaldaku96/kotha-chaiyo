import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');

  let user = null;
  try {
    user = userString ? JSON.parse(userString) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    localStorage.removeItem('user');
  }

  console.log('Auth check - Token:', !!token, 'User:', user);

  // Check authentication and authorization in steps
  if (!token) {
    console.log('No token found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    console.log('Token exists but no user data');
    return <div>Loading user data...</div>; 
  }

  if (!allowedRoles.includes(user.role)) {
    console.log(`User role ${user.role} not in allowed roles:`, allowedRoles);
    return <Navigate to="/" replace />; 
  }

  return children;
};
export default PrivateRoute;