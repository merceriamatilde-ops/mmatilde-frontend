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
