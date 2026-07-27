import React, { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { api } from '../../api/client';
import { Spinner } from '../../components/ui/Spinner';
import { SEO } from '../../components/SEO';
import { NotFoundPage } from './NotFoundPage';
import { ProductCard, ProductGrid } from '../../components/catalogo';

export function ColeccionDetallePage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoriaSlug = searchParams.get('categoria');

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api
      .getColeccion(slug, categoriaSlug || undefined)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(true);
        setLoading(false);
      });
  }, [slug, categoriaSlug]);

  if (loading) {
    return (
      <>
        <SEO track={false} />
        <div className="flex h-[50vh] items-center justify-center">
          <Spinner size={40} />
        </div>
      </>
    );
  }

  if (error || !data) return <NotFoundPage />;

  const productos = data.productos || [];
  const categorias = data.categorias || [];
  const accent = data.colorHex || '#8B4513';
  const currentCat = categorias.find((c: any) => c.slug === categoriaSlug);

  return (
    <div className="container mx-auto max-w-7xl animate-fade-in space-y-7 px-4 py-6">
      <SEO
        title={currentCat ? `${data.nombre} · ${currentCat.nombre}` : data.nombre}
        description={data.descripcion || `Productos de ${data.nombre} en Matilde Mercería.`}
        image={productos.find((p: any) => p.imagenUrl)?.imagenUrl}
      />

      <div>
        <nav className="mb-4 flex items-center space-x-2 text-sm text-stone-500">
          <Link to="/" className="text-brand-800 transition-colors">
            Inicio
          </Link>
          <ChevronRight size={16} />
          <span className="truncate font-medium text-stone-900">{data.nombre}</span>
        </nav>

        <span className="mb-3 inline-flex h-2 w-12 rounded-full" style={{ backgroundColor: accent }} />
        <h1 className="font-outfit text-[clamp(1.6rem,5vw,2.2rem)] font-bold tracking-tight text-brand-800">
          {data.nombre}
        </h1>
        {data.descripcion && <p className="mt-2 max-w-2xl text-stone-600">{data.descripcion}</p>}
        <p className="mt-2 text-stone-500">
          {productos.length} {productos.length === 1 ? 'producto' : 'productos'}
          {currentCat ? ` en ${currentCat.nombre}` : ''}
        </p>
      </div>

      {categorias.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSearchParams({})}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              !categoriaSlug
                ? 'border-brand-800 bg-brand-800 text-white'
                : 'border-stone-200 bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
            }`}
          >
            Todas
          </button>
          {categorias.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => setSearchParams({ categoria: cat.slug })}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                categoriaSlug === cat.slug
                  ? 'border-brand-800 bg-brand-800 text-white'
                  : 'border-stone-200 bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
              }`}
            >
              {cat.nombre}
              <span className="ml-1 opacity-70">({cat.count})</span>
            </button>
          ))}
        </div>
      )}

      {productos.length === 0 ? (
        <p className="text-stone-500">No hay productos en esta colección{categoriaSlug ? ' para esa categoría' : ''}.</p>
      ) : (
        <ProductGrid>
          {productos.map((p: any) => (
            <ProductCard key={p.id} producto={p} whatsappSource="coleccion" />
          ))}
        </ProductGrid>
      )}
    </div>
  );
}
