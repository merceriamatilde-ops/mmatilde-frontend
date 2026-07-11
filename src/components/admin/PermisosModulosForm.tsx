import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '../../api/client';
import { usePermisosModulos } from '../../hooks/usePermisosModulos';
import type { ModuloPermiso, ModuloKey } from '../../lib/adminAccess';
import { ROLES_BO } from '../../lib/adminAccess';
import { Button } from '../ui/Button';

export function PermisosModulosForm() {
  const { permisos, definiciones, refresh } = usePermisosModulos();
  const [draft, setDraft] = useState<Record<string, ModuloPermiso>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (permisos?.modulos) setDraft({ ...permisos.modulos });
  }, [permisos]);

  const setModulo = (key: string, patch: Partial<ModuloPermiso>) => {
    setDraft((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...patch },
    }));
  };

  const toggleRol = (key: string, rol: string, bloqueado: boolean) => {
    if (bloqueado) return;
    const mod = draft[key];
    if (!mod) return;
    const roles = mod.roles.includes(rol)
      ? mod.roles.filter((r) => r !== rol)
      : [...mod.roles, rol];
    if (roles.length === 0) return;
    setModulo(key, { roles });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updatePermisosModulos({ modulos: draft });
      await refresh();
      toast.success('Permisos actualizados');
    } catch (err: any) {
      toast.error(err?.message || 'Error al guardar permisos');
    } finally {
      setSaving(false);
    }
  };

  if (!definiciones.length) return null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">Permisos del backoffice</h2>
        <p className="text-sm text-stone-500 mt-1">
          Definí qué módulos ve cada rol. Los administradores siempre tienen acceso total.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-stone-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-stone-50 text-xs uppercase text-stone-500 border-b border-stone-200">
              <th className="text-left py-3 px-4">Módulo</th>
              <th className="text-center py-3 px-3 w-24">Activo</th>
              {ROLES_BO.map((r) => (
                <th key={r} className="text-center py-3 px-3 w-20">
                  {r}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {definiciones.map((def) => {
              const mod = draft[def.key as ModuloKey];
              if (!mod) return null;
              return (
                <tr key={def.key} className="border-b border-stone-100 last:border-0">
                  <td className="py-3 px-4">
                    <span className="font-medium text-stone-800">{def.label}</span>
                    {def.bloqueado && (
                      <span className="ml-2 text-[10px] uppercase text-stone-400">solo admin</span>
                    )}
                  </td>
                  <td className="text-center py-3 px-3">
                    <input
                      type="checkbox"
                      checked={mod.habilitado}
                      disabled={def.bloqueado}
                      onChange={(e) => setModulo(def.key, { habilitado: e.target.checked })}
                      className="rounded border-stone-300"
                    />
                  </td>
                  {ROLES_BO.map((rol) => (
                    <td key={rol} className="text-center py-3 px-3">
                      <input
                        type="checkbox"
                        checked={mod.roles.includes(rol)}
                        disabled={def.bloqueado || rol === 'ADMIN'}
                        onChange={() => toggleRol(def.key, rol, def.bloqueado)}
                        className="rounded border-stone-300"
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => void handleSave()} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar permisos'}
        </Button>
      </div>
    </div>
  );
}
