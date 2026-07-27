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

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  url?: string;
  /** false en estados de loading: setea title sin mandar page_view a GA */
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
  const pageTitle = title ? `${title} | Matilde Mercería` : DEFAULT_TITLE;
  const pageDescription = description || DEFAULT_DESCRIPTION;
  const pageImage = absoluteUrl(image);
  const canonicalUrl =
    url ||
    (typeof window !== 'undefined'
      ? canonicalForPath(window.location.pathname)
      : SITE_ORIGIN);

  useEffect(() => {
    if (!shouldTrack || typeof window === 'undefined') return;
    trackPageView(window.location.pathname + window.location.search, pageTitle);
  }, [shouldTrack, pageTitle]);

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
