import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { SEO } from '../../components/SEO';

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center animate-fade-in">
      <SEO title="Página no encontrada" description="La página que estás buscando no existe." />
      
      <h1 className="text-8xl font-black text-brand-100 font-outfit mb-4">404</h1>
      <h2 className="text-2xl md:text-3xl font-bold text-stone-900 mb-4 font-outfit">
        Ups... esta página no existe
      </h2>
      <p className="text-stone-500 mb-8 max-w-md">
        Parece que el enlace está roto o la página fue movida a otra dirección.
      </p>
      
      <Link 
        to="/" 
        className="inline-flex items-center justify-center rounded-md bg-brand-800 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-900 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-800 focus:ring-offset-2"
      >
        <Home className="w-4 h-4 mr-2" />
        Volver al inicio
      </Link>
    </div>
  );
}
