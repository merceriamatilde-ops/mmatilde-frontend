export function formatPrice(price: number | string | null | undefined): string {
  if (price === null || price === undefined) return 'Consultar';
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return 'Consultar';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(num);
}

export function whatsappUrl(productName?: string, phone: string = '+5493435190082'): string {
  const base = `https://wa.me/${phone.replace(/[^0-9]/g, '')}`;
  if (!productName) return base;
  const message = `Hola! Quisiera consultar por el producto: ${productName}`;
  return `${base}?text=${encodeURIComponent(message)}`;
}

export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function truncate(str: string, length: number): string {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
}

export function normalizeSearchQuery(value: string | null | undefined): string {
  return (value ?? '').trim();
}

export function formatDateTimeAr(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(date);
}
