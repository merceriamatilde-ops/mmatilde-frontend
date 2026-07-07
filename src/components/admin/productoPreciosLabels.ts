export const MODOS_ORIGEN = [
  {
    value: 'REVENTA',
    label: 'Reventa',
    hint: 'Makor u otro proveedor. Precio con fórmula o excepción.',
    emoji: '🛒',
  },
  {
    value: 'CONSIGNACION',
    label: 'Consignación',
    hint: 'Producto de un tercero; vos ponés el precio y te quedás un %.',
    emoji: '🤝',
  },
  {
    value: 'ELABORACION_PROPIA',
    label: 'Elaboración propia',
    hint: 'Tejido, costura, etc. Precio a mano + costos internos.',
    emoji: '✂️',
  },
  {
    value: 'SIN_COSTO',
    label: 'Sin costo',
    hint: 'Regalo o donación. Solo cargás precio de venta.',
    emoji: '🎁',
  },
] as const;

export const MODOS_PRECIO_REVENTA = [
  {
    value: 'AUTOMATICO',
    label: 'Automático',
    hint: 'Costo de compra × IVA × margen (global o por categoría).',
  },
  {
    value: 'EXCEPCION',
    label: 'Excepción',
    hint: 'Mismo cálculo pero con IVA/margen propios de este producto.',
  },
] as const;

export type ModoOrigenEconomico = (typeof MODOS_ORIGEN)[number]['value'];
export type ModoPrecio = 'AUTOMATICO' | 'EXCEPCION' | 'PRECIO_FIJO';

const MODO_PRECIO_LABELS: Record<ModoPrecio, string> = {
  AUTOMATICO: 'Automático',
  EXCEPCION: 'Excepción',
  PRECIO_FIJO: 'Precio fijo',
};

const ORIGEN_BADGE: Record<ModoOrigenEconomico, string> = {
  REVENTA: 'bg-sky-100 text-sky-800',
  CONSIGNACION: 'bg-amber-100 text-amber-800',
  ELABORACION_PROPIA: 'bg-violet-100 text-violet-800',
  SIN_COSTO: 'bg-stone-200 text-stone-700',
};

export function getOrigenMeta(value?: string | null) {
  const found = MODOS_ORIGEN.find((m) => m.value === value);
  return found ?? MODOS_ORIGEN[0];
}

export function getModoPrecioLabel(value?: string | null) {
  if (!value) return '—';
  return MODO_PRECIO_LABELS[value as ModoPrecio] ?? value;
}

export function getOrigenBadgeClass(value?: string | null) {
  const key = (value || 'REVENTA') as ModoOrigenEconomico;
  return ORIGEN_BADGE[key] ?? ORIGEN_BADGE.REVENTA;
}
