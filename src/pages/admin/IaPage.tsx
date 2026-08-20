import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Badge } from '../../components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Modal } from '../../components/ui/Modal';
import { ThumbsUp, ThumbsDown, Brain, ChevronDown, ChevronUp, GraduationCap, Upload, Trash2, BookCopy } from 'lucide-react';

type Tab = 'consultas' | 'entrenamiento' | 'reglas';

type IaConsulta = {
  id: number;
  proyecto: string;
  tecnica?: string;
  contextoJson: string;
  resultadoJson: string;
  productosJson?: string;
  imagenUrl?: string;
  evaluacion?: string;
  notaCorreccion?: string;
  correccionEsperada?: string;
  creadoEn: string;
  revisadoEn?: string;
};

type IaRegla = {
  id: number;
  titulo: string;
  disparadores: string;
  regla: string;
  activa: boolean;
  consultaOrigenId?: number;
  creadoEn: string;
};

type IaEjemplo = {
  id: number;
  titulo: string;
  disparadores: string;
  descripcion: string;
  respuestaJson: string;
  imagenUrl?: string;
  activa: boolean;
  creadoEn: string;
};

const RESPUESTA_PLANTILLA = `{
  "tecnica_detectada": "Costura",
  "completitud": "exacta",
  "insumos": [
    { "descripcion": "80g guata fina para bebé", "termino_busqueda": "guata bebe" }
  ],
  "nota": "Chaleco RN: no más de 100g guata."
}`;

function parseJsonSafe<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

type ContextoConsulta = {
  descripcion_inicial?: string;
  respuestas?: { pregunta?: string; respuesta?: string }[];
  notas_adicionales?: string[];
  tuvo_foto?: boolean;
  imagen_url?: string;
  resumen?: { proyecto?: string; tecnica?: string | null; detalles?: string[] };
};

function buildDescripcionEjemplo(
  c: IaConsulta,
  fb?: { nota: string; correccion: string },
): string {
  const ctx = parseJsonSafe<ContextoConsulta>(c.contextoJson, {});
  const lines: string[] = [];

  if (ctx.descripcion_inicial) {
    lines.push(`Proyecto del cliente: ${ctx.descripcion_inicial}`);
  }
  for (const r of ctx.respuestas || []) {
    if (r.pregunta && r.respuesta) lines.push(`${r.pregunta}: ${r.respuesta}`);
  }
  for (const n of ctx.notas_adicionales || []) lines.push(n);
  if (c.tecnica) lines.push(`Técnica: ${c.tecnica}`);

  const correccion = (c.correccionEsperada || fb?.correccion || '').trim();
  const resultado = parseJsonSafe<{ insumos?: { descripcion: string }[]; nota?: string }>(
    c.resultadoJson,
    {},
  );

  if (correccion || c.evaluacion === 'mal') {
    lines.push('');
    lines.push('Lo que recomendó la IA:');
    for (const ins of resultado.insumos || []) {
      lines.push(`- ${ins.descripcion}`);
    }
    if (resultado.nota) lines.push(`Nota IA: ${resultado.nota}`);
    if (correccion) {
      lines.push('');
      lines.push(`Lo correcto: ${correccion}`);
    }
  } else if (c.evaluacion === 'bien') {
    lines.push('');
    lines.push('Recomendación validada por el equipo.');
  }

  const nota = (c.notaCorreccion || fb?.nota || '').trim();
  if (nota) lines.push(`Nota interna: ${nota}`);

  return lines.join('\n').trim();
}

function buildRespuestaEjemplo(
  c: IaConsulta,
  fb?: { correccion: string },
): string {
  const correccion = (c.correccionEsperada || fb?.correccion || '').trim();

  if (correccion) {
    try {
      const parsed = JSON.parse(correccion);
      if (parsed && typeof parsed === 'object') {
        return JSON.stringify(parsed, null, 2);
      }
    } catch {
      /* texto libre */
    }

    const base = parseJsonSafe<Record<string, unknown>>(c.resultadoJson, {
      tecnica_detectada: c.tecnica || 'No especificada',
      completitud: 'exacta',
      insumos: [],
      nota: '',
    });
    return JSON.stringify({ ...base, nota: correccion }, null, 2);
  }

  const resultado = parseJsonSafe(c.resultadoJson, null);
  if (resultado) return JSON.stringify(resultado, null, 2);
  return RESPUESTA_PLANTILLA;
}

function buildDisparadoresEjemplo(c: IaConsulta, fb?: { disparadores: string }): string {
  if (fb?.disparadores?.trim()) return fb.disparadores.trim();

  const texto = [
    c.proyecto,
    c.tecnica,
    c.correccionEsperada,
    parseJsonSafe<ContextoConsulta>(c.contextoJson, {}).descripcion_inicial,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const palabras = texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !['para', 'como', 'esta', 'este', 'quiero'].includes(w));

  return [...new Set(palabras)].slice(0, 6).join(', ');
}

function consultaTieneResultado(c: IaConsulta): boolean {
  const r = parseJsonSafe<{ insumos?: unknown[] }>(c.resultadoJson, {});
  return Boolean(r.insumos?.length);
}

export function IaPage() {
  const [tab, setTab] = useState<Tab>('consultas');
  const [consultas, setConsultas] = useState<IaConsulta[]>([]);
  const [reglas, setReglas] = useState<IaRegla[]>([]);
  const [ejemplos, setEjemplos] = useState<IaEjemplo[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filtro, setFiltro] = useState<'todas' | 'pendientes' | 'mal'>('pendientes');
  const [feedback, setFeedback] = useState<Record<number, {
    nota: string;
    correccion: string;
    crearRegla: boolean;
    tituloRegla: string;
    disparadores: string;
  }>>({});

  const [nuevoEjemplo, setNuevoEjemplo] = useState({
    titulo: '',
    disparadores: '',
    descripcion: '',
    respuestaJson: RESPUESTA_PLANTILLA,
    imagenUrl: '' as string | undefined,
  });
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [guardandoEjemplo, setGuardandoEjemplo] = useState(false);
  const [origenConsultaId, setOrigenConsultaId] = useState<number | null>(null);
  const [modalInfo, setModalInfo] = useState<{ title: string; message: string } | null>(null);
  const [ejemploAEliminar, setEjemploAEliminar] = useState<IaEjemplo | null>(null);

  const loadConsultas = () => {
    const q =
      filtro === 'pendientes'
        ? '?pendientes=true'
        : filtro === 'mal'
          ? '?evaluacion=mal'
          : '';
    api.getIaConsultas(q).then(setConsultas).catch(console.error);
  };

  const loadReglas = () => api.getIaReglas().then(setReglas).catch(console.error);
  const loadEjemplos = () => api.getIaEjemplos().then(setEjemplos).catch(console.error);

  const load = () => {
    loadConsultas();
    loadReglas();
    loadEjemplos();
  };

  useEffect(() => {
    loadConsultas();
  }, [filtro]);

  useEffect(() => {
    if (tab === 'reglas') loadReglas();
    if (tab === 'entrenamiento') loadEjemplos();
  }, [tab]);

  const getFeedback = (id: number) => feedback[id] || {
    nota: '',
    correccion: '',
    crearRegla: true,
    tituloRegla: '',
    disparadores: '',
  };

  const setFeedbackField = (id: number, field: string, value: string | boolean) => {
    setFeedback((prev) => ({
      ...prev,
      [id]: { ...getFeedback(id), [field]: value },
    }));
  };

  const enviarBien = async (id: number) => {
    await api.enviarIaFeedback(id, { evaluacion: 'bien' });
    load();
  };

  const enviarMal = async (consulta: IaConsulta) => {
    const fb = getFeedback(consulta.id);
    if (!fb.correccion.trim()) {
      setModalInfo({
        title: 'Falta la corrección',
        message: 'Indicá qué debió recomendar la IA, por ejemplo: chaleco bebé 80g, no adulto.',
      });
      return;
    }
    await api.enviarIaFeedback(consulta.id, {
      evaluacion: 'mal',
      notaCorreccion: fb.nota || undefined,
      correccionEsperada: fb.correccion,
      crearRegla: fb.crearRegla,
      reglaTitulo: fb.tituloRegla || undefined,
      reglaDisparadores: fb.disparadores || consulta.proyecto,
    });
    load();
  };

  const convertirConsultaEnEjemplo = (consulta: IaConsulta) => {
    if (!consultaTieneResultado(consulta)) {
      setModalInfo({
        title: 'No se puede convertir',
        message: 'Esta consulta no tiene una recomendación para convertir en ejemplo.',
      });
      return;
    }
    const fb = getFeedback(consulta.id);
    const ctx = parseJsonSafe<ContextoConsulta>(consulta.contextoJson, {});
    setNuevoEjemplo({
      titulo: consulta.proyecto || 'Ejemplo desde consulta',
      disparadores: buildDisparadoresEjemplo(consulta, fb),
      descripcion: buildDescripcionEjemplo(consulta, fb),
      respuestaJson: buildRespuestaEjemplo(consulta, fb),
      imagenUrl: consulta.imagenUrl || ctx.imagen_url,
    });
    setOrigenConsultaId(consulta.id);
    setTab('entrenamiento');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleRegla = async (id: number) => {
    await api.toggleIaRegla(id);
    loadReglas();
  };

  const toggleEjemplo = async (id: number) => {
    await api.toggleIaEjemplo(id);
    loadEjemplos();
  };

  const eliminarEjemplo = async (id: number) => {
    await api.eliminarIaEjemplo(id);
    loadEjemplos();
  };

  const subirImagenEjemplo = async (file: File) => {
    setSubiendoImagen(true);
    try {
      const res = await api.uploadImage(file);
      setNuevoEjemplo((prev) => ({ ...prev, imagenUrl: res.url }));
    } catch (e) {
      console.error(e);
      setModalInfo({
        title: 'Error al subir imagen',
        message: 'No se pudo subir la imagen.',
      });
    } finally {
      setSubiendoImagen(false);
    }
  };

  const guardarEjemplo = async () => {
    if (!nuevoEjemplo.titulo.trim() || !nuevoEjemplo.descripcion.trim()) {
      setModalInfo({
        title: 'Faltan datos',
        message: 'Completá título y descripción del ejemplo.',
      });
      return;
    }
    try {
      JSON.parse(nuevoEjemplo.respuestaJson);
    } catch {
      setModalInfo({
        title: 'JSON inválido',
        message: 'La respuesta correcta debe ser JSON válido.',
      });
      return;
    }
    setGuardandoEjemplo(true);
    try {
      await api.crearIaEjemplo({
        titulo: nuevoEjemplo.titulo,
        disparadores: nuevoEjemplo.disparadores,
        descripcion: nuevoEjemplo.descripcion,
        respuestaJson: nuevoEjemplo.respuestaJson,
        imagenUrl: nuevoEjemplo.imagenUrl || null,
      });
      setNuevoEjemplo({
        titulo: '',
        disparadores: '',
        descripcion: '',
        respuestaJson: RESPUESTA_PLANTILLA,
        imagenUrl: undefined,
      });
      setOrigenConsultaId(null);
      loadEjemplos();
    } catch (e) {
      console.error(e);
      setModalInfo({
        title: 'Error al guardar',
        message: 'No se pudo guardar el ejemplo de entrenamiento.',
      });
    } finally {
      setGuardandoEjemplo(false);
    }
  };

  const evalBadge = (ev?: string) => {
    if (ev === 'bien') return <Badge variant="success">Bien</Badge>;
    if (ev === 'mal') return <Badge variant="danger">A corregir</Badge>;
    return <Badge variant="warning">Pendiente</Badge>;
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'consultas', label: 'Consultas' },
    { id: 'entrenamiento', label: 'Entrenamiento' },
    { id: 'reglas', label: 'Reglas' },
  ];

  return (
    <div className="space-y-6">
      <Modal
        open={Boolean(modalInfo)}
        title={modalInfo?.title || ''}
        onClose={() => setModalInfo(null)}
        maxWidthClassName="max-w-md"
        footer={
          <Button onClick={() => setModalInfo(null)}>
            Entendido
          </Button>
        }
      >
        <p className="text-sm text-stone-600">{modalInfo?.message}</p>
      </Modal>

      <ConfirmModal
        open={Boolean(ejemploAEliminar)}
        title="Eliminar ejemplo de entrenamiento"
        description={
          ejemploAEliminar
            ? `Se va a eliminar "${ejemploAEliminar.titulo}".`
            : undefined
        }
        confirmLabel="Eliminar"
        onClose={() => setEjemploAEliminar(null)}
        onConfirm={() => {
          if (!ejemploAEliminar) return;
          void eliminarEjemplo(ejemploAEliminar.id).finally(() => setEjemploAEliminar(null));
        }}
      />

      <div>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight font-outfit flex items-center gap-2">
          <Brain className="h-8 w-8 text-brand-600" />
          Asistente IA — Aprendizaje
        </h1>
        <p className="text-stone-500 mt-1 max-w-3xl">
          Revisá consultas, cargá ejemplos con foto y respuesta correcta, y gestioná reglas.
          Solo se inyecta en el prompt lo relevante al proyecto (menos tokens, mejor precisión).
        </p>
        <p className="text-stone-400 text-sm mt-2 max-w-3xl">
          Las consultas aparecen acá cuando el cliente <strong>termina</strong> el asistente y ve la recomendación final
          (no en cada paso intermedio del wizard).
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              tab === t.id
                ? 'bg-white border border-b-white border-stone-200 text-brand-700 -mb-px'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'consultas' && (
        <>
          <div className="flex flex-wrap gap-2">
            {(['pendientes', 'mal', 'todas'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filtro === f
                    ? 'bg-brand-600 text-white'
                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                {f === 'pendientes' ? 'Pendientes' : f === 'mal' ? 'Marcadas mal' : 'Todas'}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-medium text-stone-900 mb-4">Consultas recientes</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Proyecto</TableHead>
                  <TableHead>Técnica</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consultas.map((c) => {
                  const ctx = parseJsonSafe<ContextoConsulta>(c.contextoJson, {});
                  const fotoUrl = c.imagenUrl || ctx.imagen_url;
                  const pedido = (ctx.descripcion_inicial || '').trim();
                  const respuestas = (ctx.respuestas || []).filter((r) => r.pregunta || r.respuesta);
                  const resultado = parseJsonSafe<{
                    tecnica_detectada?: string;
                    insumos?: { descripcion: string }[];
                    nota?: string;
                    supuestos?: string[];
                    chequeos?: string[];
                  }>(c.resultadoJson, {});
                  const expanded = expandedId === c.id;
                  const fb = getFeedback(c.id);

                  return (
                    <React.Fragment key={c.id}>
                      <TableRow>
                        <TableCell className="whitespace-nowrap">
                          {new Date(c.creadoEn).toLocaleString('es-AR')}
                        </TableCell>
                        <TableCell className="max-w-[280px]">
                          <div className="font-medium truncate">{c.proyecto}</div>
                          {pedido && pedido !== c.proyecto && (
                            <div className="text-xs text-stone-500 truncate mt-0.5">{pedido}</div>
                          )}
                        </TableCell>
                        <TableCell>{c.tecnica || resultado.tecnica_detectada || '—'}</TableCell>
                        <TableCell>{evalBadge(c.evaluacion)}</TableCell>
                        <TableCell>
                          <button
                            onClick={() => setExpandedId(expanded ? null : c.id)}
                            className="text-brand-600 hover:text-brand-800 text-sm flex items-center gap-1"
                          >
                            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            Ver
                          </button>
                        </TableCell>
                      </TableRow>
                      {expanded && (
                        <TableRow>
                          <TableCell colSpan={5} className="bg-stone-50">
                            <div className="py-4 space-y-4 text-sm">
                              <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                                <div className="space-y-3">
                                  <div>
                                    <p className="font-medium text-stone-700 mb-1">Lo que pidió</p>
                                    {pedido ? (
                                      <p className="text-stone-700 whitespace-pre-wrap">{pedido}</p>
                                    ) : (
                                      <p className="text-stone-400">Sin texto inicial (solo foto o chips).</p>
                                    )}
                                  </div>
                                  {respuestas.length > 0 && (
                                    <div>
                                      <p className="font-medium text-stone-700 mb-1">Selecciones</p>
                                      <ul className="space-y-1 text-stone-600">
                                        {respuestas.map((r, i) => (
                                          <li key={i}>
                                            <span className="text-stone-500">{r.pregunta || 'Pregunta'}: </span>
                                            <span className="font-medium text-stone-800">{r.respuesta || '—'}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {(ctx.notas_adicionales || []).length > 0 && (
                                    <div>
                                      <p className="font-medium text-stone-700 mb-1">Notas</p>
                                      <ul className="list-disc pl-5 text-stone-600">
                                        {ctx.notas_adicionales!.map((n, i) => (
                                          <li key={i}>{n}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {(ctx.resumen?.detalles || []).length > 0 && (
                                    <div>
                                      <p className="font-medium text-stone-700 mb-1">Inferido</p>
                                      <ul className="list-disc pl-5 text-stone-600">
                                        {ctx.resumen!.detalles!.map((d, i) => (
                                          <li key={i}>{d}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {!pedido && respuestas.length === 0 && ctx.tuvo_foto && !fotoUrl && (
                                    <p className="text-stone-500">Adjuntó foto (no quedó guardada).</p>
                                  )}
                                </div>
                                {fotoUrl ? (
                                  <a href={fotoUrl} target="_blank" rel="noreferrer" className="shrink-0">
                                    <img
                                      src={fotoUrl}
                                      alt="Foto del cliente"
                                      className="h-32 w-32 object-cover rounded-lg border border-stone-200 bg-white"
                                    />
                                  </a>
                                ) : ctx.tuvo_foto ? (
                                  <div className="h-32 w-32 rounded-lg border border-dashed border-stone-300 text-stone-400 text-xs flex items-center justify-center text-center px-2">
                                    Hubo foto, no se guardó
                                  </div>
                                ) : null}
                              </div>

                              <div>
                                <p className="font-medium text-stone-700 mb-1">Insumos recomendados</p>
                                <ul className="list-disc pl-5 text-stone-600 space-y-1">
                                  {(resultado.insumos || []).map((ins, i) => (
                                    <li key={i}>{ins.descripcion}</li>
                                  ))}
                                </ul>
                                {resultado.nota && (
                                  <p className="mt-2 text-stone-500 italic">{resultado.nota}</p>
                                )}
                                {(resultado.supuestos?.length || resultado.chequeos?.length) ? (
                                  <p className="mt-2 text-xs text-stone-500">
                                    {resultado.supuestos?.length ? `Supuestos: ${resultado.supuestos.join(', ')}. ` : ''}
                                    {resultado.chequeos?.length ? `Chequeos: ${resultado.chequeos.join(' · ')}` : ''}
                                  </p>
                                ) : null}
                              </div>

                              {!c.evaluacion && (
                                <div className="border-t border-stone-200 pt-4 space-y-3">
                                  <p className="font-medium text-stone-800">¿La recomendación estuvo bien?</p>
                                  <Button size="sm" variant="outline" onClick={() => enviarBien(c.id)}>
                                    <ThumbsUp className="h-4 w-4 mr-1" /> Sí, bien
                                  </Button>
                                  <div className="grid gap-3 max-w-2xl">
                                    <textarea
                                      className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                                      rows={2}
                                      placeholder="¿Qué debió recomendar? Ej: chaleco bebé 80g guata, no adulto."
                                      value={fb.correccion}
                                      onChange={(e) => setFeedbackField(c.id, 'correccion', e.target.value)}
                                    />
                                    <input
                                      className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                                      placeholder="Nota interna (opcional)"
                                      value={fb.nota}
                                      onChange={(e) => setFeedbackField(c.id, 'nota', e.target.value)}
                                    />
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={fb.crearRegla}
                                        onChange={(e) => setFeedbackField(c.id, 'crearRegla', e.target.checked)}
                                      />
                                      <span>Guardar también como regla</span>
                                    </label>
                                    {fb.crearRegla && (
                                      <>
                                        <input
                                          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                                          placeholder="Palabras clave: chaleco, bebé, guata"
                                          value={fb.disparadores}
                                          onChange={(e) => setFeedbackField(c.id, 'disparadores', e.target.value)}
                                        />
                                      </>
                                    )}
                                    <Button size="sm" variant="danger" onClick={() => enviarMal(c)}>
                                      <ThumbsDown className="h-4 w-4 mr-1" /> Marcar mal y corregir
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {c.evaluacion === 'mal' && c.correccionEsperada && (
                                <div className="border-t border-stone-200 pt-3 text-stone-600">
                                  <strong>Corrección:</strong> {c.correccionEsperada}
                                </div>
                              )}

                              {consultaTieneResultado(c) && (
                                <div className="border-t border-stone-200 pt-4">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => convertirConsultaEnEjemplo(c)}
                                  >
                                    <BookCopy className="h-4 w-4 mr-1" />
                                    Convertir en ejemplo de entrenamiento
                                  </Button>
                                  <p className="text-xs text-stone-500 mt-2">
                                    Abrís el formulario de Entrenamiento con los datos de esta consulta para revisar y guardar.
                                  </p>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
                {consultas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-stone-500">
                      No hay consultas para mostrar.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {tab === 'entrenamiento' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-medium text-stone-900 mb-1 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-brand-600" />
              Nuevo ejemplo de entrenamiento
            </h3>
            <p className="text-sm text-stone-500 mb-6">
              Subí una foto (opcional) y describí qué es y qué debió recomendar la IA.
              Si un cliente hace una consulta parecida, este ejemplo se usa como referencia.
            </p>
            {origenConsultaId && (
              <div className="mb-4 rounded-lg bg-brand-50 border border-brand-200 px-4 py-3 text-sm text-brand-800">
                Formulario precargado desde la consulta #{origenConsultaId}. Revisá los datos, subí la foto si tenés, y guardá.
              </div>
            )}

            <div className="grid gap-4 max-w-2xl">
              <input
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                placeholder="Título (ej: Chaleco bebé RN con guata)"
                value={nuevoEjemplo.titulo}
                onChange={(e) => setNuevoEjemplo((p) => ({ ...p, titulo: e.target.value }))}
              />
              <input
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                placeholder="Palabras clave para activarlo: chaleco, bebe, guata, rn"
                value={nuevoEjemplo.disparadores}
                onChange={(e) => setNuevoEjemplo((p) => ({ ...p, disparadores: e.target.value }))}
              />
              <textarea
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                rows={3}
                placeholder="Descripción exacta: qué se ve en la foto, talle, edad, técnica..."
                value={nuevoEjemplo.descripcion}
                onChange={(e) => setNuevoEjemplo((p) => ({ ...p, descripcion: e.target.value }))}
              />

              <div>
                <label className="block text-sm text-stone-600 mb-2">Foto de referencia (opcional)</label>
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-stone-300 rounded-lg text-sm hover:bg-stone-50">
                    <Upload size={16} />
                    {subiendoImagen ? 'Subiendo...' : 'Elegir imagen'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={subiendoImagen}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) subirImagenEjemplo(f);
                      }}
                    />
                  </label>
                  {nuevoEjemplo.imagenUrl && (
                    <img
                      src={nuevoEjemplo.imagenUrl}
                      alt="Vista previa"
                      className="h-16 w-16 object-cover rounded-lg border border-stone-200"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm text-stone-600 mb-1">Respuesta correcta (JSON)</label>
                <textarea
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm font-mono text-xs"
                  rows={10}
                  value={nuevoEjemplo.respuestaJson}
                  onChange={(e) => setNuevoEjemplo((p) => ({ ...p, respuestaJson: e.target.value }))}
                />
              </div>

              <Button onClick={guardarEjemplo} disabled={guardandoEjemplo}>
                {guardandoEjemplo ? 'Guardando...' : 'Guardar ejemplo'}
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-medium text-stone-900 mb-4">Ejemplos cargados</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ejemplo</TableHead>
                  <TableHead>Disparadores</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ejemplos.map((ex) => (
                  <TableRow key={ex.id}>
                    <TableCell>
                      <div className="flex gap-3 items-start">
                        {ex.imagenUrl && (
                          <img src={ex.imagenUrl} alt="" className="h-12 w-12 rounded object-cover flex-shrink-0" />
                        )}
                        <div>
                          <div className="font-medium text-stone-800">{ex.titulo}</div>
                          <div className="text-stone-500 text-sm mt-1 line-clamp-2">{ex.descripcion}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-stone-500 text-sm">{ex.disparadores || '—'}</TableCell>
                    <TableCell>
                      {ex.activa ? <Badge variant="success">Activo</Badge> : <Badge>Inactivo</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => toggleEjemplo(ex.id)}>
                          {ex.activa ? 'Desactivar' : 'Activar'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEjemploAEliminar(ex)}>
                          <Trash2 size={16} className="text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {ejemplos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-16 text-center text-stone-500">
                      Todavía no hay ejemplos. Cargá el primero arriba.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {tab === 'reglas' && (
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-medium text-stone-900 mb-2">Reglas aprendidas</h3>
          <p className="text-sm text-stone-500 mb-4">
            Solo se envían a la IA las reglas cuyas palabras clave coinciden con la consulta del cliente.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Regla</TableHead>
                <TableHead>Disparadores</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reglas.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium text-stone-800">{r.titulo}</div>
                    <div className="text-stone-600 text-sm mt-1">{r.regla}</div>
                  </TableCell>
                  <TableCell className="text-stone-500 text-sm">{r.disparadores || '(global)'}</TableCell>
                  <TableCell>
                    {r.activa ? <Badge variant="success">Activa</Badge> : <Badge>Inactiva</Badge>}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => toggleRegla(r.id)}>
                      {r.activa ? 'Desactivar' : 'Activar'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {reglas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-16 text-center text-stone-500">
                    No hay reglas. Se crean al corregir consultas marcadas como malas.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
