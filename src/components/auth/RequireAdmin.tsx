import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { isAdmin } from '../../lib/adminAccess';

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!isAdmin(user?.rol)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
