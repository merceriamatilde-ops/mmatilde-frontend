import {
  API_ORIGIN,
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  absoluteUrl,
  buildSocialHtml,
  canonicalForPath,
  type PageMeta,
} from '../lib/siteMeta';

export const config = {
  runtime: 'edge',
};

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_ORIGIN}${path}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function resolveMeta(pathname: string): Promise<PageMeta> {
  const url = canonicalForPath(pathname);

  const producto = pathname.match(/^\/producto\/([^/]+)\/?$/);
  if (producto) {
    const slug = decodeURIComponent(producto[1]);
    const p = await fetchJson<{
      nombre: string;
      descripcion?: string | null;
      imagenes?: string[];
    }>(`/api/productos/${encodeURIComponent(slug)}`);

    if (p) {
      return {
        title: `${p.nombre} | Matilde Mercería`,
        description: p.descripcion?.trim() || `Consultá ${p.nombre} en Matilde Mercería, Paraná.`,
        image: absoluteUrl(p.imagenes?.[0]),
        url,
        type: 'product',
      };
    }
  }

  const categoria = pathname.match(/^\/categorias\/([^/]+)\/?$/);
  if (categoria) {
    const slug = decodeURIComponent(categoria[1]);
    const cat = await fetchJson<{ nombre: string; productos?: { imagenUrl?: string }[] }>(
      `/api/categorias/${encodeURIComponent(slug)}/productos`,
    );
    if (cat) {
      const img = cat.productos?.find((p) => p.imagenUrl)?.imagenUrl;
      return {
        title: `${cat.nombre} | Matilde Mercería`,
        description: `Explorá ${cat.nombre} en Matilde Mercería, Paraná.`,
        image: absoluteUrl(img),
        url,
        type: 'website',
      };
    }
  }

  const coleccion = pathname.match(/^\/colecciones\/([^/]+)\/?$/);
  if (coleccion) {
    const slug = decodeURIComponent(coleccion[1]);
    const col = await fetchJson<{
      nombre: string;
      descripcion?: string | null;
      productos?: { imagenUrl?: string }[];
    }>(`/api/catalogo/colecciones/${encodeURIComponent(slug)}`);
    if (col) {
      const img = col.productos?.find((p) => p.imagenUrl)?.imagenUrl;
      return {
        title: `${col.nombre} | Matilde Mercería`,
        description: col.descripcion?.trim() || `Colección ${col.nombre} en Matilde Mercería.`,
        image: absoluteUrl(img),
        url,
        type: 'website',
      };
    }
  }

  // Home / buscar / fallback: usamos el logo, no la foto de un producto.
  return {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    image: absoluteUrl(null),
    url,
    type: 'website',
  };
}

export default async function handler(request: Request): Promise<Response> {
  const path = new URL(request.url).searchParams.get('path') || '/';
  const meta = await resolveMeta(path);

  return new Response(buildSocialHtml(meta), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
