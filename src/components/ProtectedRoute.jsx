import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute – role-aware route guard.
 * - Unauthenticated users → /login
 * - Wrong role → redirected to their correct home
 * - allowedRoles: array e.g. ['superadmin'] or ['delivery']
 */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { currentUser, userRole, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-400">Verifying session…</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Role check — if allowedRoles specified and user's role not in list
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // Redirect to correct home
    if (userRole === 'delivery') return <Navigate to="/rider" replace />;
    if (userRole === 'superadmin') return <Navigate to="/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}
