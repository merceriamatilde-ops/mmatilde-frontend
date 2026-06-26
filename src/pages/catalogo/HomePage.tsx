import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { api } from '../../api/client';
import { whatsappUrl } from '../../lib/utils';
import { Spinner } from '../../components/ui/Spinner';

import { SEO } from '../../components/SEO';

export function HomePage() {
  const [data, setData] = useState<{ categorias: any[], productosRecientes: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getHomeData().then(res => {
      setData(res);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex h-[50vh] items-center justify-center"><Spinner size={40} /></div>;
  if (!data) return <div className="text-center py-20 text-red-500">Error al cargar datos del catálogo.</div>;

  return (
    <div className="animate-fade-in space-y-16">
      <SEO />


      {/* Categorías */}
      <section className="section">
        <div className="section-header flex justify-between items-center mb-6">
          <h2 className="section-title text-2xl font-bold font-outfit">Categorías Destacadas</h2>
          <Link to="/categorias" className="section-link text-brand-800 hover:underline">Ver todas</Link>
        </div>
        <div className="category-grid grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.categorias.map((cat) => (
            <Link key={cat.slug} to={`/categorias/${cat.slug}`} className="category-card p-6 border rounded-lg hover:shadow-lg hover:border-brand-600 transition-all text-center group bg-white">
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{cat.icon || '📦'}</div>
              <h3 className="font-medium text-stone-900">{cat.nombre}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* Destacados */}
      <section className="section">
        <div className="section-header mb-6">
          <h2 className="section-title text-2xl font-bold font-outfit">Nuevos Ingresos</h2>
        </div>
        <div className="product-grid grid grid-cols-2 md:grid-cols-4 gap-6">
          {data.productosRecientes.length === 0 ? (
            <p className="text-stone-500 col-span-full">No hay productos visibles por el momento.</p>
          ) : (
            data.productosRecientes.map((p) => (
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
            ))
          )}
        </div>
      </section>
    </div>
  );
}
