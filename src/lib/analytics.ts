import ReactGA from 'react-ga4';

type Params = Record<string, string | number | boolean | undefined | null>;

function clean(params?: Params): Record<string, string | number | boolean> | undefined {
  if (!params) return undefined;
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    out[k] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

/** Evento GA4 nativo. No-op si no hay Measurement ID. */
export function track(event: string, params?: Params) {
  if (!import.meta.env.VITE_GA_MEASUREMENT_ID) return;
  ReactGA.event(event, clean(params));
}

let lastPageViewKey = '';
let lastPageViewPath = '';

export function trackPageView(path: string, title?: string) {
  const pageTitle = title ?? (typeof document !== 'undefined' ? document.title : undefined);
  // Dedup: mismo path+title en StrictMode / remounts del SEO
  const key = `${path}\0${pageTitle ?? ''}`;
  if (key === lastPageViewKey) return;
  lastPageViewKey = key;
  lastPageViewPath = path;

  track('page_view', {
    page_path: path,
    page_location: typeof window !== 'undefined' ? window.location.href : undefined,
    page_title: pageTitle,
  });
}

/** Fallback para rutas sin <SEO /> (BO, etc.). No pisa un hit ya mandado por SEO. */
export function trackPageViewFallback(path: string) {
  if (lastPageViewPath === path) return;
  trackPageView(path);
}

export function trackWhatsApp(source: string, extra?: Params) {
  track('whatsapp_click', { source, ...extra });
}

export function trackSocial(network: string, source: string) {
  track('social_click', { network, source });
}

export function trackBannerClick(titulo: string, bannerId?: number) {
  track('banner_click', { banner_title: titulo, banner_id: bannerId });
}

export function trackSearch(query: string, resultsCount: number) {
  track('search', { search_term: query, results_count: resultsCount });
}

export function trackViewItem(producto: { id?: number; nombre: string; slug?: string; categoria?: string }) {
  track('view_item', {
    item_id: producto.id,
    item_name: producto.nombre,
    item_slug: producto.slug,
    item_category: producto.categoria,
  });
}

export function trackSelectItem(kind: 'categoria' | 'coleccion', item: { nombre: string; slug: string }) {
  track('select_item', {
    item_list_name: kind,
    item_name: item.nombre,
    item_slug: item.slug,
  });
}

export function trackIA(action: string, extra?: Params) {
  track('ia_interaction', { action, ...extra });
}

export function initAnalytics() {
  const id = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!id) return;
  ReactGA.initialize(id, {
    gtagOptions: {
      send_page_view: false, // lo mandamos nosotros en el SPA
    },
  });
}
