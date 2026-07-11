export function isAdmin(rol?: string | null): boolean {
  return rol === 'ADMIN';
}

/** Rutas visibles para cualquier usuario autenticado del BO. */
export const VIEWER_NAV_HREFS = ['/', '/ventas', '/productos'] as const;

/** Rutas que requieren rol ADMIN (fuente única para Fase 3.5). */
export const ADMIN_ONLY_HREFS = [
  '/categorias',
  '/tags',
  '/colores',
  '/precios',
  '/sync',
  '/estadisticas',
  '/ia',
  '/configuracion',
  '/usuarios',
] as const;

export function canAccessHref(href: string, rol?: string | null): boolean {
  if (ADMIN_ONLY_HREFS.includes(href as (typeof ADMIN_ONLY_HREFS)[number])) {
    return isAdmin(rol);
  }
  return VIEWER_NAV_HREFS.includes(href as (typeof VIEWER_NAV_HREFS)[number]);
}
