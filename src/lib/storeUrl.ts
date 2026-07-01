export function getStoreUrl(): string {
  const host = window.location.hostname;
  if (host.startsWith('ia.') || host.startsWith('bo.')) {
    return `https://www.${host.slice(3)}`;
  }
  if (host === 'localhost' || host === '127.0.0.1') {
    return '/';
  }
  return '/';
}

export function getProductUrl(slug: string): string {
  const store = getStoreUrl();
  if (store === '/') return `/producto/${slug}`;
  return `${store}/producto/${slug}`;
}

export function buildWhatsAppMaterialesUrl(
  phone: string,
  proyecto: string,
  insumos: string[],
): string {
  const base = `https://wa.me/${phone.replace(/[^0-9]/g, '')}`;
  const lista = insumos.map((i, n) => `${n + 1}. ${i}`).join('\n');
  const text = `Hola Mercería Matilde! Usé la asistente virtual para mi proyecto: ${proyecto}.\n\nNecesitaría estos materiales:\n${lista}\n\n¿Me ayudan a confirmar cantidades y disponibilidad?`;
  return `${base}?text=${encodeURIComponent(text)}`;
}
