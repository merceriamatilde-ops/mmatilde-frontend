import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Spinner } from '../../components/ui/Spinner';
import { SEO } from '../../components/SEO';
import { CategoryCard, SectionHeading, type CategoriaCardData } from '../../components/catalogo';

export function CategoriasPage() {
  const [categorias, setCategorias] = useState<CategoriaCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getCategorias()
      .then((res) => {
        setCategorias(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="container mx-auto max-w-7xl animate-fade-in px-4 py-8">
      <SEO title="Categorías de mercería en Paraná" description="Explorá todas las categorías del catálogo de Matilde Mercería en Paraná: hilos, lanas, agujas, botones y más." />
      <SectionHeading title="Todas las categorías" subtitle="Catálogo de mercería en Paraná" />

      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Spinner size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
          {categorias.map((cat) => (
            <CategoryCard key={cat.slug} categoria={cat} />
          ))}
          {categorias.length === 0 && (
            <p className="col-span-full py-12 text-center text-stone-500">
              No hay categorías con productos disponibles.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
