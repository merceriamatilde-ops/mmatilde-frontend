import { rewrite, next } from '@vercel/edge';
import { SOCIAL_BOT_RE } from './lib/siteMeta';

/** Rutas públicas indexables / compartibles (solo catálogo www). */
const SHAREABLE =
  /^\/$|^\/categorias(\/|$)|^\/colecciones(\/|$)|^\/producto(\/|$)|^\/buscar$|^\/contacto$/;

const INTERNAL_HOST_RE = /^(bo|ia)\./i;

const ROBOTS_INTERNAL = `User-agent: *
Disallow: /

`;

const NOINDEX_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Acceso interno</title>
</head>
<body>
  <p>Área interna. No indexable.</p>
</body>
</html>`;

function isInternalHost(request: Request): boolean {
  const host = (request.headers.get('host') ?? '').split(':')[0];
  return INTERNAL_HOST_RE.test(host);
}

export const config = {
  matcher: [
    '/',
    '/robots.txt',
    '/login',
    '/producto/:path*',
    '/categorias',
    '/categorias/:path*',
    '/colecciones/:path*',
    '/buscar',
    '/contacto',
    '/productos',
    '/ventas',
    '/banners',
    '/precios',
    '/estadisticas',
    '/colores',
    '/tags',
    '/sync',
    '/ia',
    '/configuracion',
    '/usuarios',
  ],
};

export default function middleware(request: Request) {
  const { pathname } = new URL(request.url);

  // BO / IA: nunca indexar, nunca servir social-preview del catálogo.
  if (isInternalHost(request)) {
    if (pathname === '/robots.txt') {
      return new Response(ROBOTS_INTERNAL, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Robots-Tag': 'noindex, nofollow',
          'Cache-Control': 'public, max-age=300',
        },
      });
    }

    const ua = request.headers.get('user-agent') ?? '';
    if (SOCIAL_BOT_RE.test(ua)) {
      return new Response(NOINDEX_HTML, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Robots-Tag': 'noindex, nofollow',
          'Cache-Control': 'public, max-age=300',
        },
      });
    }

    // Humanos: SPA + X-Robots-Tag vía vercel.json headers
    return next();
  }

  if (pathname === '/robots.txt') return next();

  const ua = request.headers.get('user-agent') ?? '';
  if (!SOCIAL_BOT_RE.test(ua)) return next();
  if (!SHAREABLE.test(pathname)) return next();

  const target = new URL('/api/social-preview', request.url);
  target.searchParams.set('path', pathname);
  return rewrite(target);
}
