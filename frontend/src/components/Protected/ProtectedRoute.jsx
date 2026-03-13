import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading, token, activeRole } = useContext(AuthContext);

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  // If not logged in, redirect to login
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const currentRole = activeRole || user?.active_role || user?.role;

  // If logged in but role not allowed, block access
  if (allowedRoles && !allowedRoles.includes(currentRole)) {
    return <div className="p-8 text-center text-red-600">Unauthorized Access</div>;
  }

  return <Outlet />;
};

export default ProtectedRoute;
