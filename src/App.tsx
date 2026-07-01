import React, { useMemo } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { HelmetProvider } from 'react-helmet-async';
import ReactGA from 'react-ga4';

import { AuthProvider } from './hooks/useAuth';

function RouteTracker() {
  const location = useLocation();
  React.useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
  }, [location]);
  return null;
}

// Layouts
import { CatalogoLayout } from './components/layout/CatalogoLayout';
import { AdminLayout } from './components/layout/AdminLayout';

// Pages - Public
import { HomePage } from './pages/catalogo/HomePage';
import { CategoriasPage } from './pages/catalogo/CategoriasPage';
import { CategoriaDetallePage } from './pages/catalogo/CategoriaDetallePage';
import { ProductoDetallePage } from './pages/catalogo/ProductoDetallePage';
import { BuscarPage } from './pages/catalogo/BuscarPage';
import { NotFoundPage } from './pages/catalogo/NotFoundPage';
import { LoginPage } from './pages/auth/LoginPage';

// Pages - Admin
import { DashboardPage } from './pages/admin/DashboardPage';
import { ProductosPage } from './pages/admin/ProductosPage';
import { CategoriasPage as AdminCategoriasPage } from './pages/admin/CategoriasPage';
import { PreciosPage } from './pages/admin/PreciosPage';
import { SyncPage } from './pages/admin/SyncPage';
import { ConfiguracionPage } from './pages/admin/ConfiguracionPage';
import { ColoresPage } from './pages/admin/ColoresPage';

// Pages - IA
import { EstimadorIAPage } from './pages/ia/EstimadorIAPage';

function App() {
  const isBackoffice = useMemo(() => {
    const hostname = window.location.hostname;
    return hostname.startsWith('bo.');
  }, []);

  const isIaSubdomain = useMemo(() => {
    const hostname = window.location.hostname;
    return hostname.startsWith('ia.');
  }, []);

  return (
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <RouteTracker />
          <Routes>
            {isIaSubdomain ? (
              // --- IA ROUTES ---
              <>
                <Route path="/" element={<EstimadorIAPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </>
            ) : isBackoffice ? (
              // --- BACKOFFICE ROUTES ---
              <>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<AdminLayout />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="productos" element={<ProductosPage />} />
                  <Route path="categorias" element={<AdminCategoriasPage />} />
                  <Route path="precios" element={<PreciosPage />} />
                  <Route path="colores" element={<ColoresPage />} />
                  <Route path="sync" element={<SyncPage />} />
                  <Route path="configuracion" element={<ConfiguracionPage />} />
                </Route>
                <Route path="*" element={<NotFoundPage />} />
              </>
            ) : (
              // --- PUBLIC CATALOG ROUTES ---
              <>
                <Route path="/asistente" element={<EstimadorIAPage />} />
                <Route path="/" element={<CatalogoLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path="categorias" element={<CategoriasPage />} />
                  <Route path="categorias/:slug" element={<CategoriaDetallePage />} />
                  <Route path="producto/:slug" element={<ProductoDetallePage />} />
                  <Route path="buscar" element={<BuscarPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </>
            )}
          </Routes>
        </AuthProvider>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
