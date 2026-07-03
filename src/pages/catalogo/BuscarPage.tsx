import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { api } from '../../api/client';
import { Spinner } from '../../components/ui/Spinner';
import { ProductCard, ProductGrid } from '../../components/catalogo';

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
    <div className="animate-fade-in">
      {/* Banda gris full-bleed con el buscador */}
      <section className="border-b border-stone-200 bg-stone-50 py-10">
        <div className="container mx-auto max-w-7xl px-4">
          <h1 className="font-outfit text-[clamp(1.6rem,5vw,2.2rem)] font-bold tracking-tight text-brand-800">
            ¿Qué estás buscando?
          </h1>
          <p className="mt-1.5 text-stone-600">Escribí el nombre del producto o la categoría</p>
          <form onSubmit={handleSearch} className="relative mt-5 flex max-w-2xl items-center">
            <Search className="absolute left-5 h-6 w-6 text-brand-600" />
            <input
              type="search"
              placeholder="Ej: lana merino, botón de madera…"
              className="h-14 w-full rounded-full border-2 border-stone-200 bg-white pl-14 pr-32 text-lg transition-colors focus:border-brand-400 focus:outline-none"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button
              type="submit"
              className="absolute right-2 h-10 rounded-full bg-brand-800 px-6 font-outfit font-semibold text-white transition-colors hover:bg-brand-900"
            >
              Buscar
            </button>
          </form>
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size={40} /></div>
        ) : query && query.length < 3 ? (
          <p className="py-12 text-center text-stone-500">Ingresá al menos 3 caracteres para buscar.</p>
        ) : query && productos.length === 0 ? (
          <p className="py-12 text-center text-stone-500">No se encontraron productos para "{query}".</p>
        ) : productos.length > 0 ? (
          <div className="space-y-5">
            <p className="text-stone-600">
              Mostrando resultados para <strong className="font-semibold text-stone-900">"{query}"</strong> · {productos.length} {productos.length === 1 ? 'producto' : 'productos'}
            </p>
            <ProductGrid>
              {productos.map((p) => (
                <ProductCard key={p.id} producto={p} whatsappAction="Consultar_Busqueda" />
              ))}
            </ProductGrid>
          </div>
        ) : (
          <p className="py-8 text-stone-500">Ideas: lana, botones, agujas, cinta raso, guata…</p>
        )}
      </section>
    </div>
  );
}
