import React, { useEffect, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { MessageCircle, Menu, Search } from 'lucide-react';
import { whatsappUrl } from '../../lib/utils';
import { api } from '../../api/client';
import { Logo } from '../ui/Logo';
import { MobileMenu } from '../ui/MobileMenu';
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
        return <li key={`abierto-${i}`}><span className="font-medium text-stone-800">{diasStr}:</span> {turnosStr}</li>;
      });

      const configuredDays = new Set<string>();
      grupos.forEach((g: any) => {
        if (g.dias) g.dias.forEach((d: string) => configuredDays.add(d));
      });

      const closedDays = DIAS_ORDER.filter(d => !configuredDays.has(d));
      if (closedDays.length > 0) {
        const closedStr = formatDiasConsecutivos(closedDays);
        elements.push(
          <li key="cerrado" className="text-stone-500">
            <span className="font-medium text-stone-800">{closedStr}:</span> Cerrado
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
                placeholder="Buscar productos..."
                className="w-full bg-stone-100 border-transparent focus:bg-white focus:border-brand-600 focus:ring-2 focus:ring-brand-200 rounded-full py-2 pl-4 pr-10 text-sm"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-brand-800 transition-colors">
                <Search className="w-5 h-5" />
              </button>
            </form>
          </div>

          {/* Desktop Nav & Mobile Icons (Right) */}
          <div className="flex items-center space-x-1 sm:space-x-4">
            
            {/* Desktop Links */}
            <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
              <Link to="/categorias" className="text-stone-700 hover:text-brand-800 transition-colors">Categorías</Link>
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

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-12 text-stone-600">
        <div className="container mx-auto px-4 grid gap-8 md:grid-cols-4 max-w-7xl">
          <div className="md:col-span-1">
            <h3 className="mb-4 text-lg font-semibold text-stone-900 font-outfit">{config.nombre_negocio || 'Matilde Mercería'}</h3>
            <p className="text-sm leading-relaxed">{config.slogan || 'Tu mercería de confianza. Todo lo que necesitás para tus proyectos.'}</p>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold text-stone-900 font-outfit">Contacto</h3>
            <ul className="space-y-2 text-sm">
              <li>{config.direccion || 'Av. Francisco Ramírez 1883, Paraná'}</li>
              <li>Tel: {config.telefono || '0343 519-0082'}</li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold text-stone-900 font-outfit">Horarios</h3>
            <ul className="space-y-2 text-sm">
              {renderHorarios()}
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold text-stone-900 font-outfit">Redes Sociales</h3>
            <div className="flex space-x-4">
              {config.facebook_url && (
                <a href={config.facebook_url} target="_blank" rel="noopener noreferrer" onClick={() => ReactGA.event({ category: 'Social', action: 'Click_Facebook' })} className="text-stone-400 hover:text-blue-600 transition-colors" title="Facebook">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
              )}
              {config.instagram_url && (
                <a href={config.instagram_url} target="_blank" rel="noopener noreferrer" onClick={() => ReactGA.event({ category: 'Social', action: 'Click_Instagram' })} className="text-stone-400 hover:text-pink-600 transition-colors" title="Instagram">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                </a>
              )}
              {!config.facebook_url && !config.instagram_url && (
                <span className="text-sm text-stone-400">Próximamente</span>
              )}
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-8 pt-8 border-t border-stone-100 text-sm text-center">
          <p>© {new Date().getFullYear()} {config.nombre_negocio || 'Matilde Mercería'}. Todos los derechos reservados.</p>
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
        <MessageCircle size={28} />
      </a>
    </div>
  );
}
