import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-400">Authenticating Apartment Portal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Force first-time password change before any dashboard access
  if (user.mustChangePassword && location.pathname !== '/force-change-password') {
    return <Navigate to="/force-change-password" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to user's default dashboard if unauthorized for this role
    let defaultRedirect = '/resident/dashboard';
    if (user.role === 'super_admin') defaultRedirect = '/super-admin/dashboard';
    else if (user.role === 'block_admin') defaultRedirect = '/block-admin/dashboard';
    else if (user.role === 'receptionist') defaultRedirect = '/receptionist/dashboard';
    else if (user.role === 'security') defaultRedirect = '/security/dashboard';

    return <Navigate to={defaultRedirect} replace />;
  }

  return children;
};

export default ProtectedRoute;
