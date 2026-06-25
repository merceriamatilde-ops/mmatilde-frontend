import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';

import { AuthProvider } from './hooks/useAuth';

// Layouts
import { CatalogoLayout } from './components/layout/CatalogoLayout';
import { AdminLayout } from './components/layout/AdminLayout';

// Pages - Public
import { HomePage } from './pages/catalogo/HomePage';
import { CategoriasPage } from './pages/catalogo/CategoriasPage';
import { CategoriaDetallePage } from './pages/catalogo/CategoriaDetallePage';
import { ProductoDetallePage } from './pages/catalogo/ProductoDetallePage';
import { BuscarPage } from './pages/catalogo/BuscarPage';
import { LoginPage } from './pages/auth/LoginPage';

// Pages - Admin
import { DashboardPage } from './pages/admin/DashboardPage';
import { ProductosPage } from './pages/admin/ProductosPage';
import { CategoriasAdminPage } from './pages/admin/CategoriasAdminPage';
import { PreciosPage } from './pages/admin/PreciosPage';
import { SyncPage } from './pages/admin/SyncPage';
import { ConfiguracionPage } from './pages/admin/ConfiguracionPage';
import { CategoriasPage as AdminCategoriasPage } from './pages/admin/CategoriasPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<CatalogoLayout />}>
            <Route index element={<HomePage />} />
            <Route path="categorias" element={<CategoriasPage />} />
            <Route path="categorias/:slug" element={<CategoriaDetallePage />} />
            <Route path="producto/:slug" element={<ProductoDetallePage />} />
            <Route path="buscar" element={<BuscarPage />} />
          </Route>

          <Route path="/login" element={<LoginPage />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="categorias" element={<AdminCategoriasPage />} />
              <Route path="productos" element={<ProductosPage />} />
              <Route path="precios" element={<PreciosPage />} />
              <Route path="sync" element={<SyncPage />} />
              <Route path="configuracion" element={<ConfiguracionPage />} />
          </Route>
        </Routes>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
