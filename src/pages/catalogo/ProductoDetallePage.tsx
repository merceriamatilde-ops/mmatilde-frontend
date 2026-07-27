import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { api } from '../../api/client';
import { whatsappUrl } from '../../lib/utils';
import { Spinner } from '../../components/ui/Spinner';
import { WhatsAppIcon } from '../../components/ui/WhatsAppIcon';
import { trackViewItem, trackWhatsApp } from '../../lib/analytics';
import { JsonLd } from '../../components/JsonLd';
import { buildBreadcrumbLd, buildProductLd, productSeoDescription } from '../../lib/localSeo';

import { SEO } from '../../components/SEO';
import { NotFoundPage } from './NotFoundPage';
import { SectionHeading } from '../../components/catalogo';

export function ProductoDetallePage() {
  const { slug } = useParams();
  const [producto, setProducto] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    api
      .getProducto(slug)
      .then((res) => {
        setProducto(res);
        trackViewItem({
          id: res.id,
          nombre: res.nombre,
          slug: res.slug || slug,
          categoria: res.categoria,
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(true);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Spinner size={40} />
      </div>
    );
  }
  if (error || !producto) return <NotFoundPage />;

  return (
    <div className="container mx-auto max-w-7xl animate-fade-in space-y-4 px-4 pt-3 pb-6 md:space-y-8 md:py-6">
      <SEO 
        title={producto.nombre} 
        description={productSeoDescription(producto.nombre, producto.descripcion, producto.categoria)}
        image={producto.imagenes && producto.imagenes.length > 0 ? producto.imagenes[0] : undefined}
        type="product"
      />
      <JsonLd
        data={[
          buildBreadcrumbLd([
            { name: 'Inicio', path: '/' },
            ...(producto.categoriaSlug
              ? [{ name: producto.categoria, path: `/categorias/${producto.categoriaSlug}` }]
              : []),
            { name: producto.nombre, path: `/producto/${producto.slug || slug}` },
          ]),
          buildProductLd({
            nombre: producto.nombre,
            slug: producto.slug || slug || '',
            descripcion: producto.descripcion,
            imagenes: producto.imagenes,
            categoria: producto.categoria,
          }),
        ]}
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

      <div className="grid gap-7 md:grid-cols-2 md:items-start md:gap-11">
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-stone-200 bg-stone-50 p-6">
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
            <p className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-brand-600">
              {producto.categoria}{producto.subcategoria ? ` · ${producto.subcategoria}` : ''}
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-stone-900 font-outfit leading-tight mb-4">
              {producto.nombre}
            </h1>
            {producto.descripcion && (
              <p className="text-stone-600 leading-relaxed text-lg mb-6">
                {producto.descripcion}
              </p>
            )}
            {producto.tags && producto.tags.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {producto.tags.map((tag: any) => (
                  <Link
                    key={tag.id}
                    to={`/colecciones/${tag.slug}`}
                    className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-600 transition-colors hover:border-brand-400 hover:text-brand-800"
                  >
                    {tag.nombre}
                  </Link>
                ))}
              </div>
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
                            className="group relative z-0 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-stone-200 shadow-sm transition-transform hover:z-30 hover:scale-110 hover:shadow-md"
                            style={{ backgroundColor: c.hex }}
                            aria-label={c.nombre}
                          >
                            <span className="pointer-events-none absolute -bottom-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-stone-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-0 group-hover:opacity-100 group-hover:duration-150">
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

          <div className="max-w-sm">
            <a
              href={whatsappUrl(producto.nombre)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackWhatsApp('producto', {
                  item_name: producto.nombre,
                  item_slug: producto.slug || slug,
                })
              }
              className="inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-[#25D366] px-7 py-4 text-lg font-semibold text-white shadow-[0_8px_20px_rgba(37,211,102,0.28)] transition-colors hover:bg-[#1da851] active:translate-y-px"
            >
              <WhatsAppIcon size={24} />
              Consultar por WhatsApp
            </a>
            <p className="mt-2.5 text-center text-sm text-stone-500">
              Te respondemos precio y disponibilidad al instante
            </p>
          </div>
        </div>
      </div>

      {producto.relacionados && producto.relacionados.length > 0 && (
        <div className="pt-12 border-t border-stone-200 mt-12">
          <SectionHeading title="Te puede interesar" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
            {producto.relacionados.map((rel: any) => (
              <Link 
                key={rel.id}
                to={`/producto/${rel.slug}`} 
                className="group flex flex-col bg-white border border-stone-200 rounded-2xl overflow-hidden transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(43,36,34,0.08)]"
              >
                <div className="aspect-square bg-stone-50 p-4 flex items-center justify-center overflow-hidden">
                  {rel.imagenUrl ? (
                    <img src={rel.imagenUrl} alt={rel.nombre} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <span className="text-stone-300 text-sm">Sin imagen</span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-outfit font-semibold text-stone-900 line-clamp-2 text-sm group-hover:text-brand-700 transition-colors">
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
