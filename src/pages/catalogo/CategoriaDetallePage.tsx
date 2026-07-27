import React, { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { api } from '../../api/client';
import { Spinner } from '../../components/ui/Spinner';

import { SEO } from '../../components/SEO';
import { JsonLd } from '../../components/JsonLd';
import { NotFoundPage } from './NotFoundPage';
import { ProductCard, ProductGrid } from '../../components/catalogo';
import {
  buildBreadcrumbLd,
  categorySeoDescription,
  categorySeoTitle,
} from '../../lib/localSeo';

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

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Spinner size={40} />
      </div>
    );
  }
  if (error || !data) return <NotFoundPage />;

  const categoriaName = data.nombre;
  const productos = data.productos || [];
  const subcategorias = data.subcategorias || [];
  const currentSub = subcategorias.find((s: any) => s.slug === subSlug);
  const banner: string | null = data.imagen || null;
  const h1 = currentSub ? currentSub.nombre : categoriaName;
  const seoTitle = categorySeoTitle(categoriaName, currentSub?.nombre);

  const crumbs = [
    { name: 'Inicio', path: '/' },
    { name: 'Categorías', path: '/categorias' },
    { name: categoriaName, path: `/categorias/${slug}` },
  ];
  if (currentSub) {
    crumbs.push({
      name: currentSub.nombre,
      path: `/categorias/${slug}?sub=${currentSub.slug}`,
    });
  }

  return (
    <div className="container mx-auto max-w-7xl animate-fade-in space-y-4 px-4 pt-3 pb-6 md:space-y-7 md:py-6">
      <SEO
        title={seoTitle}
        description={categorySeoDescription(categoriaName, currentSub?.nombre)}
        image={banner || productos.find((p: any) => p.imagenUrl)?.imagenUrl}
      />
      <JsonLd data={buildBreadcrumbLd(crumbs)} />

      <nav className="flex items-center space-x-2 text-sm text-stone-500">
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
            <span className="text-stone-900 font-medium truncate">{currentSub.nombre}</span>
          </>
        ) : (
          <span className="text-stone-900 font-medium truncate">{categoriaName}</span>
        )}
      </nav>

      {banner ? (
        <div className="relative overflow-hidden rounded-2xl bg-brand-900">
          <img
            src={banner}
            alt={`${h1} en Paraná — Matilde Mercería`}
            className="h-40 w-full object-cover opacity-80 sm:h-52 md:h-64"
          />
          <div className="absolute inset-0 bg-brand-950/40" />
          <div className="absolute inset-x-0 bottom-0 p-5 md:p-7">
            <h1 className="font-outfit text-[clamp(1.6rem,5vw,2.4rem)] font-bold tracking-tight text-white drop-shadow">
              {h1}
            </h1>
            <p className="mt-1 text-sm text-white/85">
              {productos.length} {productos.length === 1 ? 'producto' : 'productos'} en Paraná
            </p>
          </div>
        </div>
      ) : (
        <div>
          <h1 className="font-outfit text-[clamp(1.6rem,5vw,2.4rem)] font-bold tracking-tight text-brand-800">
            {h1}
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            {productos.length} {productos.length === 1 ? 'producto' : 'productos'} · Matilde Mercería, Paraná
          </p>
        </div>
      )}

      {subcategorias.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSearchParams({})}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              !subSlug
                ? 'border-brand-800 bg-brand-800 text-white'
                : 'border-stone-200 bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
            }`}
          >
            Todas
          </button>
          {subcategorias.map((sub: any) => (
            <button
              key={sub.id}
              onClick={() => setSearchParams({ sub: sub.slug })}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                subSlug === sub.slug
                  ? 'border-brand-800 bg-brand-800 text-white'
                  : 'border-stone-200 bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
              }`}
            >
              {sub.nombre}
            </button>
          ))}
        </div>
      )}

      <ProductGrid>
        {productos.map((p: any) => (
          <ProductCard key={p.id} producto={p} whatsappSource="categoria" />
        ))}
        {productos.length === 0 && (
          <p className="col-span-full py-12 text-center text-stone-500">No hay productos en esta categoría.</p>
        )}
      </ProductGrid>
    </div>
  );
}
