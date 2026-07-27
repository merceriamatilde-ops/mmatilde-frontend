import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  SITE_ORIGIN,
  absoluteUrl,
  canonicalForPath,
} from '../../lib/siteMeta';

export type PageMeta = {
  title: string;
  description: string;
  image: string;
  type: string;
  url: string;
};

type PageMetaContextValue = {
  setMeta: (meta: Partial<PageMeta> & { title: string }) => void;
};

const PageMetaContext = createContext<PageMetaContextValue | null>(null);

const initialMeta = (): PageMeta => ({
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  image: absoluteUrl(),
  type: 'website',
  url: typeof window !== 'undefined' ? canonicalForPath(window.location.pathname) : SITE_ORIGIN,
});

/** Un solo <Helmet> para el catálogo: al navegar se conserva el title anterior hasta el SEO final. */
export function PageMetaProvider({ children }: { children: React.ReactNode }) {
  const [meta, setMetaState] = useState<PageMeta>(initialMeta);

  const setMeta = useCallback((next: Partial<PageMeta> & { title: string }) => {
    setMetaState((prev) => ({
      title: next.title,
      description: next.description ?? prev.description,
      image: next.image ?? prev.image,
      type: next.type ?? prev.type,
      url: next.url ?? prev.url,
    }));
  }, []);

  const value = useMemo(() => ({ setMeta }), [setMeta]);

  return (
    <PageMetaContext.Provider value={value}>
      <Helmet>
        <title>{meta.title}</title>
        <meta name="title" content={meta.title} />
        <meta name="description" content={meta.description} />
        <link rel="canonical" href={meta.url} />

        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:type" content={meta.type} />
        <meta property="og:url" content={meta.url} />
        <meta property="og:image" content={meta.image} />
        <meta property="og:site_name" content="Matilde Mercería" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />
        <meta name="twitter:image" content={meta.image} />
      </Helmet>
      {children}
    </PageMetaContext.Provider>
  );
}

export function usePageMeta() {
  return useContext(PageMetaContext);
}
