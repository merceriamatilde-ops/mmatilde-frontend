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
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getHomeData()
      .then((res) => {
        setData({
          categorias: res.categorias || [],
          productosRecientes: res.productosRecientes || [],
          colecciones: res.colecciones || [],
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Spinner size={40} />
      </div>
    );
  }

  if (!data) {
    return <div className="py-20 text-center text-red-500">Error al cargar datos del catálogo.</div>;
  }

  return (
    <div className="animate-fade-in">
      <SEO />

      {/* Banda gris full-bleed */}
      <HomeIntro categorias={data.categorias} />

      <section className="py-11">
        <div className="container mx-auto max-w-7xl px-4">
          <SectionHeading
            title="Categorías destacadas"
            subtitle="Encontrá lo que buscás más rápido"
            action={{ label: 'Ver todas', to: '/categorias' }}
          />
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
            {data.categorias.map((cat) => (
              <CategoryCard key={cat.slug} categoria={cat} />
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
