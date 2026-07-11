export type ModuloKey =
  | 'dashboard'
  | 'ventas'
  | 'productos'
  | 'categorias'
  | 'tags'
  | 'colores'
  | 'precios'
  | 'sync'
  | 'estadisticas'
  | 'ia'
  | 'configuracion'
  | 'usuarios';

export type ModuloPermiso = {
  habilitado: boolean;
  roles: string[];
};

export type PermisosModulosConfig = {
  modulos: Record<string, ModuloPermiso>;
};

export type ModuloDef = {
  key: string;
  label: string;
  bloqueado: boolean;
};

export const ROLES_BO = ['ADMIN', 'VIEWER'] as const;

export const MODULOS_NAV: { key: ModuloKey; href: string; label: string }[] = [
  { key: 'dashboard', href: '/', label: 'Dashboard' },
  { key: 'ventas', href: '/ventas', label: 'Ventas' },
  { key: 'productos', href: '/productos', label: 'Productos' },
  { key: 'categorias', href: '/categorias', label: 'Categorías' },
  { key: 'tags', href: '/tags', label: 'Tags' },
  { key: 'colores', href: '/colores', label: 'Colores' },
  { key: 'precios', href: '/precios', label: 'Precios' },
  { key: 'sync', href: '/sync', label: 'Sincronización Makor' },
  { key: 'estadisticas', href: '/estadisticas', label: 'Estadísticas' },
  { key: 'ia', href: '/ia', label: 'Asistente IA' },
  { key: 'configuracion', href: '/configuracion', label: 'Configuración' },
  { key: 'usuarios', href: '/usuarios', label: 'Usuarios' },
];

const HREF_TO_MODULO = Object.fromEntries(MODULOS_NAV.map((m) => [m.href, m.key])) as Record<string, ModuloKey>;

/** Defaults mientras carga la config del servidor (mismo comportamiento pre-3.5). */
const LEGACY_VIEWER: ModuloKey[] = ['dashboard', 'ventas', 'productos'];

export function isAdmin(rol?: string | null): boolean {
  return rol === 'ADMIN';
}

export function hrefToModulo(href: string): ModuloKey | null {
  return HREF_TO_MODULO[href] ?? null;
}

export function canAccessModulo(
  key: ModuloKey,
  rol?: string | null,
  permisos?: PermisosModulosConfig | null
): boolean {
  if (isAdmin(rol)) return true;
  if (!rol) return false;

  if (!permisos?.modulos) {
    return LEGACY_VIEWER.includes(key);
  }

  const mod = permisos.modulos[key];
  if (!mod?.habilitado) return false;
  return mod.roles.some((r) => r.toUpperCase() === rol.toUpperCase());
}

export function canAccessHref(
  href: string,
  rol?: string | null,
  permisos?: PermisosModulosConfig | null
): boolean {
  const key = hrefToModulo(href);
  if (!key) return false;
  return canAccessModulo(key, rol, permisos);
}

/** @deprecated usar canAccessModulo */
export const VIEWER_NAV_HREFS = ['/', '/ventas', '/productos'] as const;

/** @deprecated usar MODULOS_NAV + canAccessHref */
export const ADMIN_ONLY_HREFS = MODULOS_NAV.filter((m) => !VIEWER_NAV_HREFS.includes(m.href as any)).map(
  (m) => m.href
) as readonly string[];
