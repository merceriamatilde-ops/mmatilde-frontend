import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Search, ChevronDown, ChevronRight, MessageCircle, Camera } from 'lucide-react';
import { api } from '../../api/client';
import { whatsappUrl } from '../../lib/utils';
import { Logo } from './Logo';
import ReactGA from 'react-ga4';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  config: Record<string, string>;
}

export function MobileMenu({ isOpen, onClose, config }: MobileMenuProps) {
  const [categorias, setCategorias] = useState<any[]>([]);
  const [catalogoOpen, setCatalogoOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && categorias.length === 0) {
      api.getCategorias().then(setCategorias).catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get('q');
    if (q) {
      navigate(`/buscar?q=${encodeURIComponent(q.toString())}`);
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div 
        className={`fixed inset-y-0 right-0 z-[70] w-[85vw] max-w-sm bg-white shadow-xl transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header Drawer */}
        <div className="flex items-center justify-between p-4 border-b border-stone-100">
          <div className="flex items-center text-brand-800">
             <Logo className="h-8 w-auto object-contain" />
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-brand-800 rounded-full hover:bg-brand-50 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Drawer */}
        <div className="flex-1 overflow-y-auto py-4 px-6 space-y-6">
          {/* Search bar inside menu */}
          <form onSubmit={handleSearch} className="relative">
            <input 
              type="text" 
              name="q"
              placeholder="Buscar productos..."
              className="w-full bg-stone-100 border-transparent focus:bg-white focus:border-brand-600 focus:ring-2 focus:ring-brand-200 rounded-full py-2.5 pl-4 pr-10 text-sm"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-800">
              <Search className="w-5 h-5" />
            </button>
          </form>

          {/* Nav Links */}
          <nav className="flex flex-col space-y-1">
            <Link 
              to="/" 
              onClick={onClose}
              className="py-3 text-lg font-medium text-brand-800 border-b border-stone-50"
            >
              Inicio
            </Link>
            
            {/* Catalog Accordion */}
            <div>
              <button 
                onClick={() => setCatalogoOpen(!catalogoOpen)}
                className="w-full py-3 flex items-center justify-between text-lg font-medium text-brand-800 border-b border-stone-50"
              >
                <span>Catálogo</span>
                {catalogoOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ${catalogoOpen ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                <div className="pl-4 flex flex-col space-y-3 pb-3">
                  <Link 
                    to="/categorias" 
                    onClick={onClose}
                    className="text-brand-800 font-medium"
                  >
                    Ver todo
                  </Link>
                  {categorias.map(cat => (
                    <Link 
                      key={cat.id}
                      to={`/categorias/${cat.slug}`}
                      onClick={onClose}
                      className="text-brand-800 text-sm flex items-center"
                    >
                      {cat.icono && <span className="mr-2">{cat.icono}</span>}
                      {cat.nombre}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <Link 
              to="/buscar" 
              onClick={onClose}
              className="py-3 text-lg font-medium text-brand-800 border-b border-stone-50"
            >
              Buscar
            </Link>
            <Link 
              to="/contacto" 
              onClick={onClose}
              className="py-3 text-lg font-medium text-brand-800 border-b border-stone-50"
            >
              Contacto
            </Link>
          </nav>
        </div>

        {/* Footer Drawer */}
        <div className="p-6 bg-stone-50 border-t border-stone-100">
          <p className="text-sm font-medium text-stone-500 mb-4 uppercase tracking-wider">Contacto</p>
          <div className="flex flex-col space-y-4">
            {config.whatsapp && (
              <a 
                href={whatsappUrl(config.whatsapp, "Hola! Vengo desde la tienda online")}
                target="_blank" 
                rel="noreferrer"
                onClick={() => ReactGA.event({ category: 'WhatsApp', action: 'Consultar_MobileMenu' })}
                className="flex items-center text-brand-800"
              >
                <MessageCircle className="w-5 h-5 mr-3" />
                <span>WhatsApp</span>
              </a>
            )}
            {config.instagram && (
              <a 
                href={config.instagram}
                target="_blank" 
                rel="noreferrer"
                onClick={() => ReactGA.event({ category: 'Social', action: 'Click_Instagram_Mobile' })}
                className="flex items-center text-brand-800"
              >
                <Camera className="w-5 h-5 mr-3" />
                <span>Instagram</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
