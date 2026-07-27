import {
  API_ORIGIN,
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  absoluteUrl,
  buildSocialHtml,
  canonicalForPath,
  escapeHtml,
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

function productListHtml(
  items: { nombre?: string; name?: string; slug?: string }[],
  basePath: string,
): string {
  if (!items.length) return '';
  const lis = items
    .slice(0, 40)
    .map((p) => {
      const name = escapeHtml(p.nombre || p.name || '');
      const slug = p.slug ? escapeHtml(p.slug) : '';
      const href = slug ? `${basePath}/${slug}` : '#';
      return `<li><a href="${href}">${name}</a></li>`;
    })
    .join('');
  return `<section><h2>Productos</h2><ul>${lis}</ul></section>`;
}

async function resolveMeta(pathname: string): Promise<PageMeta> {
  const url = canonicalForPath(pathname);

  if (pathname === '/' || pathname === '') {
    return {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      image: absoluteUrl(null),
      url,
      type: 'website',
      bodyHtml: `<section><h2>Mercería en Paraná</h2><p>Matilde Mercería — Av. Francisco Ramírez 1883, Paraná, Entre Ríos. Hilos, lanas, agujas, botones y materiales para costura y manualidades.</p></section>`,
    };
  }

  if (pathname === '/contacto') {
    return {
      title: 'Contacto — Mercería en Paraná | Matilde Mercería',
      description:
        'Contactá a Matilde Mercería en Paraná. WhatsApp, email, dirección y horarios de atención.',
      image: absoluteUrl(null),
      url,
      type: 'website',
    };
  }

  if (pathname === '/categorias') {
    return {
      title: 'Categorías de mercería en Paraná | Matilde Mercería',
      description:
        'Explorá todas las categorías del catálogo de Matilde Mercería en Paraná: hilos, lanas, agujas, botones y más.',
      image: absoluteUrl(null),
      url,
      type: 'website',
    };
  }

  const producto = pathname.match(/^\/producto\/([^/]+)\/?$/);
  if (producto) {
    const slug = decodeURIComponent(producto[1]);
    const p = await fetchJson<{
      nombre: string;
      descripcion?: string | null;
      imagenes?: string[];
      categoria?: string;
    }>(`/api/productos/${encodeURIComponent(slug)}`);

    if (p) {
      return {
        title: `${p.nombre} | Matilde Mercería`,
        description:
          p.descripcion?.trim() ||
          `${p.nombre} en Matilde Mercería, mercería en Paraná. Consultá precio y stock.`,
        image: absoluteUrl(p.imagenes?.[0]),
        url,
        type: 'product',
      };
    }
  }

  const categoria = pathname.match(/^\/categorias\/([^/]+)\/?$/);
  if (categoria) {
    const slug = decodeURIComponent(categoria[1]);
    const cat = await fetchJson<{
      nombre: string;
      productos?: { nombre?: string; slug?: string; imagenUrl?: string }[];
    }>(`/api/categorias/${encodeURIComponent(slug)}/productos`);
    if (cat) {
      const img = cat.productos?.find((p) => p.imagenUrl)?.imagenUrl;
      const list = (cat.productos || []).map((p) => ({
        nombre: p.nombre,
        slug: p.slug,
      }));
      return {
        title: `${cat.nombre} en Paraná | Matilde Mercería`,
        description: `Comprá ${cat.nombre} en Matilde Mercería, tu mercería en Paraná. Retiro en el local o envíos en la ciudad.`,
        image: absoluteUrl(img),
        url,
        type: 'website',
        bodyHtml: productListHtml(list, 'https://www.merceriamatilde.com/producto'),
      };
    }
  }

  const coleccion = pathname.match(/^\/colecciones\/([^/]+)\/?$/);
  if (coleccion) {
    const slug = decodeURIComponent(coleccion[1]);
    const col = await fetchJson<{
      nombre: string;
      descripcion?: string | null;
      productos?: { nombre?: string; slug?: string; imagenUrl?: string }[];
    }>(`/api/catalogo/colecciones/${encodeURIComponent(slug)}`);
    if (col) {
      const img = col.productos?.find((p) => p.imagenUrl)?.imagenUrl;
      return {
        title: `${col.nombre} en Paraná | Matilde Mercería`,
        description:
          col.descripcion?.trim() ||
          `Colección ${col.nombre} en Matilde Mercería, mercería en Paraná.`,
        image: absoluteUrl(img),
        url,
        type: 'website',
        bodyHtml: productListHtml(
          (col.productos || []).map((p) => ({ nombre: p.nombre, slug: p.slug })),
          'https://www.merceriamatilde.com/producto',
        ),
      };
    }
  }

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
