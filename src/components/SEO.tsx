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
  /** noindex para 404, etc. */
  noindex?: boolean;
  /** @deprecated */
  track?: boolean;
}

export function SEO({
  title,
  description,
  image,
  type = 'website',
  url,
  noindex = false,
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

  const robots = noindex ? 'noindex, follow' : 'index, follow';

  if (pageMeta) {
    return (
      <Helmet>
        <meta name="robots" content={robots} />
        <meta property="og:locale" content="es_AR" />
      </Helmet>
    );
  }

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="title" content={pageTitle} />
      <meta name="description" content={pageDescription} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:locale" content="es_AR" />
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
