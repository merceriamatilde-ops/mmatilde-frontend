import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  url?: string;
}

export function SEO({
  title,
  description,
  image,
  type = 'website',
  url
}: SEOProps) {
  const siteName = 'Matilde Mercería | Paraná';
  const defaultDescription = 'Tu mercería de confianza en Paraná. Todo lo que necesitás para tus proyectos de costura, manualidades y tejidos. Hilos, lanas, agujas y más.';
  const defaultImage = '/logo-merceria.svg'; // Fallback until a specific social image is provided

  // Si nos pasan un title, le concatenamos el nombre del sitio, sino usamos el default.
  const pageTitle = title ? `${title} | Matilde Mercería` : siteName;
  const pageDescription = description || defaultDescription;
  const pageImage = image || defaultImage;

  // URL canónica: siempre www + path, sin query/hash, para deduplicar apex/www y variantes.
  const SITE_ORIGIN = 'https://www.merceriamatilde.com';
  const canonicalUrl =
    url ||
    (typeof window !== 'undefined' ? `${SITE_ORIGIN}${window.location.pathname}` : SITE_ORIGIN);

  return (
    <Helmet>
      {/* Título de la pestaña y meta genéricos */}
      <title>{pageTitle}</title>
      <meta name="title" content={pageTitle} />
      <meta name="description" content={pageDescription} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph (WhatsApp, Facebook, LinkedIn) */}
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={pageImage} />
      <meta property="og:site_name" content="Matilde Mercería" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={pageImage} />
    </Helmet>
  );
}
