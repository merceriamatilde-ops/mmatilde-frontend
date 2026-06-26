import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, MessageCircle } from 'lucide-react';
import { api } from '../../api/client';
import { whatsappUrl } from '../../lib/utils';
import { Spinner } from '../../components/ui/Spinner';

export function BuscarPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(query);

  useEffect(() => {
    if (query.length >= 3) {
      setLoading(true);
      api.buscarProductos(query).then(res => {
        setProductos(res);
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    } else {
      setProductos([]);
    }
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim().length >= 3) {
      setSearchParams({ q: searchInput.trim() });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <h1 className="text-3xl font-bold tracking-tight font-outfit text-stone-900">Buscar Productos</h1>
        <form onSubmit={handleSearch} className="relative flex items-center">
          <input
            type="search"
            placeholder="Buscar por nombre o código (mín. 3 letras)..."
            className="w-full h-14 pl-12 pr-4 rounded-full border-2 border-brand-200 bg-white shadow-sm focus:border-brand-600 focus:ring-0 transition-colors text-lg"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Search className="absolute left-4 text-brand-600 h-6 w-6" />
          <button type="submit" className="absolute right-2 h-10 px-6 rounded-full bg-brand-800 text-white font-medium hover:bg-brand-700 transition-colors">
            Buscar
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size={40} /></div>
      ) : query && query.length < 3 ? (
        <p className="text-center text-stone-500 py-12">Ingresá al menos 3 caracteres para buscar.</p>
      ) : query && productos.length === 0 ? (
        <p className="text-center text-stone-500 py-12">No se encontraron productos para "{query}".</p>
      ) : productos.length > 0 ? (
        <div className="space-y-6">
          <p className="text-stone-600 font-medium">Resultados para "{query}"</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {productos.map((p) => (
              <div key={p.id} className="product-card border rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow flex flex-col">
                <Link to={`/producto/${p.slug}`} className="block h-48 bg-white flex-shrink-0">
                  {p.imagenUrl ? (
                    <img src={p.imagenUrl} alt={p.nombre} className="w-full h-full object-contain p-4 mix-blend-multiply" />
                  ) : (
                    <div className="w-full h-full bg-stone-200 animate-pulse"></div>
                  )}
                </Link>
                <div className="p-4 flex flex-col flex-1">
                  <p className="text-xs text-stone-500 mb-1">{p.categoria}</p>
                  <Link to={`/producto/${p.slug}`}>
                    <h3 className="font-medium text-brand-800 leading-tight transition-colors line-clamp-2">{p.nombre}</h3>
                  </Link>
                  <div className="mt-auto pt-4">
                    <a
                      href={whatsappUrl(p.nombre)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-full bg-stone-100 text-stone-900 hover:bg-brand-800 hover:text-white py-2 rounded transition-colors text-sm font-medium"
                    >
                      <MessageCircle size={16} className="mr-2" />
                      Consultar
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
