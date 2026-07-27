import React from 'react';
import { Link } from 'react-router-dom';
import { whatsappUrl } from '../../lib/utils';
import { trackWhatsApp } from '../../lib/analytics';
import { WhatsAppIcon } from '../ui/WhatsAppIcon';
import type { ProductoCardData } from './types';

type ProductCardProps = {
  producto: ProductoCardData;
  /** Origen del click WA: home | categoria | coleccion | busqueda | catalogo */
  whatsappSource?: string;
};

export function ProductCard({ producto, whatsappSource = 'catalogo' }: ProductCardProps) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-stone-200 bg-white transition-[box-shadow,border-color] duration-200 hover:border-stone-300 hover:shadow-[0_2px_12px_rgba(43,36,34,0.07)]">
      <Link
        to={`/producto/${producto.slug}`}
        className="relative block aspect-square shrink-0 overflow-hidden bg-stone-100"
      >
        {producto.imagenUrl ? (
          <img
            src={producto.imagenUrl}
            alt={producto.nombre}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
            loading="lazy"
          />
        ) : (
          <span className="flex h-full items-center justify-center px-2 text-center font-outfit text-xs text-brand-700/40">
            {producto.nombre}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-2 sm:p-2.5">
        {producto.categoria ? (
          <span className="truncate text-[10px] font-semibold uppercase tracking-wide text-brand-600">
            {producto.categoria}
          </span>
        ) : null}

        <Link to={`/producto/${producto.slug}`} className="block">
          <h3 className="line-clamp-2 font-outfit text-xs font-semibold leading-tight text-stone-900 transition-colors group-hover:text-brand-800 sm:text-[13px]">
            {producto.nombre}
          </h3>
        </Link>

        <a
          href={whatsappUrl(producto.nombre)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            trackWhatsApp(whatsappSource, {
              item_name: producto.nombre,
              item_slug: producto.slug,
            })
          }
          className="mt-auto inline-flex w-full items-center justify-center gap-1 rounded-md bg-[#25D366] px-2 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-[#1da851] sm:py-1.5 sm:text-xs"
        >
          <WhatsAppIcon size={12} />
          Consultar
        </a>
      </div>
    </article>
  );
}
