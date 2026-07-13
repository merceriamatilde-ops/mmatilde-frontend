import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Spinner } from '../../components/ui/Spinner';
import { SEO } from '../../components/SEO';
import {
  HomeIntro,
  SectionHeading,
  CategoryCard,
  ColeccionCard,
  ProductCard,
  ProductGrid,
  type CategoriaCardData,
  type ColeccionCardData,
  type ProductoCardData,
} from '../../components/catalogo';

export function HomePage() {
  const [data, setData] = useState<{
    categorias: CategoriaCardData[];
    productosRecientes: ProductoCardData[];
    colecciones: ColeccionCardData[];
    maxMobile: number;
    maxDesktop: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    api
      .getHomeData()
      .then((res) => {
        if (cancelled) return;
        setData({
          categorias: res.categorias || [],
          productosRecientes: res.productosRecientes || [],
          colecciones: res.colecciones || [],
          maxMobile: res.maxCategoriasMobile || 4,
          maxDesktop: res.maxCategoriasDesktop || 6,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Spinner size={40} />
      </div>
    );
  }

  // Nunca renderizamos un error "pelado": mantenemos contenido real (SEO + intro + accesos)
  // para que los buscadores no lo interpreten como soft 404 ante un fallo transitorio de red.
  if (failed || !data) {
    return (
      <div className="animate-fade-in">
        <SEO />
        <section className="py-16">
          <div className="container mx-auto max-w-2xl px-4 text-center">
            <h1 className="font-outfit text-2xl font-bold text-stone-900">Matilde Mercería</h1>
            <p className="mt-3 text-stone-600">
              Estamos actualizando el catálogo. Volvé a intentar en unos segundos o mirá las
              categorías.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a
                href="/categorias"
                className="inline-flex items-center justify-center rounded-full bg-brand-800 px-5 py-[11px] text-[15px] font-semibold text-white transition-colors hover:bg-brand-900"
              >
                Ver categorías
              </a>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center rounded-full bg-stone-100 px-5 py-[11px] text-[15px] font-semibold text-brand-800 transition-colors hover:bg-stone-200"
              >
                Reintentar
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <SEO />

      <HomeIntro />

      <section className="py-11">
        <div className="container mx-auto max-w-7xl px-4">
          <SectionHeading
            title="Categorías destacadas"
            subtitle="Encontrá lo que buscás más rápido"
            action={{ label: 'Ver todas', to: '/categorias' }}
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {data.categorias.slice(0, data.maxDesktop).map((cat, i) => (
              <div key={cat.slug} className={i >= data.maxMobile ? 'hidden md:block' : ''}>
                <CategoryCard categoria={cat} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {data.colecciones.length > 0 && (
        <section className="py-11">
          <div className="container mx-auto max-w-7xl px-4">
            <SectionHeading
              title="Descubrí por interés"
              subtitle="Colecciones pensadas para lo que querés hacer"
            />
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {data.colecciones.map((col) => (
                <ColeccionCard key={col.slug} coleccion={col} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Banda gris full-bleed */}
      <section className="border-y border-stone-200 bg-stone-50 py-11">
        <div className="container mx-auto max-w-7xl px-4">
          <SectionHeading title="Nuevos ingresos" subtitle="Lo último que sumamos al local" />
          {data.productosRecientes.length === 0 ? (
            <p className="text-stone-500">No hay productos visibles por el momento.</p>
          ) : (
            <ProductGrid>
              {data.productosRecientes.map((p) => (
                <ProductCard key={p.id} producto={p} whatsappAction="Consultar_Home" />
              ))}
            </ProductGrid>
          )}
        </div>
      </section>
    </div>
  );
}
