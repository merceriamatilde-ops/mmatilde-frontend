export const SITE_ORIGIN = 'https://www.merceriamatilde.com';
export const API_ORIGIN = 'https://api.merceriamatilde.com';

export const DEFAULT_TITLE = 'Matilde Mercería | Paraná, Entre Ríos';
export const DEFAULT_DESCRIPTION =
  'Tu mercería de confianza en Paraná. Todo lo que necesitás para tus proyectos de costura, manualidades y tejidos. Hilos, lanas, agujas y más.';

/** WhatsApp/Facebook/LinkedIn/Twitter crawlers — no ejecutan JS. */
export const SOCIAL_BOT_RE =
  /facebookexternalhit|whatsapp|twitterbot|linkedinbot|telegrambot|slackbot|discordbot|pinterest/i;

export function absoluteUrl(src?: string | null): string {
  if (!src) return `${SITE_ORIGIN}/logo-merceria.svg`;
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
};

export function buildSocialHtml(meta: PageMeta): string {
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const image = escapeHtml(meta.image);
  const url = escapeHtml(meta.url);
  const type = meta.type;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <link rel="canonical" href="${url}" />
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
  <p><a href="${url}">${title}</a></p>
</body>
</html>`;
}
