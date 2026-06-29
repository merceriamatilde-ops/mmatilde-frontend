import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MessageCircle, ChevronRight } from 'lucide-react';
import { api } from '../../api/client';
import { whatsappUrl } from '../../lib/utils';
import { Spinner } from '../../components/ui/Spinner';

import { SEO } from '../../components/SEO';
import { NotFoundPage } from './NotFoundPage';

export function ProductoDetallePage() {
  const { slug } = useParams();
  const [producto, setProducto] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    api.getProducto(slug).then(res => {
      setProducto(res);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setError(true);
      setLoading(false);
    });
  }, [slug]);

  if (loading) return <div className="flex h-[50vh] items-center justify-center"><Spinner size={40} /></div>;
  if (error || !producto) return <NotFoundPage />;

  return (
    <div className="animate-fade-in space-y-8">
      <SEO 
        title={producto.nombre} 
        description={producto.descripcion || `Consultá el precio y detalles de ${producto.nombre} en Matilde Mercería.`}
        image={producto.imagenes && producto.imagenes.length > 0 ? producto.imagenes[0] : undefined}
        type="product"
      />
      <nav className="flex items-center space-x-2 text-sm text-stone-500">
        <Link to="/" className="text-brand-800 transition-colors">Inicio</Link>
        <ChevronRight size={16} />
        <Link to={`/categorias/${producto.categoriaSlug}`} className="text-brand-800 transition-colors">{producto.categoria}</Link>
        {producto.subcategoria && (
          <>
            <ChevronRight size={16} />
            <Link to={`/categorias/${producto.categoriaSlug}?sub=${producto.subcategoriaSlug}`} className="text-brand-800 transition-colors">{producto.subcategoria}</Link>
          </>
        )}
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
            <p className="text-sm font-medium text-brand-800 mb-2">
              {producto.categoria} {producto.subcategoria && ` > ${producto.subcategoria}`}
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-stone-900 font-outfit leading-tight mb-4">
              {producto.nombre}
            </h1>
            {producto.descripcion && (
              <p className="text-stone-600 leading-relaxed text-lg mb-6">
                {producto.descripcion}
              </p>
            )}

            {producto.variantes && producto.variantes.length > 0 && (
              <div className="space-y-6 pt-6 border-t border-stone-100">
                
                {/* Colores */}
                {(() => {
                  const colors = Array.from(new Map(
                    producto.variantes
                      .filter((v: any) => v.colorId && v.colorHex)
                      .map((v: any) => [v.colorId, { id: v.colorId, nombre: v.colorNombre, hex: v.colorHex }])
                  ).values());

                  if (colors.length === 0) return null;

                  return (
                    <div>
                      <h3 className="text-sm font-medium text-stone-900 mb-3 uppercase tracking-wider">Colores Disponibles</h3>
                      <div className="flex flex-wrap gap-3">
                        {colors.map((c: any) => (
                          <div 
                            key={c.id} 
                            className="group relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-stone-200 shadow-sm transition-transform hover:scale-110 hover:shadow-md"
                            style={{ backgroundColor: c.hex }}
                            title={c.nombre}
                          >
                            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-stone-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                              {c.nombre}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Talles o Medidas */}
                {(() => {
                  const features = producto.variantes
                    .filter((v: any) => v.talle || v.medida)
                    .map((v: any) => [v.talle, v.medida].filter(Boolean).join(' - '))
                    .filter((value: any, index: any, self: any) => self.indexOf(value) === index);

                  if (features.length === 0) return null;

                  return (
                    <div>
                      <h3 className="text-sm font-medium text-stone-900 mb-3 uppercase tracking-wider">Formatos / Medidas</h3>
                      <div className="flex flex-wrap gap-2">
                        {features.map((f: string, i: number) => (
                          <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-stone-100 text-stone-800">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}

              </div>
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

      {producto.relacionados && producto.relacionados.length > 0 && (
        <div className="pt-16 border-t border-stone-200 mt-16">
          <h2 className="text-2xl font-bold font-outfit text-stone-900 mb-6">También te puede interesar</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {producto.relacionados.map((rel: any) => (
              <Link 
                key={rel.id}
                to={`/producto/${rel.slug}`} 
                className="group flex flex-col bg-white border border-stone-200 rounded-xl overflow-hidden hover:shadow-lg transition-all"
              >
                <div className="aspect-square bg-stone-50 p-4 flex items-center justify-center overflow-hidden">
                  {rel.imagenUrl ? (
                    <img src={rel.imagenUrl} alt={rel.nombre} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform" />
                  ) : (
                    <span className="text-stone-300 text-sm">Sin imagen</span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-stone-900 line-clamp-2 text-sm group-hover:text-brand-700 transition-colors">
                    {rel.nombre}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
