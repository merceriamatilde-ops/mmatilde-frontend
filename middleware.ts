import { rewrite, next } from '@vercel/edge';
import { SOCIAL_BOT_RE } from './lib/siteMeta';

/** Rutas públicas indexables / compartibles. */
const SHAREABLE =
  /^\/$|^\/categorias(\/|$)|^\/colecciones(\/|$)|^\/producto(\/|$)|^\/buscar$|^\/contacto$/;

export const config = {
  matcher: [
    '/',
    '/producto/:path*',
    '/categorias',
    '/categorias/:path*',
    '/colecciones/:path*',
    '/buscar',
    '/contacto',
  ],
};

export default function middleware(request: Request) {
  const ua = request.headers.get('user-agent') ?? '';
  if (!SOCIAL_BOT_RE.test(ua)) return next();

  const { pathname } = new URL(request.url);
  if (!SHAREABLE.test(pathname)) return next();

  const target = new URL('/api/social-preview', request.url);
  target.searchParams.set('path', pathname);
  return rewrite(target);
}
