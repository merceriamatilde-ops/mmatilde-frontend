import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { Spinner } from '../../components/ui/Spinner';

export function CategoriasPage() {
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCategorias().then(res => {
      setCategorias(res);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex h-[50vh] items-center justify-center"><Spinner size={40} /></div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="border-b border-stone-200 pb-4">
        <h1 className="text-3xl font-bold tracking-tight font-outfit text-stone-900">Todas las Categorías</h1>
        <p className="text-stone-500 mt-2">Explorá nuestro catálogo organizado por categorías.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {categorias.map((cat) => (
          <Link
            key={cat.slug}
            to={`/categorias/${cat.slug}`}
            className="group flex flex-col items-center rounded-xl border border-stone-200 bg-white p-6 text-center transition-all hover:border-amber-500 hover:shadow-md"
          >
            <div className="mb-4 text-4xl transition-transform group-hover:scale-110">
              {cat.icono || '📦'}
            </div>
            <h2 className="font-semibold text-stone-900">{cat.nombre}</h2>
            <p className="mt-1 text-sm text-stone-500">
              {cat.count} {cat.count === 1 ? 'producto' : 'productos'}
            </p>
          </Link>
        ))}
        {categorias.length === 0 && (
          <p className="col-span-full text-center text-stone-500 py-12">No hay categorías con productos disponibles.</p>
        )}
      </div>
    </div>
  );
}
