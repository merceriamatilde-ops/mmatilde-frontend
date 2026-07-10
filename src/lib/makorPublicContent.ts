const SUFFIX_PATTERNS = [
  /\s+x\s*\d+(?:[.,]\d+)?\s*un\b$/i,
  /\s+x\s*\d+(?:[.,]\d+)?\s*kg\b$/i,
  /\s+\d+(?:[.,]\d+)?\s*kg\b$/i,
  /\s+x\s*\d+(?:[.,]\d+)?\s*(?:g|gr|gramos?)\b$/i,
  /\s+x\s*\d+(?:[.,]\d+)?\s*(?:m|mt|mts|metro|metros)\b$/i,
  /\s+\d+(?:[.,]\d+)?\s*(?:m|mt|mts|metro|metros)\b$/i,
  /\s+rollo\s*\d+(?:[.,]\d+)?\s*(?:m|mt|mts|metro|metros)\b$/i,
  /\s+x\s*\d+(?:[.,]\d+)?\s*cm\b$/i,
  /\s+x\s*\d+(?:[.,]\d+)?\s*l(?:itros?)?\b$/i,
  /\s+x\s*\d+(?:[.,]\d+)?\s*ml\b$/i,
  /\s+\bdocena\b$/i,
  /\s+x\s*\d+(?:[.,]\d+)?\s*(?:u(?:n(?:idad(?:es)?)?)?|pzas?|piezas?)\b$/i,
  /\s+\d+(?:[.,]\d+)?\s*(?:u(?:n(?:idad(?:es)?)?)?|pzas?|piezas?)\b$/i,
  /\s+x\s*\d+(?:[.,]\d+)?\b$/i,
];

export function stripUnidadSufijo(nombre: string): string {
  const trimmed = nombre.trim();
  if (!trimmed) return '';

  for (const pattern of SUFFIX_PATTERNS) {
    const stripped = trimmed.replace(pattern, '').trimEnd();
    if (stripped !== trimmed && stripped.length > 0) {
      return stripped.replace(/[\s\-–—]+$/, '').trim();
    }
  }

  return trimmed;
}

export function suggestMakorPublicTitle(nombre?: string | null): string {
  if (!nombre?.trim()) return '';
  return stripUnidadSufijo(nombre);
}

export function suggestMakorPublicDescription(descripcion?: string | null): string {
  return descripcion?.trim() ?? '';
}

function isDefaultMakorTitle(
  nombrePublico: string,
  nombre?: string | null
): boolean {
  const stored = nombrePublico.trim();
  const raw = nombre?.trim() ?? '';
  if (!raw) return false;
  return stored === raw || stored === suggestMakorPublicTitle(raw);
}

export function resolveMakorPublicTitle(
  nombre?: string | null,
  nombrePublico?: string | null
): string {
  const suggested = suggestMakorPublicTitle(nombre);
  if (!nombrePublico?.trim()) return suggested;
  if (isDefaultMakorTitle(nombrePublico, nombre)) return suggested;
  return nombrePublico.trim();
}

export function resolveMakorPublicDescription(
  descripcion?: string | null,
  descripcionPublica?: string | null
): string {
  const suggested = suggestMakorPublicDescription(descripcion);
  if (!descripcionPublica?.trim()) return suggested;
  const stored = descripcionPublica.trim();
  const raw = descripcion?.trim() ?? '';
  if (raw && stored === raw) return suggested;
  return stored;
}
