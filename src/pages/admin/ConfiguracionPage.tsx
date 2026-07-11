import React from 'react';
import { ConfigForm } from '../../components/admin/ConfigForm';
import { PermisosModulosForm } from '../../components/admin/PermisosModulosForm';
import { isAdmin } from '../../lib/adminAccess';
import { useAuth } from '../../hooks/useAuth';

export function ConfiguracionPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight font-outfit">Configuración</h1>
        <p className="text-stone-500 mt-1">Ajustá la información de contacto, enlaces y permisos del BO.</p>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <ConfigForm />
      </div>

      {isAdmin(user?.rol) && (
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <PermisosModulosForm />
        </div>
      )}
    </div>
  );
}
