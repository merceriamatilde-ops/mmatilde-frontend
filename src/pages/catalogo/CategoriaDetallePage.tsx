import React, { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { MessageCircle, ChevronRight } from 'lucide-react';
import { api } from '../../api/client';
import { whatsappUrl } from '../../lib/utils';
import { Spinner } from '../../components/ui/Spinner';

import { SEO } from '../../components/SEO';
import { NotFoundPage } from './NotFoundPage';

export function CategoriaDetallePage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const subSlug = searchParams.get('sub');

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api.getCategoriaProductos(slug, subSlug || undefined).then(res => {
      setData(res);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setError(true);
      setLoading(false);
    });
  }, [slug, subSlug]);

  if (loading) return <div className="flex h-[50vh] items-center justify-center"><Spinner size={40} /></div>;
  if (error || !data) return <NotFoundPage />;

  const categoriaName = data.nombre;
  const productos = data.productos || [];
  const subcategorias = data.subcategorias || [];
  const currentSub = subcategorias.find((s: any) => s.slug === subSlug);

  return (
    <div className="space-y-8 animate-fade-in">
      <SEO 
        title={currentSub ? `${categoriaName} - ${currentSub.nombre}` : categoriaName} 
        description={`Explorá todos los productos de la categoría ${categoriaName} en Matilde Mercería.`}
      />
      
      <div className="border-b border-stone-200 pb-6">
        <nav className="flex items-center space-x-2 text-sm text-stone-500 mb-4">
          <Link to="/" className="text-brand-800 transition-colors">Inicio</Link>
          <ChevronRight size={16} />
          <Link to="/categorias" className="text-brand-800 transition-colors">Categorías</Link>
          <ChevronRight size={16} />
          {currentSub ? (
            <>
              <button onClick={() => setSearchParams({})} className="text-brand-800 transition-colors hover:underline">
                {categoriaName}
              </button>
              <ChevronRight size={16} />
              <span className="text-stone-900 font-medium truncate">
                {currentSub.nombre}
              </span>
            </>
          ) : (
            <span className="text-stone-900 font-medium truncate">{categoriaName}</span>
          )}
        </nav>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-outfit text-stone-900">
          {currentSub ? currentSub.nombre : categoriaName}
        </h1>
        <p className="text-stone-500 mt-2">{productos.length} {productos.length === 1 ? 'producto' : 'productos'}</p>
      </div>

      {subcategorias.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSearchParams({})}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              !subSlug ? 'bg-brand-800 text-white shadow-md' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            Todos
          </button>
          {subcategorias.map((sub: any) => (
            <button
              key={sub.id}
              onClick={() => setSearchParams({ sub: sub.slug })}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                subSlug === sub.slug ? 'bg-brand-800 text-white shadow-md' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {sub.nombre}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {productos.map((p: any) => (
          <div key={p.id} className="product-card border rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow flex flex-col">
            <Link to={`/producto/${p.slug}`} className="block h-48 bg-white flex-shrink-0">
              {p.imagenUrl ? (
                <img src={p.imagenUrl} alt={p.nombre} className="w-full h-full object-contain p-4 mix-blend-multiply" />
              ) : (
                <div className="w-full h-full bg-stone-200 animate-pulse"></div>
              )}
            </Link>
            <div className="p-4 flex flex-col flex-1">
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
        {productos.length === 0 && (
          <p className="col-span-full text-center text-stone-500 py-12">No hay productos en esta categoría.</p>
        )}
      </div>
    </div>
  );
}
