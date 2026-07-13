import React from 'react';
import { Helmet } from 'react-helmet-async';
import {
  DEFAULT_DESCRIPTION,
  SITE_ORIGIN,
  absoluteUrl,
  canonicalForPath,
} from '../../lib/siteMeta';

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
  url,
}: SEOProps) {
  const siteName = 'Matilde Mercería | Paraná';
  const pageTitle = title ? `${title} | Matilde Mercería` : siteName;
  const pageDescription = description || DEFAULT_DESCRIPTION;
  const pageImage = absoluteUrl(image);
  const canonicalUrl =
    url ||
    (typeof window !== 'undefined'
      ? canonicalForPath(window.location.pathname)
      : SITE_ORIGIN);

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="title" content={pageTitle} />
      <meta name="description" content={pageDescription} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={pageImage} />
      <meta property="og:site_name" content="Matilde Mercería" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={pageImage} />
    </Helmet>
  );
}
