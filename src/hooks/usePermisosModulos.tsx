import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { api } from '../api/client';
import type { ModuloDef, PermisosModulosConfig } from '../lib/adminAccess';
import { useAuth } from './useAuth';

type PermisosContextType = {
  permisos: PermisosModulosConfig | null;
  definiciones: ModuloDef[];
  loading: boolean;
  refresh: () => Promise<void>;
};

const PermisosContext = createContext<PermisosContextType | undefined>(undefined);

export function PermisosProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [permisos, setPermisos] = useState<PermisosModulosConfig | null>(null);
  const [definiciones, setDefiniciones] = useState<ModuloDef[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setPermisos(null);
      setDefiniciones([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [p, defs] = await Promise.all([
        api.getPermisosModulos(),
        api.getPermisosModulosDefiniciones(),
      ]);
      setPermisos(p);
      setDefiniciones(defs ?? []);
    } catch {
      setPermisos(null);
      setDefiniciones([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <PermisosContext.Provider value={{ permisos, definiciones, loading, refresh }}>
      {children}
    </PermisosContext.Provider>
  );
}

export function usePermisosModulos() {
  const ctx = useContext(PermisosContext);
  if (!ctx) throw new Error('usePermisosModulos must be used within PermisosProvider');
  return ctx;
}
