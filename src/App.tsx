import React, { useMemo } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { HelmetProvider } from 'react-helmet-async';
import ReactGA from 'react-ga4';

import { AuthProvider } from './hooks/useAuth';
import { PermisosProvider } from './hooks/usePermisosModulos';

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
import { RequireModule } from './components/auth/RequireModule';

// Pages - Public
import { HomePage } from './pages/catalogo/HomePage';
import { CategoriasPage } from './pages/catalogo/CategoriasPage';
import { CategoriaDetallePage } from './pages/catalogo/CategoriaDetallePage';
import { ProductoDetallePage } from './pages/catalogo/ProductoDetallePage';
import { BuscarPage } from './pages/catalogo/BuscarPage';
import { ColeccionDetallePage } from './pages/catalogo/ColeccionDetallePage';
import { ContactoPage } from './pages/catalogo/ContactoPage';
import { NotFoundPage } from './pages/catalogo/NotFoundPage';
import { LoginPage } from './pages/auth/LoginPage';

// Pages - Admin
import { DashboardPage } from './pages/admin/DashboardPage';
import { ProductosPage } from './pages/admin/ProductosPage';
import { CategoriasPage as AdminCategoriasPage } from './pages/admin/CategoriasPage';
import { BannersPage } from './pages/admin/BannersPage';
import { PreciosPage } from './pages/admin/PreciosPage';
import { SyncPage } from './pages/admin/SyncPage';
import { ConfiguracionPage } from './pages/admin/ConfiguracionPage';
import { ColoresPage } from './pages/admin/ColoresPage';
import { TagsPage } from './pages/admin/TagsPage';
import { VentasPage } from './pages/admin/VentasPage';
import { EstadisticasPage } from './pages/admin/EstadisticasPage';
import { IaPage } from './pages/admin/IaPage';
import { UsuariosPage } from './pages/admin/UsuariosPage';

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
          <PermisosProvider>
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
                  <Route index element={<RequireModule modulo="dashboard"><DashboardPage /></RequireModule>} />
                  <Route path="productos" element={<RequireModule modulo="productos"><ProductosPage /></RequireModule>} />
                  <Route path="ventas" element={<RequireModule modulo="ventas"><VentasPage /></RequireModule>} />
                  <Route path="categorias" element={<RequireModule modulo="categorias"><AdminCategoriasPage /></RequireModule>} />
                  <Route path="banners" element={<RequireModule modulo="banners"><BannersPage /></RequireModule>} />
                  <Route path="precios" element={<RequireModule modulo="precios"><PreciosPage /></RequireModule>} />
                  <Route path="estadisticas" element={<RequireModule modulo="estadisticas"><EstadisticasPage /></RequireModule>} />
                  <Route path="colores" element={<RequireModule modulo="colores"><ColoresPage /></RequireModule>} />
                  <Route path="tags" element={<RequireModule modulo="tags"><TagsPage /></RequireModule>} />
                  <Route path="sync" element={<RequireModule modulo="sync"><SyncPage /></RequireModule>} />
                  <Route path="ia" element={<RequireModule modulo="ia"><IaPage /></RequireModule>} />
                  <Route path="configuracion" element={<RequireModule modulo="configuracion"><ConfiguracionPage /></RequireModule>} />
                  <Route path="usuarios" element={<RequireModule modulo="usuarios"><UsuariosPage /></RequireModule>} />
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
                  <Route path="colecciones/:slug" element={<ColeccionDetallePage />} />
                  <Route path="producto/:slug" element={<ProductoDetallePage />} />
                  <Route path="buscar" element={<BuscarPage />} />
                  <Route path="contacto" element={<ContactoPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </>
            )}
          </Routes>
          </PermisosProvider>
        </AuthProvider>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
