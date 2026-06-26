import React from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LayoutDashboard, Package, FolderTree, Settings, RefreshCw, LogOut, Tags } from 'lucide-react';

export function AdminLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/productos', label: 'Productos', icon: Package },
    { href: '/admin/categorias', label: 'Categorías', icon: FolderTree },
    { href: '/admin/precios', label: 'Precios', icon: Tags },
    { href: '/admin/sync', label: 'Sincronización Makor', icon: RefreshCw },
    { href: '/admin/configuracion', label: 'Configuración', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-stone-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-stone-900 text-stone-300 flex-shrink-0 flex flex-col">
        <div className="h-16 flex items-center px-6 bg-stone-950">
          <span className="text-xl font-bold text-white tracking-tight">Matilde <span className="text-brand-600">BO</span></span>
        </div>
        
        <nav className="flex-1 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-brand-800/10 text-brand-600 border-r-2 border-brand-600' 
                    : 'hover:bg-stone-800 hover:text-white'
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-stone-800">
          <div className="flex items-center mb-4">
            <div className="h-8 w-8 rounded-full bg-brand-800 flex items-center justify-center text-white font-bold">
              {user?.nombre?.charAt(0) || 'A'}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user?.nombre}</p>
              <p className="text-xs text-stone-500">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center px-2 py-2 text-sm font-medium text-stone-400 hover:text-white transition-colors rounded-md hover:bg-stone-800"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
