import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { usePermisosModulos } from '../../hooks/usePermisosModulos';
import { canAccessModulo, type ModuloKey } from '../../lib/adminAccess';
import { Spinner } from '../ui/Spinner';

export function RequireModule({ modulo, children }: { modulo: ModuloKey; children: React.ReactNode }) {
  const { user } = useAuth();
  const { permisos, loading } = usePermisosModulos();

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Spinner size={36} />
      </div>
    );
  }

  if (!canAccessModulo(modulo, user?.rol, permisos)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
