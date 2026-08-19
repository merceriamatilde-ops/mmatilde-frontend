export const IA_API_BASE = import.meta.env.VITE_IA_API_URL || '/ia-api';

export interface OpcionPregunta {
  id: string;
  label: string;
}

export interface PreguntaIA {
  id: string;
  pregunta: string;
  opciones: OpcionPregunta[];
}

export interface ResumenProyecto {
  proyecto: string;
  tecnica?: string | null;
  detalles: string[];
}

export interface ProgresoConsulta {
  confirmado: string[];
  falta: string[];
  pasos_restantes: number;
  ultimo_paso: boolean;
}

export interface InsumoEstimado {
  descripcion: string;
  termino_busqueda: string;
}

export interface ResultadoIA {
  tecnica_detectada: string;
  insumos: InsumoEstimado[];
  nota: string;
  completitud?: 'exacta' | 'aproximada';
  supuestos?: string[];
  chequeos?: string[];
}

export interface ProductoSugerido {
  id: number;
  slug: string;
  nombre: string;
  categoria: string;
  imagen_url?: string | null;
  termino_relacionado: string;
}

export interface ConsultaContexto {
  descripcion_inicial: string;
  respuestas: { id: string; pregunta: string; respuesta: string }[];
  notas_adicionales: string[];
  paso_refinamiento?: number;
  acepta_aproximado?: boolean;
}

export interface ConsultaResponse {
  estado: 'preguntando' | 'listo';
  mensaje: string;
  progreso: ProgresoConsulta;
  resumen: ResumenProyecto;
  preguntas: PreguntaIA[];
  resultado: ResultadoIA | null;
  productos_sugeridos: ProductoSugerido[];
}

const PROGRESO_VACIO: ProgresoConsulta = {
  confirmado: [],
  falta: [],
  pasos_restantes: 1,
  ultimo_paso: false,
};

const REQUEST_TIMEOUT_MS = 90_000;

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Registra la consulta completada en el BO (api.merceriamatilde.com). */
export async function registrarConsultaEnBO(
  contexto: ConsultaContexto,
  result: ConsultaResponse,
): Promise<void> {
  if (result.estado !== 'listo' || !result.resultado) return;

  const contextoJson = JSON.stringify(contexto);
  const resultadoJson = JSON.stringify(result.resultado);
  const idempotencyKey = await sha256Hex(contextoJson + resultadoJson);

  if (sessionStorage.getItem(`ia_logged_${idempotencyKey}`)) return;

  const apiBase =
    import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'https://api.merceriamatilde.com/api');

  const response = await fetch(`${apiBase}/ia/consultas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      proyecto: result.resumen.proyecto || contexto.descripcion_inicial || 'Sin título',
      tecnica: result.resultado.tecnica_detectada,
      contextoJson,
      resultadoJson,
      productosJson: JSON.stringify(result.productos_sugeridos),
    }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => '');
    throw new Error(err || `HTTP ${response.status}`);
  }

  sessionStorage.setItem(`ia_logged_${idempotencyKey}`, '1');
}

export async function consultarIA(
  contexto: ConsultaContexto,
  imagen?: File | null,
): Promise<ConsultaResponse> {
  const formData = new FormData();
  formData.append('contexto', JSON.stringify(contexto));
  if (imagen) {
    formData.append('imagen', imagen);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${IA_API_BASE}/api/consulta`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'No pudimos conectar con la asistente');
    }

    const data = await response.json();
    return {
      ...data,
      progreso: data.progreso ?? PROGRESO_VACIO,
      productos_sugeridos: (data.productos_sugeridos || []).map((p: Record<string, unknown>) => ({
        id: p.id,
        slug: p.slug,
        nombre: p.nombre,
        categoria: p.categoria,
        imagen_url: p.imagen_url ?? p.imagenUrl ?? null,
        termino_relacionado: p.termino_relacionado,
      })),
    };
  } finally {
    clearTimeout(timeout);
  }
}
