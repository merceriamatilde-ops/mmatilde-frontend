import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Sparkles,
  ChevronRight,
  MessageCircle,
  RotateCcw,
  CheckCircle2,
  Loader2,
  ImagePlus,
  X,
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import ReactGA from 'react-ga4';
import {
  consultarIA,
  registrarConsultaEnBO,
  type ConsultaContexto,
  type ConsultaResponse,
  type PreguntaIA,
  type ProgresoConsulta,
} from '../../api/iaClient';
import { api } from '../../api/client';
import { compressImageForUpload } from '../../lib/imageCompress';
import {
  getStoreUrl,
  getProductUrl,
  buildWhatsAppMaterialesUrl,
} from '../../lib/storeUrl';

type Paso = 'inicio' | 'refinando' | 'resultado';

const SESSION_KEY = 'matilde_ia_session';

const MENSAJES_SIN_DATOS = [
  'Si no me das información, no puedo recomendarte nada — ¡ni yo soy adivina!',
  '¡Ey! Sin datos no hay magia con la lana 🧶 Contame un poquito tu proyecto.',
  'Estoy muy buena con las lanas, pero adivinar no es lo mío. ¿Qué querés hacer?',
  'Mirá, sin al menos una pista no te puedo armar la lista de materiales 😊',
];

function mensajeSinDatos(): string {
  return MENSAJES_SIN_DATOS[Math.floor(Math.random() * MENSAJES_SIN_DATOS.length)];
}

function hayContextoMinimo(ctx: ConsultaContexto, tieneImagen: boolean): boolean {
  return Boolean(
    ctx.descripcion_inicial.trim()
    || tieneImagen
    || ctx.respuestas.length > 0
    || ctx.notas_adicionales.length > 0,
  );
}

interface SessionData {
  paso: Paso;
  descripcion: string;
  contexto: ConsultaContexto;
  respuesta: ConsultaResponse | null;
}

function loadSession(): Partial<SessionData> | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(data: Partial<SessionData>) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch {
    /* quota exceeded — ignore */
  }
}

function tituloRefinamiento(progreso: ProgresoConsulta): string {
  if (progreso.ultimo_paso) return '¡Ya casi! Falta poco';
  if (progreso.pasos_restantes >= 2) return 'Necesitamos algunos datos más';
  return 'Confirmemos los detalles';
}

function porcentajeProgreso(progreso: ProgresoConsulta): number {
  const c = progreso.confirmado.length;
  const f = progreso.falta.length;
  if (c + f === 0) return 25;
  return Math.round((c / (c + f)) * 100);
}

export function EstimadorIAPage() {
  const [paso, setPaso] = useState<Paso>('inicio');
  const [descripcion, setDescripcion] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [contexto, setContexto] = useState<ConsultaContexto>({
    descripcion_inicial: '',
    respuestas: [],
    notas_adicionales: [],
  });
  const [respuesta, setRespuesta] = useState<ConsultaResponse | null>(null);
  const [seleccionActual, setSeleccionActual] = useState<Record<string, string>>({});
  const [notaExtra, setNotaExtra] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [whatsapp, setWhatsapp] = useState('+5493435190082');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getConfiguracion().then((cfg) => {
      if (cfg.whatsapp) setWhatsapp(cfg.whatsapp);
    }).catch(() => {});

    const saved = loadSession();
    if (saved?.paso && saved.paso !== 'inicio') {
      if (saved.descripcion) setDescripcion(saved.descripcion);
      if (saved.contexto) setContexto(saved.contexto);
      if (saved.respuesta) setRespuesta(saved.respuesta);
      if (saved.paso === 'resultado' && saved.respuesta?.estado === 'listo') {
        setPaso('resultado');
      } else if (saved.respuesta) {
        setPaso('refinando');
      }
    }
  }, []);

  useEffect(() => {
    saveSession({ paso, descripcion, contexto, respuesta });
  }, [paso, descripcion, contexto, respuesta]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const compressed = await compressImageForUpload(file);
      setImageFile(compressed);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(URL.createObjectURL(compressed));
    } catch {
      setError('No pudimos procesar la foto. Probá con otra imagen.');
    }
  };

  const quitarImagen = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const llamarIA = async (
    ctx: ConsultaContexto,
    img: File | null,
  ): Promise<ConsultaResponse> => {
    setCargando(true);
    setError(null);
    try {
      const result = await consultarIA(ctx, img);
      setRespuesta(result);
      setSeleccionActual({});

      if (result.estado === 'listo') {
        setPaso('resultado');
        ReactGA.event({ category: 'IA', action: 'Resultado_Completo' });
        registrarConsultaEnBO(ctx, result).catch((err) => {
          console.warn('[IA] No se pudo guardar la consulta en el BO:', err);
        });
      } else {
        setPaso('refinando');
        ReactGA.event({ category: 'IA', action: 'Refinamiento' });
      }
      return result;
    } catch (err) {
      const msg =
        err instanceof Error && err.name === 'AbortError'
          ? 'La consulta tardó demasiado. Revisá tu conexión e intentá de nuevo.'
          : err instanceof Error
            ? err.message
            : 'Hubo un problema técnico. Intentá de nuevo en unos segundos.';
      setError(msg);
      throw err;
    } finally {
      setCargando(false);
    }
  };

  const analizarProyecto = async () => {
    if (!descripcion.trim() && !imageFile) {
      setError('Contanos qué querés hacer o subí una foto de referencia.');
      return;
    }
    const ctx: ConsultaContexto = {
      descripcion_inicial: descripcion.trim(),
      respuestas: [],
      notas_adicionales: [],
      paso_refinamiento: 0,
    };
    setContexto(ctx);
    ReactGA.event({ category: 'IA', action: 'Analizar_Inicio', label: imageFile ? 'con_foto' : 'solo_texto' });
    try {
      await llamarIA(ctx, imageFile);
    } catch {
      /* error ya mostrado en pantalla */
    }
  };

  const confirmarRespuestas = async (forzarAproximado = false) => {
    if (!respuesta) return;

    const haySeleccion = Object.keys(seleccionActual).length > 0;
    const hayNota = notaExtra.trim().length > 0;
    const hayAlgoNuevo = haySeleccion || hayNota;

    if (!hayAlgoNuevo && !forzarAproximado) {
      if (!hayContextoMinimo(contexto, Boolean(imageFile))) {
        setError(mensajeSinDatos());
        return;
      }
      forzarAproximado = true;
    }

    const nuevasRespuestas = [...contexto.respuestas];
    for (const pregunta of respuesta.preguntas) {
      const valor = seleccionActual[pregunta.id];
      if (valor) {
        nuevasRespuestas.push({
          id: pregunta.id,
          pregunta: pregunta.pregunta,
          respuesta: valor,
        });
      }
    }

    const notas = [...contexto.notas_adicionales];
    if (notaExtra.trim()) notas.push(notaExtra.trim());

    const todasRespondidas = respuesta.preguntas.length === 0
      || respuesta.preguntas.every((p) => seleccionActual[p.id]);
    const aceptaAproximado = forzarAproximado
      || (respuesta.preguntas.length > 0 && !todasRespondidas);

    const ctx: ConsultaContexto = {
      ...contexto,
      respuestas: nuevasRespuestas,
      notas_adicionales: notas,
      paso_refinamiento: (contexto.paso_refinamiento ?? 0) + 1,
      acepta_aproximado: aceptaAproximado,
    };
    setContexto(ctx);
    setNotaExtra('');
    try {
      await llamarIA(ctx, imageFile);
    } catch {
      /* error ya mostrado en pantalla */
    }
  };

  const reiniciar = () => {
    setPaso('inicio');
    setDescripcion('');
    setContexto({ descripcion_inicial: '', respuestas: [], notas_adicionales: [] });
    setRespuesta(null);
    setSeleccionActual({});
    setNotaExtra('');
    setError(null);
    quitarImagen();
    sessionStorage.removeItem(SESSION_KEY);
    ReactGA.event({ category: 'IA', action: 'Nuevo_Proyecto' });
  };

  const storeUrl = getStoreUrl();
  const pasoNumero = paso === 'inicio' ? 1 : paso === 'refinando' ? 2 : 3;
  const progreso = respuesta?.progreso;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans flex flex-col">
      <Helmet>
        <title>Asistente de Materiales | Mercería Matilde</title>
        <meta name="description" content="Subí una foto o contanos tu proyecto y te ayudamos a calcular los materiales que necesitás." />
      </Helmet>

      {/* Header */}
      <header className="border-b border-stone-200 bg-white sticky top-0 z-50 shrink-0 shadow-sm">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-600" aria-hidden />
            <span className="font-outfit font-bold text-lg text-brand-800">
              Matilde<span className="text-brand-500">.IA</span>
            </span>
          </div>
          <a
            href={storeUrl}
            className="text-sm font-medium text-brand-700 hover:text-brand-900 underline-offset-2 hover:underline"
          >
            Ir a la tienda
          </a>
        </div>
      </header>

      {/* Progress */}
      <div className="bg-white border-b border-stone-100 py-3 shrink-0">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex items-center justify-between text-sm">
            {(['Tu proyecto', 'Detalles', 'Materiales'] as const).map((label, i) => {
              const n = i + 1;
              const activo = pasoNumero >= n;
              const actual = pasoNumero === n;
              return (
                <div key={label} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-1 transition-colors ${
                      actual
                        ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                        : activo
                          ? 'bg-brand-600 text-white'
                          : 'bg-stone-200 text-stone-500'
                    }`}
                  >
                    {activo && pasoNumero > n ? <CheckCircle2 size={18} /> : n}
                  </div>
                  <span className={`text-xs text-center ${actual ? 'font-semibold text-brand-800' : 'text-stone-500'}`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {paso === 'refinando' && progreso && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-stone-500 mb-1">
                <span>
                  {progreso.ultimo_paso
                    ? 'Con esto ya calculamos los materiales'
                    : `Aprox. ${progreso.pasos_restantes} paso${progreso.pasos_restantes > 1 ? 's' : ''} más`}
                </span>
                <span>{porcentajeProgreso(progreso)}%</span>
              </div>
              <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all duration-500"
                  style={{ width: `${porcentajeProgreso(progreso)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 pb-28">
        {/* Error banner */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 text-base" role="alert">
            {error}
          </div>
        )}

        {/* PASO 1: Inicio */}
        {paso === 'inicio' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-2xl font-bold font-outfit text-stone-900 leading-tight">
                ¿Qué proyecto tenés en mente?
              </h1>
              <p className="mt-2 text-base text-stone-600 leading-relaxed">
                Subí una foto o contanos con tus palabras. Te ayudamos a calcular los materiales y te mostramos productos de nuestra tienda.
              </p>
            </div>

            {/* Foto */}
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">
                Foto de referencia <span className="font-normal text-stone-400">(opcional)</span>
              </label>
              {imagePreview ? (
                <div className="relative rounded-2xl border-2 border-brand-200 bg-stone-100 h-56 flex items-center justify-center p-2">
                  <img
                    src={imagePreview}
                    alt="Tu referencia"
                    className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg border border-stone-200 bg-white shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={quitarImagen}
                    className="absolute top-3 right-3 bg-white/90 text-stone-700 rounded-full p-2 shadow-md hover:bg-white"
                    aria-label="Quitar foto"
                  >
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-3 py-10 rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50/50 hover:bg-brand-50 active:bg-brand-100 transition-colors"
                >
                  <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center">
                    <Camera size={28} className="text-brand-600" />
                  </div>
                  <span className="text-base font-semibold text-brand-800">Sacar o elegir foto</span>
                  <span className="text-sm text-stone-500">De un modelo, revista o tu proyecto</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageSelect}
              />
            </div>

            {/* Descripción */}
            <div>
              <label htmlFor="descripcion" className="block text-sm font-semibold text-stone-700 mb-2">
                Contanos tu proyecto
              </label>
              <textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej: Quiero tejer un chaleco para mi nieto de 1 año con lana suave"
                rows={4}
                className="w-full text-base leading-relaxed rounded-2xl border-2 border-stone-200 bg-white px-4 py-3 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 resize-none placeholder:text-stone-400"
              />
            </div>

            <button
              type="button"
              onClick={analizarProyecto}
              disabled={cargando || (!descripcion.trim() && !imageFile)}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-brand-600 text-white text-lg font-semibold hover:bg-brand-700 active:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
            >
              {cargando ? (
                <>
                  <Loader2 size={22} className="animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  Analizar mi proyecto
                  <ChevronRight size={22} />
                </>
              )}
            </button>
          </div>
        )}

        {/* PASO 2: Refinamiento con chips */}
        {paso === 'refinando' && respuesta && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h1 className="text-xl font-bold font-outfit text-stone-900">
                {tituloRefinamiento(respuesta.progreso)}
              </h1>
              {respuesta.progreso.falta.length > 0 && (
                <p className="mt-1 text-sm text-stone-600 leading-relaxed">
                  Para calcular materiales necesitamos:{' '}
                  <span className="font-medium text-stone-800">{respuesta.progreso.falta.join(' · ')}</span>
                </p>
              )}
            </div>

            <ProgresoChecklist progreso={respuesta.progreso} />

            <MensajeAsistente texto={respuesta.mensaje} />

            {respuesta.resumen.proyecto && (
              <ResumenCard resumen={respuesta.resumen} imagen={imagePreview} />
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <label htmlFor="nota-extra" className="block text-sm font-semibold text-amber-900 mb-1">
                Escribilo con tus palabras
              </label>
              <p className="text-xs text-amber-800/80 mb-2">
                Todo es opcional. Completá solo lo que sepas — con una frase alcanza.
              </p>
              <input
                id="nota-extra"
                type="text"
                value={notaExtra}
                onChange={(e) => { setNotaExtra(e.target.value); setError(null); }}
                placeholder="Ej: Amigurumi de osito, 15 cm, hilo algodón nº 5, crochet 3 mm"
                className="w-full text-base rounded-xl border-2 border-amber-200 bg-white px-4 py-3 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            {respuesta.preguntas.length > 0 && (
              <p className="text-sm text-stone-500">
                Opcional — elegí solo lo que sepas:
              </p>
            )}

            {respuesta.preguntas.map((pregunta, idx) => (
              <PreguntaChips
                key={pregunta.id}
                pregunta={pregunta}
                numero={respuesta.preguntas.length > 1 ? idx + 1 : undefined}
                seleccion={seleccionActual[pregunta.id]}
                onSelect={(label) => {
                  setError(null);
                  setSeleccionActual((prev) => ({ ...prev, [pregunta.id]: label }));
                }}
              />
            ))}

            <button
              type="button"
              onClick={() => confirmarRespuestas()}
              disabled={cargando}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-brand-600 text-white text-lg font-semibold hover:bg-brand-700 active:bg-brand-800 disabled:opacity-50 transition-colors shadow-md"
            >
              {cargando ? (
                <>
                  <Loader2 size={22} className="animate-spin" />
                  Buscando opciones...
                </>
              ) : (
                <>
                  Ver recomendaciones
                  <ChevronRight size={22} />
                </>
              )}
            </button>

            {hayContextoMinimo(contexto, Boolean(imageFile)) && respuesta.progreso.falta.length > 0 && (
              <button
                type="button"
                onClick={() => confirmarRespuestas(true)}
                disabled={cargando}
                className="w-full text-center text-sm text-brand-700 hover:text-brand-900 py-2 underline-offset-2 hover:underline"
              >
                Saltar y ver opciones con lo que tengo
              </button>
            )}

            <button
              type="button"
              onClick={reiniciar}
              className="w-full text-center text-sm text-stone-500 hover:text-stone-700 py-2"
            >
              Empezar de nuevo
            </button>
          </div>
        )}

        {/* PASO 3: Resultado */}
        {paso === 'resultado' && respuesta?.resultado && (
          <div className="space-y-6 animate-fade-in">
            <MensajeAsistente texto={respuesta.mensaje} />

            {respuesta.resultado.completitud === 'aproximada' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-900 leading-relaxed">
                Recomendación orientativa: faltaron algunos detalles, así que te mostramos varias opciones posibles. En la mercería te ayudamos a afinar.
              </div>
            )}

            <div className="bg-white rounded-2xl border-2 border-brand-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="text-brand-500" size={20} />
                <h2 className="text-xl font-bold font-outfit text-brand-900">
                  {respuesta.resultado.completitud === 'aproximada'
                    ? 'Opciones de materiales'
                    : 'Materiales estimados'}
                </h2>
              </div>

              {respuesta.resultado.tecnica_detectada && (
                <div className="mb-4">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Técnica</span>
                  <p className="mt-1 text-base font-medium text-stone-800 bg-stone-50 rounded-lg px-3 py-2 inline-block">
                    {respuesta.resultado.tecnica_detectada}
                  </p>
                </div>
              )}

              <ul className="space-y-3">
                {respuesta.resultado.insumos.map((insumo, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 bg-stone-50 rounded-xl p-4 border border-stone-100"
                  >
                    <span className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-base text-stone-800 leading-relaxed">{insumo.descripcion}</span>
                  </li>
                ))}
              </ul>

              {respuesta.resultado.nota && (
                <p className="mt-4 text-sm text-stone-500 leading-relaxed border-t border-stone-100 pt-3">
                  {respuesta.resultado.nota}
                </p>
              )}
            </div>

            {/* Productos sugeridos */}
            {respuesta.productos_sugeridos.length > 0 && (
              <div>
                <h2 className="text-xl font-bold font-outfit text-stone-900 mb-3">
                  Productos en nuestra tienda
                </h2>
                <div className="space-y-3">
                  {respuesta.productos_sugeridos.map((prod) => (
                    <a
                      key={prod.id}
                      href={getProductUrl(prod.slug)}
                      className="flex items-center gap-4 bg-white rounded-2xl border border-stone-200 p-3 hover:border-brand-300 hover:shadow-sm transition-all active:scale-[0.99]"
                    >
                      <div className="w-16 h-16 rounded-xl bg-stone-50 border border-stone-100 shrink-0 overflow-hidden flex items-center justify-center">
                        {prod.imagen_url ? (
                          <img src={prod.imagen_url} alt={prod.nombre} className="w-full h-full object-contain p-1" />
                        ) : (
                          <ImagePlus size={24} className="text-stone-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-stone-500">{prod.categoria}</p>
                        <p className="text-base font-medium text-brand-800 leading-snug line-clamp-2">{prod.nombre}</p>
                      </div>
                      <ChevronRight size={20} className="text-stone-400 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {respuesta.productos_sugeridos.length === 0 && (
              <p className="text-base text-stone-600 bg-amber-50 border border-amber-200 rounded-xl p-4">
                No encontramos coincidencias exactas en el catálogo online, pero podés consultarnos por WhatsApp con la lista de materiales.
              </p>
            )}

            {/* CTAs */}
            <div className="space-y-3 pt-2">
              <a
                href={buildWhatsAppMaterialesUrl(
                  whatsapp,
                  respuesta.resumen.proyecto || descripcion,
                  respuesta.resultado.insumos.map((i) => i.descripcion),
                )}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => ReactGA.event({ category: 'IA', action: 'WhatsApp_Resultado' })}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-green-600 text-white text-lg font-semibold hover:bg-green-700 active:bg-green-800 transition-colors shadow-md"
              >
                <MessageCircle size={22} />
                Consultar por WhatsApp
              </a>

              <button
                type="button"
                onClick={reiniciar}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-stone-200 text-stone-700 text-base font-medium hover:bg-stone-50 transition-colors"
              >
                <RotateCcw size={18} />
                Nuevo proyecto
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function MensajeAsistente({ texto }: { texto: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center shrink-0">
        <Sparkles size={18} className="text-white" />
      </div>
      <div className="bg-white border border-brand-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex-1">
        <p className="text-base text-stone-800 leading-relaxed">{texto}</p>
      </div>
    </div>
  );
}

function ResumenCard({
  resumen,
  imagen,
}: {
  resumen: ConsultaResponse['resumen'];
  imagen: string | null;
}) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-4">
      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Lo que entendimos</p>
      <div className="flex gap-3">
        {imagen && (
          <img src={imagen} alt="" className="w-16 h-16 rounded-lg object-contain shrink-0 border border-stone-200 bg-stone-50 p-0.5" />
        )}
        <div className="text-base text-stone-800 space-y-1">
          {resumen.proyecto && <p><strong>Proyecto:</strong> {resumen.proyecto}</p>}
          {resumen.tecnica && <p><strong>Técnica:</strong> {resumen.tecnica}</p>}
          {resumen.detalles.map((d, i) => (
            <p key={i} className="text-stone-600 text-sm">· {d}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProgresoChecklist({ progreso }: { progreso: ProgresoConsulta }) {
  if (progreso.confirmado.length === 0 && progreso.falta.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3">
      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Tu proyecto</p>
      {progreso.confirmado.map((item, i) => (
        <div key={`ok-${i}`} className="flex items-start gap-2 text-sm text-stone-700">
          <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
          <span>{item}</span>
        </div>
      ))}
      {progreso.falta.map((item, i) => (
        <div key={`falta-${i}`} className="flex items-start gap-2 text-sm text-stone-600">
          <span className="w-4 h-4 rounded-full border-2 border-amber-400 shrink-0 mt-0.5" />
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

function PreguntaChips({
  pregunta,
  numero,
  seleccion,
  onSelect,
}: {
  pregunta: PreguntaIA;
  numero?: number;
  seleccion?: string;
  onSelect: (label: string) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-4">
      <p className="text-base font-semibold text-stone-800 mb-3">
        {numero !== undefined && (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold mr-2">
            {numero}
          </span>
        )}
        {pregunta.pregunta}
      </p>
      <div className="flex flex-wrap gap-2">
        {pregunta.opciones.map((opt) => {
          const activa = seleccion === opt.label;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelect(opt.label)}
              className={`min-h-[48px] px-4 py-2 rounded-xl text-base font-medium border-2 transition-all active:scale-95 ${
                activa
                  ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                  : 'bg-white text-stone-700 border-stone-200 hover:border-brand-300'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
