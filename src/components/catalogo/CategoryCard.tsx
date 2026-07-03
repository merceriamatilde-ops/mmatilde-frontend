import React from 'react';
import { Link } from 'react-router-dom';
import type { CategoriaCardData } from './types';

type CategoryCardProps = {
  categoria: CategoriaCardData;
};

export function CategoryCard({ categoria }: CategoryCardProps) {
  const icon = categoria.icono || categoria.icon || '📦';

  return (
    <Link
      to={`/categorias/${categoria.slug}`}
      className="flex flex-col items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-[18px] py-[22px] transition-all duration-150 hover:-translate-y-[3px] hover:border-brand-500 hover:shadow-[0_1px_2px_rgba(43,36,34,0.04),0_8px_24px_rgba(43,36,34,0.06)]"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-brand-100 text-2xl leading-none">
        {icon}
      </span>
      <span>
        <h3 className="font-outfit text-[1.05rem] font-semibold text-stone-900">{categoria.nombre}</h3>
        {categoria.count !== undefined && (
          <span className="text-sm text-stone-500">
            {categoria.count} {categoria.count === 1 ? 'producto' : 'productos'}
          </span>
        )}
      </span>
    </Link>
  );
}
