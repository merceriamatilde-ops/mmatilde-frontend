import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Wand2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../../api/client';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { formatPrice } from '../../lib/utils';
import { toast } from 'sonner';

const UNIDADES = [
  { value: 'g', label: 'Gramos (g)' },
  { value: 'kg', label: 'Kilogramos (kg)' },
  { value: 'cm', label: 'Centímetros (cm)' },
  { value: 'm', label: 'Metros (m)' },
  { value: 'ml', label: 'Mililitros (ml)' },
  { value: 'l', label: 'Litros (l)' },
  { value: 'unidad', label: 'Unidades' },
  { value: 'par', label: 'Pares' },
  { value: 'docena', label: 'Docenas' },
];

const MODOS_ORIGEN = [
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

const MODOS_PRECIO_REVENTA = [
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

type ModoOrigenEconomico = (typeof MODOS_ORIGEN)[number]['value'];
type ModoPrecio = 'AUTOMATICO' | 'EXCEPCION' | 'PRECIO_FIJO';

type GananciaEstimada = {
  costoReferencia?: number | null;
  gananciaNetaEstimada?: number | null;
  margenSobreVentaPorcentaje?: number | null;
  nota: string;
};

type Presentacion = {
  id?: number | null;
  nombre: string;
  cantidadUnidadBase: number;
  precioVenta?: number | null;
  margenPorcentaje?: number | null;
  precioCalculado?: number | null;
  esDefault: boolean;
  activo: boolean;
  orden: number;
};

const GUIA: Record<
  ModoOrigenEconomico,
  { titulo: string; pasos: string[] }
> = {
  REVENTA: {
    titulo: 'Reventa — Makor o compra para revender',
    pasos: [
      'Elegí Automático (lo normal) o Excepción si este producto tiene margen distinto.',
      'Configurá unidad de compra si vendés en fracciones (ej. lana por gramo).',
      'El precio de venta se calcula solo; podés recalcular con el botón.',
    ],
  },
  CONSIGNACION: {
    titulo: 'Consignación — producto de un tercero',
    pasos: [
      'Indicá qué % se queda la mercería y quién es el titular.',
      'Cargá el precio de venta acordado (sección abajo).',
      'La ganancia = ese % del precio; el resto es del titular.',
    ],
  },
  ELABORACION_PROPIA: {
    titulo: 'Elaboración propia — tejido, costura, etc.',
    pasos: [
      'Anotá costo de materiales y mano de obra (referencia interna).',
      'Cargá el precio de venta que quieras cobrar (no tiene que sumar materiales + MO).',
      'La ganancia estimada ≈ mano de obra.',
    ],
  },
  SIN_COSTO: {
    titulo: 'Sin costo — regalo o donación',
    pasos: [
      'Solo cargá el precio de venta en la sección de abajo.',
      'Ganancia = 100% del precio.',
    ],
  },
};

function asegurarPresentacionDefault(prev: Presentacion[]): Presentacion[] {
  if (prev.length > 0) return prev;
  return [
    {
      nombre: 'Unidad',
      cantidadUnidadBase: 1,
      precioVenta: null,
      esDefault: true,
      activo: true,
      orden: 0,
    },
  ];
}

type ProductoPreciosSectionProps = {
  productoId: number;
  nombreProducto: string;
};

export function ProductoPreciosSection({ productoId, nombreProducto }: ProductoPreciosSectionProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unidadBase, setUnidadBase] = useState('');
  const [cantidadCompra, setCantidadCompra] = useState('');
  const [etiquetaCompra, setEtiquetaCompra] = useState('');
  const [autoDetectada, setAutoDetectada] = useState(false);
  const [precioCompra, setPrecioCompra] = useState<number | null>(null);
  const [costoBase, setCostoBase] = useState<number | null>(null);
  const [iva, setIva] = useState(21);
  const [margen, setMargen] = useState(115);
  const [ivaGlobal, setIvaGlobal] = useState(21);
  const [margenGlobal, setMargenGlobal] = useState(115);
  const [modoPrecio, setModoPrecio] = useState<ModoPrecio>('AUTOMATICO');
  const [ivaProducto, setIvaProducto] = useState('');
  const [margenProducto, setMargenProducto] = useState('');
  const [modoOrigen, setModoOrigen] = useState<ModoOrigenEconomico>('REVENTA');
  const [comisionTienda, setComisionTienda] = useState('');
  const [titularConsignacion, setTitularConsignacion] = useState('');
  const [costoMateriales, setCostoMateriales] = useState('');
  const [manoObra, setManoObra] = useState('');
  const [gananciaEstimada, setGananciaEstimada] = useState<GananciaEstimada | null>(null);
  const [presentaciones, setPresentaciones] = useState<Presentacion[]>([]);
  const [mostrarPrecioFijoReventa, setMostrarPrecioFijoReventa] = useState(false);

  const esReventa = modoOrigen === 'REVENTA';
  const esConsignacion = modoOrigen === 'CONSIGNACION';
  const esElaboracion = modoOrigen === 'ELABORACION_PROPIA';
  const esSinCosto = modoOrigen === 'SIN_COSTO';
  const esPrecioFijo = modoPrecio === 'PRECIO_FIJO';
  const esExcepcion = modoPrecio === 'EXCEPCION';
  const usaFormula = esReventa && !esPrecioFijo;
  const usaPrecioManual = !usaFormula;
  const guia = GUIA[modoOrigen];

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getProductoPrecios(productoId);
      const origen = (data.modoOrigenEconomico || 'REVENTA') as ModoOrigenEconomico;
      const precio = (data.modoPrecio || 'AUTOMATICO') as ModoPrecio;

      setUnidadBase(data.unidadBase || '');
      setCantidadCompra(data.cantidadUnidadCompra?.toString() || '');
      setEtiquetaCompra(data.etiquetaUnidadCompra || '');
      setAutoDetectada(data.unidadCompraAutoDetectada);
      setPrecioCompra(data.precioCompra);
      setCostoBase(data.costoPorUnidadBase);
      setIva(data.ivaPorcentaje);
      setMargen(data.margenAplicado);
      setIvaGlobal(data.ivaGlobal ?? 21);
      setMargenGlobal(data.margenGlobal ?? 115);
      setModoOrigen(origen);
      setModoPrecio(origen !== 'REVENTA' ? 'PRECIO_FIJO' : precio);
      setMostrarPrecioFijoReventa(origen === 'REVENTA' && precio === 'PRECIO_FIJO');
      setIvaProducto(
        data.ivaPorcentajeProducto != null ? data.ivaPorcentajeProducto.toString() : ''
      );
      setMargenProducto(
        data.margenPorcentajeProducto != null ? data.margenPorcentajeProducto.toString() : ''
      );
      setComisionTienda(
        data.comisionTiendaPorcentaje != null ? data.comisionTiendaPorcentaje.toString() : ''
      );
      setTitularConsignacion(data.titularConsignacion || '');
      setCostoMateriales(data.costoMateriales != null ? data.costoMateriales.toString() : '');
      setManoObra(data.manoObra != null ? data.manoObra.toString() : '');
      setGananciaEstimada(data.gananciaEstimada || null);
      setPresentaciones(
        origen !== 'REVENTA' || precio === 'PRECIO_FIJO'
          ? asegurarPresentacionDefault(data.presentaciones || [])
          : data.presentaciones || []
      );
    } catch (err: any) {
      console.error(err);
      if (err?.status === 404) {
        toast.error('No se encontró la API de precios. ¿Está corriendo el backend local?');
      } else {
        toast.error('Error al cargar precios del producto');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [productoId]);

  const aplicarPrecioFijo = () => {
    if (!ivaProducto) setIvaProducto('0');
    setPresentaciones((prev) => asegurarPresentacionDefault(prev));
  };

  const handleOrigenChange = (origen: ModoOrigenEconomico) => {
    setModoOrigen(origen);
    if (origen !== 'REVENTA') {
      setModoPrecio('PRECIO_FIJO');
      setMostrarPrecioFijoReventa(false);
      aplicarPrecioFijo();
    } else if (modoPrecio === 'PRECIO_FIJO' && !mostrarPrecioFijoReventa) {
      setModoPrecio('AUTOMATICO');
    }
  };

  const handleModoReventaChange = (modo: 'AUTOMATICO' | 'EXCEPCION') => {
    setModoPrecio(modo);
    setMostrarPrecioFijoReventa(false);
  };

  const activarPrecioFijoReventa = () => {
    setModoPrecio('PRECIO_FIJO');
    setMostrarPrecioFijoReventa(true);
    aplicarPrecioFijo();
  };

  const volverAFormula = () => {
    setModoPrecio('AUTOMATICO');
    setMostrarPrecioFijoReventa(false);
  };

  const handleDetectar = async () => {
    try {
      const sug = await api.detectarUnidadProducto(productoId);
      setUnidadBase(sug.unidadBase);
      setCantidadCompra(sug.cantidadUnidadCompra.toString());
      setEtiquetaCompra(sug.etiqueta);
      setAutoDetectada(true);
      toast.success(sug.confiable ? 'Unidad detectada del título' : 'Unidad detectada (revisá si es correcta)');
    } catch {
      toast.error('No se pudo detectar unidad en el título');
    }
  };

  const buildPayload = (recalcular: boolean) => ({
    unidadBase: unidadBase || null,
    cantidadUnidadCompra: cantidadCompra ? parseFloat(cantidadCompra) : null,
    etiquetaUnidadCompra: etiquetaCompra || null,
    unidadCompraAutoDetectada: autoDetectada,
    modoPrecio: esReventa ? modoPrecio : 'PRECIO_FIJO',
    ivaPorcentajeProducto:
      esPrecioFijo
        ? ivaProducto !== ''
          ? parseFloat(ivaProducto)
          : 0
        : esExcepcion && ivaProducto !== ''
          ? parseFloat(ivaProducto)
          : null,
    margenPorcentajeProducto:
      esExcepcion && margenProducto !== '' ? parseFloat(margenProducto) : null,
    modoOrigenEconomico: modoOrigen,
    comisionTiendaPorcentaje:
      esConsignacion && comisionTienda !== '' ? parseFloat(comisionTienda) : null,
    titularConsignacion: esConsignacion ? titularConsignacion.trim() || null : null,
    costoMateriales: esElaboracion && costoMateriales !== '' ? parseFloat(costoMateriales) : null,
    manoObra: esElaboracion && manoObra !== '' ? parseFloat(manoObra) : null,
    presentaciones: presentaciones.map((p, i) => ({
      id: p.id,
      nombre: p.nombre,
      cantidadUnidadBase: p.cantidadUnidadBase,
      precioVenta: p.precioVenta,
      margenPorcentaje: usaFormula ? p.margenPorcentaje : null,
      esDefault: p.esDefault,
      activo: p.activo,
      orden: i,
    })),
    recalcularPrecios: recalcular && usaFormula,
  });

  const handleSave = async (recalcular = true) => {
    setSaving(true);
    try {
      const data = await api.updateProductoPrecios(productoId, buildPayload(recalcular));
      setCostoBase(data.costoPorUnidadBase);
      setIva(data.ivaPorcentaje);
      setMargen(data.margenAplicado);
      setGananciaEstimada(data.gananciaEstimada || null);
      setPresentaciones(data.presentaciones || []);
      toast.success('Precios guardados');
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar precios');
    } finally {
      setSaving(false);
    }
  };

  const addPresentacion = () => {
    setPresentaciones([
      ...presentaciones,
      {
        nombre: usaPrecioManual ? 'Unidad' : '',
        cantidadUnidadBase: 1,
        esDefault: presentaciones.length === 0,
        activo: true,
        orden: presentaciones.length,
      },
    ]);
  };

  const updatePres = (index: number, patch: Partial<Presentacion>) => {
    setPresentaciones((prev) =>
      prev.map((p, i) => {
        if (i !== index) {
          if (patch.esDefault) return { ...p, esDefault: false };
          return p;
        }
        return { ...p, ...patch };
      })
    );
  };

  if (loading) {
    return <p className="text-sm text-stone-500">Cargando unidades y precios…</p>;
  }

  return (
    <div className="space-y-5 rounded-xl border border-stone-200 bg-stone-50/50 p-4">
      <div>
        <h3 className="font-outfit text-base font-semibold text-stone-900">Precios y ganancia</h3>
        <p className="mt-0.5 text-xs text-stone-500 truncate" title={nombreProducto}>
          {nombreProducto}
        </p>
      </div>

      {/* Paso 1 — Tipo */}
      <section className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-4">
        <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-800">Paso 1</p>
        <h4 className="text-sm font-semibold text-stone-900">¿Qué tipo de producto es?</h4>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {MODOS_ORIGEN.map((m) => (
            <label
              key={m.value}
              className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                modoOrigen === m.value
                  ? 'border-emerald-500 bg-white shadow-sm'
                  : 'border-stone-200 bg-white/60 hover:border-stone-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`modo-origen-${productoId}`}
                  checked={modoOrigen === m.value}
                  onChange={() => handleOrigenChange(m.value)}
                />
                <span className="text-sm font-medium text-stone-900">
                  {m.emoji} {m.label}
                </span>
              </div>
              <p className="mt-1 pl-6 text-[11px] leading-snug text-stone-500">{m.hint}</p>
            </label>
          ))}
        </div>

        <div className="mt-3 rounded-lg border border-emerald-300/60 bg-white/80 p-3">
          <p className="text-xs font-semibold text-emerald-900">{guia.titulo}</p>
          <ol className="mt-1.5 list-decimal space-y-0.5 pl-4 text-[11px] text-stone-600">
            {guia.pasos.map((paso) => (
              <li key={paso}>{paso}</li>
            ))}
          </ol>
        </div>
      </section>

      {/* Paso 2 — Detalles origen */}
      {(esConsignacion || esElaboracion) && (
        <section className="rounded-lg border border-stone-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500">Paso 2</p>
          <h4 className="text-sm font-semibold text-stone-900">Detalles para calcular ganancia</h4>

          {esConsignacion && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">
                  % que retiene la mercería
                </label>
                <Input
                  type="number"
                  step="any"
                  value={comisionTienda}
                  onChange={(e) => setComisionTienda(e.target.value)}
                  placeholder="Ej: 30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">Titular (dueño/a)</label>
                <Input
                  value={titularConsignacion}
                  onChange={(e) => setTitularConsignacion(e.target.value)}
                  placeholder="Ej: Tía María — cerámica"
                />
              </div>
            </div>
          )}

          {esElaboracion && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">Costo materiales ($)</label>
                <Input
                  type="number"
                  step="any"
                  value={costoMateriales}
                  onChange={(e) => setCostoMateriales(e.target.value)}
                  placeholder="Ej: 4000"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">Mano de obra ($)</label>
                <Input
                  type="number"
                  step="any"
                  value={manoObra}
                  onChange={(e) => setManoObra(e.target.value)}
                  placeholder="Ej: 6000"
                />
              </div>
            </div>
          )}
        </section>
      )}

      {/* Paso 2/3 — Política solo reventa */}
      {esReventa && (
        <section className="rounded-lg border border-brand-200 bg-brand-50/40 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-brand-800">Paso 2</p>
          <h4 className="text-sm font-semibold text-stone-900">¿Cómo calculamos el precio de venta?</h4>

          {!mostrarPrecioFijoReventa ? (
            <>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {MODOS_PRECIO_REVENTA.map((m) => (
                  <label
                    key={m.value}
                    className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                      modoPrecio === m.value
                        ? 'border-brand-500 bg-white shadow-sm'
                        : 'border-stone-200 bg-white/60 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`modo-precio-${productoId}`}
                        checked={modoPrecio === m.value}
                        onChange={() => handleModoReventaChange(m.value)}
                      />
                      <span className="text-sm font-medium text-stone-900">{m.label}</span>
                    </div>
                    <p className="mt-1 pl-6 text-[11px] leading-snug text-stone-500">{m.hint}</p>
                  </label>
                ))}
              </div>

              {esExcepcion && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-stone-600">IVA % (producto)</label>
                    <Input
                      type="number"
                      step="any"
                      value={ivaProducto}
                      onChange={(e) => setIvaProducto(e.target.value)}
                      placeholder={`Global: ${ivaGlobal}%`}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-stone-600">Margen % (producto)</label>
                    <Input
                      type="number"
                      step="any"
                      value={margenProducto}
                      onChange={(e) => setMargenProducto(e.target.value)}
                      placeholder={`Global: ${margenGlobal}%`}
                    />
                  </div>
                </div>
              )}

              {modoPrecio === 'AUTOMATICO' && (
                <p className="mt-3 text-xs text-stone-500">
                  IVA global: {ivaGlobal}% · Margen global: {margenGlobal}%
                  {margen !== margenGlobal && (
                    <span className="text-brand-700"> · Margen de categoría: {margen}%</span>
                  )}
                </p>
              )}

              <button
                type="button"
                onClick={activarPrecioFijoReventa}
                className="mt-3 flex items-center gap-1 text-xs text-stone-500 underline hover:text-stone-700"
              >
                <ChevronDown size={14} />
                Caso especial: quiero poner precio fijo igual (sin fórmula)
              </button>
            </>
          ) : (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs text-amber-900">
                Modo <strong>precio fijo</strong> en reventa — cargás el precio manual abajo.
              </p>
              <button
                type="button"
                onClick={volverAFormula}
                className="mt-2 flex items-center gap-1 text-xs text-brand-700 underline"
              >
                <ChevronUp size={14} />
                Volver a Automático / Excepción
              </button>
            </div>
          )}
        </section>
      )}

      {/* Unidades — solo fórmula */}
      {usaFormula && (
        <section className="rounded-lg border border-stone-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500">Paso 3</p>
              <h4 className="text-sm font-semibold text-stone-900">Unidad de compra y venta</h4>
              <p className="mt-0.5 text-[11px] text-stone-500">
                Para calcular costo por gramo, metro, etc.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleDetectar}>
              <Wand2 size={14} className="mr-1" />
              Detectar del título
            </Button>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Unidad base</label>
              <select
                value={unidadBase}
                onChange={(e) => {
                  setUnidadBase(e.target.value);
                  setAutoDetectada(false);
                }}
                className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">— Elegir —</option>
                {UNIDADES.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Cantidad por paquete</label>
              <Input
                type="number"
                step="any"
                value={cantidadCompra}
                onChange={(e) => {
                  setCantidadCompra(e.target.value);
                  setAutoDetectada(false);
                }}
                placeholder="ej. 1000 (= 1 kg)"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-stone-600">Etiqueta compra</label>
              <Input
                value={etiquetaCompra}
                onChange={(e) => setEtiquetaCompra(e.target.value)}
                placeholder='ej. "1 kg"'
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600">
            <span>
              Precio compra: <strong className="text-stone-900">{formatPrice(precioCompra || 0)}</strong>
            </span>
            {costoBase != null && unidadBase && (
              <span>
                Costo / {unidadBase}: <strong className="text-stone-900">{formatPrice(costoBase)}</strong>
              </span>
            )}
            <span>
              IVA {iva}% · Margen {margen}%
            </span>
          </div>
        </section>
      )}

      {/* Precio de venta */}
      <section className="rounded-lg border border-stone-200 bg-white p-4">
        <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500">
          Paso {usaFormula ? 4 : esReventa ? 3 : esConsignacion || esElaboracion ? 3 : 2}
        </p>
        <h4 className="text-sm font-semibold text-stone-900">
          {usaPrecioManual ? 'Precio de venta (lo cargás vos)' : 'Presentaciones de venta'}
        </h4>
        {usaPrecioManual && (
          <p className="mt-1 text-[11px] text-stone-500">
            Este es el precio del cartel / catálogo. No usa fórmula de margen.
          </p>
        )}

        {usaPrecioManual && presentaciones.length <= 1 ? (
          <div className="mt-3 max-w-xs">
            <label className="mb-1 block text-xs font-medium text-stone-600">Precio final ($)</label>
            <Input
              type="number"
              step="any"
              value={presentaciones[0]?.precioVenta ?? ''}
              onChange={(e) => {
                const val = e.target.value ? parseFloat(e.target.value) : null;
                if (presentaciones.length === 0) {
                  setPresentaciones([
                    {
                      nombre: 'Unidad',
                      cantidadUnidadBase: 1,
                      precioVenta: val,
                      esDefault: true,
                      activo: true,
                      orden: 0,
                    },
                  ]);
                } else {
                  updatePres(0, { precioVenta: val, nombre: presentaciones[0].nombre || 'Unidad' });
                }
              }}
              placeholder="Ej: 10000"
            />
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            <div className="flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={addPresentacion}>
                <Plus size={14} className="mr-1" />
                Agregar
              </Button>
            </div>
            {presentaciones.length === 0 ? (
              <p className="text-sm text-stone-500">Agregá al menos una presentación.</p>
            ) : (
              presentaciones.map((p, i) => (
                <div
                  key={p.id ?? `new-${i}`}
                  className={`grid gap-2 rounded-lg border border-stone-200 bg-stone-50 p-3 ${
                    usaPrecioManual
                      ? 'sm:grid-cols-[1fr_120px_auto]'
                      : 'sm:grid-cols-[1fr_100px_90px_100px_auto]'
                  }`}
                >
                  <Input
                    placeholder={usaPrecioManual ? 'Nombre (ej. Unidad)' : 'Nombre (ej. 100 g)'}
                    value={p.nombre}
                    onChange={(e) => updatePres(i, { nombre: e.target.value })}
                  />
                  {usaFormula && (
                    <>
                      <Input
                        type="number"
                        step="any"
                        placeholder="Cant."
                        value={p.cantidadUnidadBase}
                        onChange={(e) =>
                          updatePres(i, { cantidadUnidadBase: parseFloat(e.target.value) || 0 })
                        }
                      />
                      <Input
                        type="number"
                        step="any"
                        placeholder="Margen %"
                        value={p.margenPorcentaje ?? ''}
                        onChange={(e) =>
                          updatePres(i, {
                            margenPorcentaje: e.target.value ? parseFloat(e.target.value) : null,
                          })
                        }
                      />
                    </>
                  )}
                  {usaPrecioManual ? (
                    <Input
                      type="number"
                      step="any"
                      placeholder="Precio $"
                      value={p.precioVenta ?? ''}
                      onChange={(e) =>
                        updatePres(i, {
                          precioVenta: e.target.value ? parseFloat(e.target.value) : null,
                        })
                      }
                    />
                  ) : (
                    <div className="flex flex-col justify-center">
                      <span className="text-[10px] uppercase text-stone-400">Precio venta</span>
                      <span className="font-semibold text-brand-800">
                        {p.precioVenta != null
                          ? formatPrice(p.precioVenta)
                          : p.precioCalculado != null
                            ? formatPrice(p.precioCalculado)
                            : '—'}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-xs text-stone-600">
                      <input
                        type="radio"
                        name={`default-pres-${productoId}`}
                        checked={p.esDefault}
                        onChange={() => updatePres(i, { esDefault: true })}
                      />
                      Default
                    </label>
                    <Switch checked={p.activo} onCheckedChange={(v) => updatePres(i, { activo: v })} />
                    <button
                      type="button"
                      onClick={() => setPresentaciones((prev) => prev.filter((_, idx) => idx !== i))}
                      className="p-1 text-stone-400 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {/* Ganancia estimada */}
      {gananciaEstimada?.gananciaNetaEstimada != null && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-900">
            Ganancia estimada al vender: {formatPrice(gananciaEstimada.gananciaNetaEstimada)}
            {gananciaEstimada.margenSobreVentaPorcentaje != null && (
              <span className="ml-2 font-normal text-emerald-700">
                ({gananciaEstimada.margenSobreVentaPorcentaje.toFixed(0)}% del precio)
              </span>
            )}
          </p>
          <p className="mt-1 text-xs text-stone-600">{gananciaEstimada.nota}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        {usaPrecioManual ? (
          <Button type="button" onClick={() => handleSave(false)} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        ) : (
          <>
            <Button type="button" onClick={() => handleSave(true)} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar y recalcular'}
            </Button>
            <Button type="button" variant="outline" onClick={() => handleSave(false)} disabled={saving}>
              Guardar sin recalcular
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={async () => {
                try {
                  const data = await api.recalcularPreciosProducto(productoId);
                  setPresentaciones(data.presentaciones || []);
                  setIva(data.ivaPorcentaje);
                  setMargen(data.margenAplicado);
                  setGananciaEstimada(data.gananciaEstimada || null);
                  toast.success('Precios recalculados');
                } catch {
                  toast.error('Error al recalcular');
                }
              }}
            >
              <RefreshCw size={14} className="mr-1" />
              Solo recalcular
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
