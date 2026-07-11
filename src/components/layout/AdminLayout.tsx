import React, { useState } from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Spinner } from '../ui/Spinner';
import { LayoutDashboard, Package, FolderTree, Settings, RefreshCw, LogOut, Tags, Menu, X, Palette, Brain, Bookmark, ShoppingCart, BarChart3, Users } from 'lucide-react';
import { canAccessHref, isAdmin, MODULOS_NAV } from '../../lib/adminAccess';
import { usePermisosModulos } from '../../hooks/usePermisosModulos';

export function AdminLayout() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { permisos } = usePermisosModulos();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="admin-shell flex h-screen items-center justify-center bg-stone-100">
        <Spinner size={40} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const navItems = MODULOS_NAV.map((m) => ({
    href: m.href,
    label: m.label,
    icon: {
      dashboard: LayoutDashboard,
      ventas: ShoppingCart,
      productos: Package,
      categorias: FolderTree,
      tags: Bookmark,
      colores: Palette,
      precios: Tags,
      sync: RefreshCw,
      estadisticas: BarChart3,
      ia: Brain,
      configuracion: Settings,
      usuarios: Users,
    }[m.key],
  })).filter((item) => canAccessHref(item.href, user?.rol, permisos));

  return (
    <div className="admin-shell h-screen overflow-hidden bg-stone-100 flex flex-col md:flex-row relative">
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-stone-950 px-4 py-3 shadow-md z-30">
        <span className="text-xl font-bold text-white tracking-tight">Matilde <span className="text-brand-600">BO</span></span>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-md text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-stone-900 text-stone-300 flex-shrink-0 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="h-16 hidden md:flex items-center px-6 bg-stone-950">
          <span className="text-xl font-bold text-white tracking-tight">Matilde <span className="text-brand-600">BO</span></span>
        </div>
        
        <nav className="admin-scroll-dark flex-1 space-y-1 overflow-y-auto py-4 overscroll-contain">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
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

        <div className="p-4 border-t border-stone-800 bg-stone-900">
          <div className="flex items-center mb-4 overflow-hidden">
            <div className="h-8 w-8 flex-shrink-0 rounded-full bg-brand-800 flex items-center justify-center text-white font-bold">
              {user?.nombre?.charAt(0) || 'A'}
            </div>
            <div className="ml-3 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.nombre}</p>
              <p className="text-xs text-stone-500 truncate">{user?.email}</p>
              {user?.rol && (
                <span
                  className={`mt-1 inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    isAdmin(user.rol)
                      ? 'bg-brand-900/60 text-brand-300'
                      : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  {user.rol}
                </span>
              )}
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
      <main className="flex-1 overflow-auto overscroll-contain bg-stone-100 flex flex-col w-full">
        <div className="p-4 sm:p-6 md:p-8 w-full max-w-full overflow-x-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
