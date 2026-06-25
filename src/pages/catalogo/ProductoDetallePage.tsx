import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MessageCircle, ChevronRight } from 'lucide-react';
import { api } from '../../api/client';
import { whatsappUrl } from '../../lib/utils';
import { Spinner } from '../../components/ui/Spinner';

export function ProductoDetallePage() {
  const { slug } = useParams();
  const [producto, setProducto] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    api.getProducto(slug).then(res => {
      setProducto(res);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [slug]);

  if (loading) return <div className="flex h-[50vh] items-center justify-center"><Spinner size={40} /></div>;
  if (!producto) return <div className="text-center py-20 text-red-500">Producto no encontrado o inactivo.</div>;

  return (
    <div className="animate-fade-in space-y-8">
      <nav className="flex items-center space-x-2 text-sm text-stone-500">
        <Link to="/" className="hover:text-amber-600 transition-colors">Inicio</Link>
        <ChevronRight size={16} />
        <Link to={`/categorias/${producto.categoriaSlug}`} className="hover:text-amber-600 transition-colors">{producto.categoria}</Link>
        <ChevronRight size={16} />
        <span className="text-stone-900 font-medium truncate">{producto.nombre}</span>
      </nav>

      <div className="grid gap-12 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-xl bg-white border border-stone-200 p-8 flex items-center justify-center">
          {producto.imagenes && producto.imagenes.length > 0 ? (
            <img 
              src={producto.imagenes[0]} 
              alt={producto.nombre} 
              className="w-full h-full object-contain mix-blend-multiply"
            />
          ) : (
            <div className="text-stone-300">Sin imagen</div>
          )}
        </div>

        <div className="space-y-8 flex flex-col justify-center">
          <div>
            <p className="text-sm font-medium text-amber-600 mb-2">{producto.categoria}</p>
            <h1 className="text-3xl md:text-4xl font-bold text-stone-900 font-outfit leading-tight mb-4">
              {producto.nombre}
            </h1>
            {producto.descripcion && (
              <p className="text-stone-600 leading-relaxed text-lg">
                {producto.descripcion}
              </p>
            )}
          </div>

          <div className="pt-8 border-t border-stone-200">
            <p className="text-sm text-stone-500 mb-4">
              Los precios varían según cantidad y condiciones. Comunicate con nosotros para recibir atención personalizada.
            </p>
            <a
              href={whatsappUrl(producto.nombre)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full md:w-auto items-center justify-center rounded-md bg-[#25D366] px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-[#20bd5a] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2"
            >
              <MessageCircle className="mr-3" size={24} />
              Consultar por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
