import { Link } from 'react-router-dom';
import type { CategoriaCardData } from './types';
import { trackSelectItem } from '../../lib/analytics';

type CategoryCardProps = {
  categoria: CategoriaCardData;
};

export function CategoryCard({ categoria }: CategoryCardProps) {
  const icon = categoria.icono || categoria.icon || '📦';
  const imagen = categoria.imagen;

  return (
    <Link
      to={`/categorias/${categoria.slug}`}
      onClick={() => trackSelectItem('categoria', { nombre: categoria.nombre, slug: categoria.slug })}
      className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white transition-colors duration-150 hover:border-brand-500"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-brand-50">
        {imagen ? (
          <img
            src={imagen}
            alt={categoria.nombre}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl leading-none">
            {icon}
          </div>
        )}
      </div>
      <div className="flex flex-col px-[18px] py-[14px]">
        <h3 className="font-outfit text-[1.05rem] font-semibold text-stone-900">{categoria.nombre}</h3>
        {categoria.count !== undefined && (
          <span className="text-sm text-stone-500">
            {categoria.count} {categoria.count === 1 ? 'producto' : 'productos'}
          </span>
        )}
      </div>
    </Link>
  );
}
