export const SITE_ORIGIN = 'https://www.merceriamatilde.com';
export const API_ORIGIN = 'https://api.merceriamatilde.com';

export const DEFAULT_TITLE = 'Matilde Mercería | Mercería en Paraná';
export const DEFAULT_DESCRIPTION =
  'Mercería en Paraná, Entre Ríos. Hilos, lanas, agujas, botones y todo para costura, tejidos y manualidades. Local en Av. Francisco Ramírez 1883.';

/**
 * Bots que no ejecutan (bien) el SPA: redes + crawlers de búsqueda.
 * Les servimos HTML con title/description/canonical reales vía Edge.
 */
export const SOCIAL_BOT_RE =
  /facebookexternalhit|whatsapp|twitterbot|linkedinbot|telegrambot|slackbot|discordbot|pinterest|googlebot|google-inspectiontool|storebot-google|bingbot|yandex|duckduckbot|baiduspider|applebot|semrushbot|ahrefsbot/i;

export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-default.png`;

export function absoluteUrl(src?: string | null): string {
  if (!src) return DEFAULT_OG_IMAGE;
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  const path = src.startsWith('/') ? src : `/${src}`;
  return `${SITE_ORIGIN}${path}`;
}

export function canonicalForPath(pathname: string): string {
  const clean = pathname.split('?')[0].split('#')[0] || '/';
  return `${SITE_ORIGIN}${clean === '' ? '/' : clean}`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export type PageMeta = {
  title: string;
  description: string;
  image: string;
  url: string;
  type: 'website' | 'product';
  /** Texto extra visible en el HTML para bots (opcional). */
  bodyHtml?: string;
};

export function buildSocialHtml(meta: PageMeta): string {
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const image = escapeHtml(meta.image);
  const url = escapeHtml(meta.url);
  const type = meta.type;
  const extra = meta.bodyHtml || '';

  return `<!DOCTYPE html>
<html lang="es-AR">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${url}" />
  <meta property="og:locale" content="es_AR" />
  <meta property="og:type" content="${type}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:site_name" content="Matilde Mercería" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
</head>
<body>
  <header>
    <p><a href="${SITE_ORIGIN}/">Matilde Mercería</a> — mercería en Paraná, Entre Ríos</p>
    <h1>${title}</h1>
    <p>${description}</p>
  </header>
  <nav>
    <ul>
      <li><a href="${SITE_ORIGIN}/">Inicio</a></li>
      <li><a href="${SITE_ORIGIN}/categorias">Categorías</a></li>
      <li><a href="${SITE_ORIGIN}/contacto">Contacto</a></li>
      <li><a href="${SITE_ORIGIN}/buscar">Buscar</a></li>
    </ul>
  </nav>
  ${extra}
  <footer>
    <p>Av. Francisco Ramírez 1883, Paraná, Entre Ríos. Envíos en la ciudad y retiro en el local.</p>
    <p><a href="${url}">Ver esta página en el sitio</a></p>
  </footer>
</body>
</html>`;
}
