import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { api } from '../../api/client';
import { whatsappUrl } from '../../lib/utils';
import { Spinner } from '../../components/ui/Spinner';

import { SEO } from '../../components/SEO';

export function CategoriaDetallePage() {
  const { slug } = useParams();
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api.getCategoriaProductos(slug).then(res => {
      setProductos(res);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [slug]);

  if (loading) return <div className="flex h-[50vh] items-center justify-center"><Spinner size={40} /></div>;

  const categoriaName = productos.length > 0 ? productos[0].categoria : 'Categoría';

  return (
    <div className="space-y-8 animate-fade-in">
      <SEO 
        title={categoriaName} 
        description={`Explorá todos los productos de la categoría ${categoriaName} en Matilde Mercería.`}
      />
      <div className="border-b border-stone-200 pb-4">
        <h1 className="text-3xl font-bold tracking-tight font-outfit text-stone-900">{categoriaName}</h1>
        <p className="text-stone-500 mt-2">{productos.length} {productos.length === 1 ? 'producto' : 'productos'} en esta categoría.</p>
      </div>

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
