import React, { useEffect, useState } from 'react';
import { Package, Eye, FolderTree } from 'lucide-react';
import { api } from '../../api/client';
import { Spinner } from '../../components/ui/Spinner';
import { Link } from 'react-router-dom';

export function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardStats().then(res => {
      setStats(res);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner size={40} /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight font-outfit">Dashboard</h1>
        <p className="text-stone-500 mt-1">Resumen general del catálogo y la tienda.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-stone-500">Total Productos</p>
              <p className="text-3xl font-bold text-stone-900 mt-2">{stats?.totalProductos || 0}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Package size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-stone-500">Productos Visibles</p>
              <p className="text-3xl font-bold text-stone-900 mt-2">{stats?.productosActivos || 0}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <Eye size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-stone-500">Categorías</p>
              <p className="text-3xl font-bold text-stone-900 mt-2">{stats?.totalCategorias || 0}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
              <FolderTree size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-8">
        <div className="rounded-xl border border-stone-200 bg-white p-6">
          <h3 className="text-lg font-medium text-stone-900 mb-4">Acciones Rápidas</h3>
          <div className="space-y-3">
            <Link to="/admin/sync" className="block w-full p-4 text-left rounded-lg border border-stone-200 hover:border-brand-600 hover:bg-brand-50 transition-colors">
              <h4 className="font-medium text-stone-900">Sincronizar Productos</h4>
              <p className="text-sm text-stone-500">Importar o actualizar desde Makor</p>
            </Link>
            <Link to="/admin/productos" className="block w-full p-4 text-left rounded-lg border border-stone-200 hover:border-brand-600 hover:bg-brand-50 transition-colors">
              <h4 className="font-medium text-stone-900">Gestionar Catálogo</h4>
              <p className="text-sm text-stone-500">Activar o desactivar productos</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
