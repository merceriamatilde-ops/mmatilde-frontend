import React from 'react';
import { ConfigForm } from '../../components/admin/ConfigForm';

export function ConfiguracionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight font-outfit">Configuración</h1>
        <p className="text-stone-500 mt-1">Ajustá la información de contacto y enlaces de tu negocio.</p>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <ConfigForm />
      </div>
    </div>
  );
}
