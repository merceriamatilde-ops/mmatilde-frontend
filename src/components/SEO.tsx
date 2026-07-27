import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  SITE_ORIGIN,
  absoluteUrl,
  canonicalForPath,
} from '../../lib/siteMeta';
import { trackPageView } from '../lib/analytics';
import { usePageMeta } from './PageMetaProvider';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  url?: string;
  /** @deprecated Ya no hace falta: no montes <SEO /> en loadings */
  track?: boolean;
}

export function SEO({
  title,
  description,
  image,
  type = 'website',
  url,
  track: shouldTrack = true,
}: SEOProps) {
  const pageMeta = usePageMeta();
  const setMeta = pageMeta?.setMeta;
  const pageTitle = title ? `${title} | Matilde Mercería` : DEFAULT_TITLE;
  const pageDescription = description || DEFAULT_DESCRIPTION;
  const pageImage = absoluteUrl(image);
  const canonicalUrl =
    url ||
    (typeof window !== 'undefined'
      ? canonicalForPath(window.location.pathname)
      : SITE_ORIGIN);

  useEffect(() => {
    if (!shouldTrack) return;

    setMeta?.({
      title: pageTitle,
      description: pageDescription,
      image: pageImage,
      type,
      url: canonicalUrl,
    });

    if (typeof window !== 'undefined') {
      trackPageView(window.location.pathname + window.location.search, pageTitle);
    }
  }, [shouldTrack, pageTitle, pageDescription, pageImage, type, canonicalUrl, setMeta]);

  // Fuera del catálogo (sin provider): Helmet local. Adentro: el provider ya pinta el head.
  if (pageMeta) return null;

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
