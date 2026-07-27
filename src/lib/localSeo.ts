import { SITE_ORIGIN } from '../../lib/siteMeta';

export type SiteConfig = Record<string, string>;

type HorarioGrupo = { dias?: string[]; turnos?: { apertura: string; cierre: string }[] };

const DAY_MAP: Record<string, string> = {
  Lunes: 'Monday',
  Martes: 'Tuesday',
  Miércoles: 'Wednesday',
  Jueves: 'Thursday',
  Viernes: 'Friday',
  Sábado: 'Saturday',
  Domingo: 'Sunday',
};

function streetOnly(direccion: string): string {
  return direccion.replace(/,?\s*Paraná\b.*/i, '').trim() || direccion;
}

function openingHoursFromConfig(horariosJson?: string) {
  if (!horariosJson) return undefined;
  try {
    const grupos: HorarioGrupo[] = JSON.parse(horariosJson);
    if (!Array.isArray(grupos)) return undefined;
    const specs: {
      '@type': 'OpeningHoursSpecification';
      dayOfWeek: string[];
      opens: string;
      closes: string;
    }[] = [];

    for (const g of grupos) {
      const days = (g.dias ?? []).map((d) => DAY_MAP[d]).filter(Boolean);
      if (!days.length) continue;
      for (const t of g.turnos ?? []) {
        if (!t.apertura || !t.cierre) continue;
        specs.push({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: days,
          opens: t.apertura,
          closes: t.cierre,
        });
      }
    }
    return specs.length ? specs : undefined;
  } catch {
    return undefined;
  }
}

/** NAP + LocalBusiness para Google (home y contacto). */
export function buildLocalBusinessLd(config: SiteConfig = {}) {
  const name = config.nombre_negocio || 'Matilde Mercería';
  const direccion = config.direccion || 'Av. Francisco Ramírez 1883, Paraná, Entre Ríos';
  const phone = config.whatsapp || '+5493435190082';
  const sameAs = [config.instagram_url, config.facebook_url, config.google_review_url].filter(
    Boolean,
  ) as string[];

  return {
    '@context': 'https://schema.org',
    '@type': ['Store', 'LocalBusiness'],
    '@id': `${SITE_ORIGIN}/#localbusiness`,
    name,
    alternateName: 'Mercería Matilde',
    description:
      config.slogan ||
      'Mercería en Paraná, Entre Ríos. Hilos, lanas, agujas, botones y todo para costura, tejidos y manualidades.',
    url: SITE_ORIGIN,
    image: `${SITE_ORIGIN}/og-default.png`,
    telephone: phone,
    email: config.email || undefined,
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: streetOnly(direccion),
      addressLocality: 'Paraná',
      addressRegion: 'Entre Ríos',
      postalCode: config.codigo_postal || '3100',
      addressCountry: 'AR',
    },
    geo: config.latitud && config.longitud
      ? {
          '@type': 'GeoCoordinates',
          latitude: Number(config.latitud),
          longitude: Number(config.longitud),
        }
      : undefined,
    openingHoursSpecification: openingHoursFromConfig(config.horarios),
    sameAs: sameAs.length ? sameAs : undefined,
    areaServed: {
      '@type': 'City',
      name: 'Paraná',
    },
  };
}

export function buildWebSiteLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_ORIGIN}/#website`,
    name: 'Matilde Mercería',
    url: SITE_ORIGIN,
    inLanguage: 'es-AR',
    publisher: { '@id': `${SITE_ORIGIN}/#localbusiness` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_ORIGIN}/buscar?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildBreadcrumbLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.path.startsWith('http') ? item.path : `${SITE_ORIGIN}${item.path}`,
    })),
  };
}

export function buildProductLd(producto: {
  nombre: string;
  slug: string;
  descripcion?: string | null;
  imagenes?: string[];
  categoria?: string;
}) {
  const image = producto.imagenes?.[0];
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: producto.nombre,
    description:
      producto.descripcion?.trim() ||
      `${producto.nombre} en Matilde Mercería, mercería en Paraná.`,
    image: image ? (image.startsWith('http') ? image : `${SITE_ORIGIN}${image}`) : undefined,
    sku: producto.slug,
    brand: {
      '@type': 'Brand',
      name: 'Matilde Mercería',
    },
    category: producto.categoria,
    url: `${SITE_ORIGIN}/producto/${producto.slug}`,
  };
}

export function categorySeoTitle(nombre: string, sub?: string) {
  const base = sub ? `${nombre} — ${sub}` : nombre;
  return `${base} en Paraná`;
}

export function categorySeoDescription(nombre: string, sub?: string) {
  const focus = sub ? `${sub} de ${nombre}` : nombre;
  return `Comprá ${focus} en Matilde Mercería, tu mercería en Paraná. Retiro en el local o envíos en la ciudad.`;
}

export function productSeoDescription(nombre: string, descripcion?: string | null, categoria?: string) {
  if (descripcion?.trim()) {
    const short = descripcion.trim().slice(0, 120);
    return `${short}${descripcion.length > 120 ? '…' : ''} | Matilde Mercería, Paraná.`;
  }
  const cat = categoria ? ` (${categoria})` : '';
  return `${nombre}${cat} en Matilde Mercería — mercería en Paraná. Consultá precio y stock por WhatsApp.`;
}
