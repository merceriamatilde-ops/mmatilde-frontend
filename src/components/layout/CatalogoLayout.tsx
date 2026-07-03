import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Menu, Search } from 'lucide-react';
import { whatsappUrl } from '../../lib/utils';
import { api } from '../../api/client';
import { Logo } from '../ui/Logo';
import { MobileMenu } from '../ui/MobileMenu';
import { WhatsAppIcon } from '../ui/WhatsAppIcon';
import ReactGA from 'react-ga4';

export function CatalogoLayout() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // Config fetch on load
    api.getConfiguracion().then(setConfig).catch(console.error);
  }, []);

  const DIAS_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const formatDiasConsecutivos = (dias: string[]) => {
    if (!dias || dias.length === 0) return '';
    if (dias.length === 1) return dias[0];
    
    const sorted = [...dias].sort((a, b) => DIAS_ORDER.indexOf(a) - DIAS_ORDER.indexOf(b));
    
    if (sorted.length === 2) return `${sorted[0]} y ${sorted[1]}`;

    let isConsecutive = true;
    for (let i = 0; i < sorted.length - 1; i++) {
      const currIdx = DIAS_ORDER.indexOf(sorted[i]);
      const nextIdx = DIAS_ORDER.indexOf(sorted[i + 1]);
      if (nextIdx !== currIdx + 1) {
        isConsecutive = false;
        break;
      }
    }

    if (isConsecutive && sorted.length >= 3) {
      return `De ${sorted[0]} a ${sorted[sorted.length - 1]}`;
    }

    const last = sorted.pop();
    return `${sorted.join(', ')} y ${last}`;
  };

  const renderHorarios = () => {
    if (!config.horarios) return <li>No hay horarios configurados.</li>;
    try {
      const grupos = JSON.parse(config.horarios);
      if (!Array.isArray(grupos) || grupos.length === 0) return <li>No hay horarios configurados.</li>;
      
      const elements = grupos.map((g: any, i: number) => {
        const diasStr = formatDiasConsecutivos(g.dias);
        const turnosStr = g.turnos.map((t: any) => `${t.apertura} a ${t.cierre}`).join(' y ');
        return <li key={`abierto-${i}`}><span className="font-medium text-white">{diasStr}:</span> {turnosStr}</li>;
      });

      const configuredDays = new Set<string>();
      grupos.forEach((g: any) => {
        if (g.dias) g.dias.forEach((d: string) => configuredDays.add(d));
      });

      const closedDays = DIAS_ORDER.filter(d => !configuredDays.has(d));
      if (closedDays.length > 0) {
        const closedStr = formatDiasConsecutivos(closedDays);
        elements.push(
          <li key="cerrado">
            <span className="font-medium text-white">{closedStr}:</span> Cerrado
          </li>
        );
      }

      return elements;
    } catch {
      return <li>Error al cargar horarios</li>;
    }
  };

  const whatsappPhone = config.whatsapp || '+5493435190082';

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-stone-100 bg-white shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 max-w-7xl gap-4">
          
          {/* Logo (Left) */}
          <Link to="/" className="flex items-center shrink-0" onClick={() => setIsMenuOpen(false)}>
            <Logo className="h-10 sm:h-12 w-auto object-contain text-brand-800" />
          </Link>

          {/* Search (Center on Desktop, Hidden on Mobile) */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <form action="/buscar" method="get" className="relative w-full">
              <input 
                type="text" 
                name="q"
                placeholder="Buscar lanas, botones, hilos…"
                className="w-full bg-stone-100 border border-stone-200 focus:bg-white focus:border-brand-400 rounded-full py-2.5 pl-4 pr-10 text-base transition-colors focus:outline-none"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-brand-800 transition-colors">
                <Search className="w-5 h-5" />
              </button>
            </form>
          </div>

          {/* Desktop Nav & Mobile Icons (Right) */}
          <div className="flex items-center space-x-1 sm:space-x-4">
            
            {/* Desktop Links */}
            <nav className="hidden md:flex items-center gap-1.5 text-[15px] font-semibold">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 transition-colors ${
                    isActive
                      ? 'bg-stone-100 text-brand-800'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-brand-800'
                  }`
                }
              >
                Inicio
              </NavLink>
              <NavLink
                to="/categorias"
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 transition-colors ${
                    isActive
                      ? 'bg-stone-100 text-brand-800'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-brand-800'
                  }`
                }
              >
                Categorías
              </NavLink>
            </nav>

            {/* Mobile Search Icon */}
            <Link 
              to="/buscar" 
              className="md:hidden p-2 text-brand-800 rounded-full hover:bg-brand-50 transition-colors"
            >
              <Search className="w-6 h-6" />
            </Link>
            
            {/* Mobile Hamburger Icon */}
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="md:hidden p-2 text-brand-800 rounded-full hover:bg-brand-50 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        config={config} 
      />

      {/* Main Content (cada página maneja su propio container para permitir bandas full-bleed) */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="mt-12 bg-brand-900 text-brand-100">
        <div className="container mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 md:flex-row md:justify-between md:gap-12">
          <div className="md:max-w-sm">
            <h3 className="font-outfit text-lg font-semibold text-white">{config.nombre_negocio || 'Matilde Mercería'}</h3>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-brand-200">
              {config.slogan || 'Tu mercería de confianza. Todo lo que necesitás para tus proyectos.'}
            </p>
            <div className="mt-4 flex gap-2.5">
              <a
                href={whatsappUrl(undefined, whatsappPhone)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => ReactGA.event({ category: 'WhatsApp', action: 'Consultar_Footer' })}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-brand-100 transition-colors hover:bg-white/25 hover:text-white"
                aria-label="WhatsApp"
                title="WhatsApp"
              >
                <WhatsAppIcon size={20} />
              </a>
              {config.instagram_url && (
                <a
                  href={config.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => ReactGA.event({ category: 'Social', action: 'Click_Instagram' })}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-brand-100 transition-colors hover:bg-white/25 hover:text-white"
                  aria-label="Instagram"
                  title="Instagram"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                </a>
              )}
              {config.facebook_url && (
                <a
                  href={config.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => ReactGA.event({ category: 'Social', action: 'Click_Facebook' })}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-brand-100 transition-colors hover:bg-white/25 hover:text-white"
                  aria-label="Facebook"
                  title="Facebook"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
              )}
            </div>
          </div>
          <div>
            <h4 className="mb-3 font-outfit text-base font-semibold text-white">Contacto</h4>
            <ul className="space-y-2 text-sm text-brand-200">
              <li>📍 {config.direccion || 'Av. Francisco Ramírez 1883, Paraná'}</li>
              <li>📱 {config.telefono || '0343 519-0082'}</li>
              {config.email && (
                <li>
                  ✉️{' '}
                  <a href={`mailto:${config.email}`} className="transition-colors hover:text-white">
                    {config.email}
                  </a>
                </li>
              )}
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-outfit text-base font-semibold text-white">Horarios</h4>
            <ul className="space-y-2 text-sm text-brand-200">
              {renderHorarios()}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/15 px-4 py-5 text-center text-sm text-brand-300">
          © {new Date().getFullYear()} {config.nombre_negocio || 'Matilde Mercería'} · Paraná, Entre Ríos
        </div>
      </footer>

      {/* FAB */}
      <a
        href={whatsappUrl(undefined, whatsappPhone)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => ReactGA.event({ category: 'WhatsApp', action: 'Consultar_FAB' })}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2"
        aria-label="Contactar por WhatsApp"
      >
        <WhatsAppIcon size={30} />
      </a>
    </div>
  );
}
