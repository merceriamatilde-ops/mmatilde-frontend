import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';

export function NotFoundPage() {
  return (
    <div className="container mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-20 text-center animate-fade-in">
      <SEO title="Página no encontrada" description="La página que estás buscando no existe." />

      <div className="font-outfit text-[clamp(4rem,18vw,7rem)] font-extrabold leading-none text-brand-400" aria-hidden>
        404
      </div>
      <h1 className="mb-3 mt-2 font-outfit text-[1.6rem] font-bold text-stone-900">
        Uy, esta página se nos perdió entre los ovillos
      </h1>
      <p className="mb-6 text-stone-600">
        No encontramos lo que buscabas. Quizás cambió de lugar o el enlace no es correcto. Volvé al
        inicio o mirá nuestras categorías.
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-full bg-brand-800 px-5 py-[11px] text-[15px] font-semibold text-white transition-colors hover:bg-brand-900 active:translate-y-px"
        >
          Volver al inicio
        </Link>
        <Link
          to="/categorias"
          className="inline-flex items-center justify-center rounded-full bg-stone-100 px-5 py-[11px] text-[15px] font-semibold text-brand-800 transition-colors hover:bg-stone-200 active:translate-y-px"
        >
          Ver categorías
        </Link>
      </div>
    </div>
  );
}
