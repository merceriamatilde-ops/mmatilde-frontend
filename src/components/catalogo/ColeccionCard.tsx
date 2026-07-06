import React from 'react';
import { Link } from 'react-router-dom';
import type { ColeccionCardData } from './types';

type ColeccionCardProps = {
  coleccion: ColeccionCardData;
};

export function ColeccionCard({ coleccion }: ColeccionCardProps) {
  const accent = coleccion.colorHex || '#8B4513';

  return (
    <Link
      to={`/colecciones/${coleccion.slug}`}
      className="group flex flex-col gap-2 rounded-2xl border border-stone-200 bg-white px-5 py-5 transition-all duration-150 hover:-translate-y-[3px] hover:border-brand-500 hover:shadow-[0_1px_2px_rgba(43,36,34,0.04),0_8px_24px_rgba(43,36,34,0.06)]"
    >
      <span
        className="inline-flex h-2 w-10 rounded-full"
        style={{ backgroundColor: accent }}
        aria-hidden
      />
      <h3 className="font-outfit text-[1.05rem] font-semibold text-stone-900 group-hover:text-brand-800">
        {coleccion.nombre}
      </h3>
      {coleccion.descripcion && (
        <p className="line-clamp-2 text-sm text-stone-500">{coleccion.descripcion}</p>
      )}
      {coleccion.count !== undefined && (
        <span className="text-xs text-stone-400">
          {coleccion.count} {coleccion.count === 1 ? 'producto' : 'productos'}
        </span>
      )}
    </Link>
  );
}
