import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, Plus, Trash2, ShoppingCart, History, X, Pencil, BarChart3, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { isAdmin } from '../../lib/adminAccess';
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Input } from '../../components/ui/Input';
import { InputWithIcon } from '../../components/ui/InputWithIcon';
import { Select } from '../../components/ui/Select';
import {
  DEFAULT_TURNOS,
  inferirTurnoSlug,
  turnoLabel,
  turnosActivosOrdenados,
  type TurnoVentaItem,
} from '../../lib/turnosVenta';
import { estimarGananciaPreview } from '../../lib/gananciaPreview';
import { calcularVentaDescuentos } from '../../lib/ventaDescuentos';
import type { ModoOrigenEconomico } from '../../components/admin/productoPreciosLabels';

type SortField = 'fecha' | 'total' | 'ganancia' | 'items' | 'turno' | 'medio';
type SortDir = 'asc' | 'desc';

type MedioPagoItem = {
  id: number;
  nombre: string;
  slug: string;
  activo: boolean;
  esDefault: boolean;
  orden: number;
};

type LineaDraft = {
  key: string;
  productoId: number;
  varianteId?: number | null;
  varianteLabel?: string;
  presentacionId?: number | null;
  presentacionNombre?: string;
  presentaciones?: ProductoPresentacionBusqueda[];
  presentacionesCargadas?: boolean;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  unidadVenta?: string;
  gananciaUnitaria?: number;
  descuentoPorcentaje?: number;
  descuentoMonto?: number;
  modoOrigenEconomico?: string;
  costoReferencia?: number | null;
  comisionPorcentaje?: number | null;
  costoMateriales?: number | null;
  manoObra?: number | null;
};

type ProductoVarianteBusqueda = {
  id: number;
  label: string;
};

type ProductoPresentacionBusqueda = {
  id: number;
  nombre: string;
  precioVenta?: number | null;
  gananciaNetaEstimada?: number | null;
  costoReferencia?: number | null;
  esDefault?: boolean;
};

type ProductoBusqueda = {
  id: number;
  nombre: string;
  codigoMakor?: string;
  activo?: boolean;
  precioVenta?: number;
  unidadVenta?: string;
  gananciaNetaEstimada?: number;
  modoOrigenEconomico?: string;
  costoReferencia?: number | null;
  ivaPorcentaje?: number | null;
  costoMateriales?: number | null;
  manoObra?: number | null;
  variantes?: ProductoVarianteBusqueda[];
  presentaciones?: ProductoPresentacionBusqueda[];
};

const fmt = (n: number) =>
  n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

function defaultPresentacion(presentaciones?: ProductoPresentacionBusqueda[]) {
  if (!presentaciones?.length) return null;
  return presentaciones.find((p) => p.esDefault) ?? presentaciones[0];
}

async function hydrateProductoVenta(p: ProductoBusqueda): Promise<ProductoBusqueda> {
  if ((p.presentaciones?.length ?? 0) > 1) return p;
  try {
    const detail = await api.getProductoPrecioVenta(p.id);
    const presentaciones: ProductoPresentacionBusqueda[] = detail.presentaciones ?? [];
    return {
      ...p,
      presentaciones,
      precioVenta: p.precioVenta ?? detail.precioVenta,
      unidadVenta: p.unidadVenta ?? detail.unidadVenta,
      gananciaNetaEstimada: p.gananciaNetaEstimada ?? detail.gananciaNetaEstimada,
      modoOrigenEconomico: p.modoOrigenEconomico ?? detail.modoOrigenEconomico,
      costoReferencia: p.costoReferencia ?? detail.costoReferencia,
      ivaPorcentaje: p.ivaPorcentaje ?? detail.ivaPorcentaje,
      costoMateriales: p.costoMateriales ?? detail.costoMateriales,
      manoObra: p.manoObra ?? detail.manoObra,
    };
  } catch {
    return p;
  }
}

async function hydrateLineaFromVenta(l: {
  id?: number;
  productoId: number;
  varianteId?: number | null;
  varianteLabel?: string | null;
  presentacionId?: number | null;
  presentacionNombre?: string | null;
  productoNombre: string;
  cantidad: number;
  precioUnitarioVenta: number;
  gananciaNetaEstimada?: number;
  descuentoPorcentaje?: number;
  descuentoMonto?: number;
}): Promise<LineaDraft> {
  const detail = await api.getProductoPrecioVenta(l.productoId);
  const presentaciones: ProductoPresentacionBusqueda[] = detail.presentaciones ?? [];
  const pres =
    presentaciones.find((p) => p.id === l.presentacionId) ??
    presentaciones.find((p) => p.nombre === l.presentacionNombre) ??
    presentaciones.find(
      (p) =>
        p.precioVenta != null &&
        Math.abs(p.precioVenta - l.precioUnitarioVenta) < 0.01
    ) ??
    defaultPresentacion(presentaciones);

  const draft: LineaDraft = {
    key: l.id != null ? `edit-${l.id}` : `edit-${l.productoId}-${Date.now()}`,
    productoId: l.productoId,
    varianteId: l.varianteId ?? null,
    varianteLabel: l.varianteLabel ?? undefined,
    presentacionId: pres?.id ?? l.presentacionId ?? null,
    presentacionNombre: l.presentacionNombre ?? pres?.nombre,
    presentaciones,
    presentacionesCargadas: true,
    nombre: l.productoNombre,
    cantidad: l.cantidad,
    precioUnitario: l.precioUnitarioVenta,
    unidadVenta: l.presentacionNombre ?? pres?.nombre,
    gananciaUnitaria: (l.gananciaNetaEstimada ?? 0) / (l.cantidad || 1),
    descuentoPorcentaje: l.descuentoPorcentaje ?? 0,
    descuentoMonto:
      (l.descuentoPorcentaje ?? 0) > 0 ? 0 : (l.descuentoMonto ?? 0),
    modoOrigenEconomico: detail.modoOrigenEconomico,
    costoReferencia: pres?.costoReferencia ?? detail.costoReferencia,
    comisionPorcentaje: null,
    costoMateriales: detail.costoMateriales,
    manoObra: detail.manoObra,
  };

  return {
    ...draft,
    gananciaUnitaria: calcGananciaLinea(draft, draft.precioUnitario),
  };
}

function lineaConPresentacion(
  base: Omit<LineaDraft, 'presentacionId' | 'presentacionNombre' | 'unidadVenta' | 'precioUnitario' | 'gananciaUnitaria' | 'costoReferencia'>,
  pres: ProductoPresentacionBusqueda | null,
  p: ProductoBusqueda
): LineaDraft {
  const precio = pres?.precioVenta ?? p.precioVenta ?? 0;
  const draft: LineaDraft = {
    ...base,
    presentacionId: pres?.id ?? null,
    presentacionNombre: pres?.nombre,
    presentaciones: p.presentaciones ?? [],
    presentacionesCargadas: (p.presentaciones?.length ?? 0) > 0,
    unidadVenta: pres?.nombre ?? p.unidadVenta,
    precioUnitario: precio,
    gananciaUnitaria: pres?.gananciaNetaEstimada ?? p.gananciaNetaEstimada,
    modoOrigenEconomico: p.modoOrigenEconomico,
    costoReferencia: pres?.costoReferencia ?? p.costoReferencia,
    comisionPorcentaje: null,
    costoMateriales: p.costoMateriales,
    manoObra: p.manoObra,
  };
  return {
    ...draft,
    gananciaUnitaria: calcGananciaLinea(draft, precio),
  };
}

function calcGananciaLinea(l: LineaDraft, precio: number): number {
  const modo = (l.modoOrigenEconomico || 'REVENTA') as ModoOrigenEconomico;

  if ((modo === 'REVENTA' || modo === 'ELABORACION_PROPIA') && l.costoReferencia != null) {
    return Math.round((precio - l.costoReferencia) * 100) / 100;
  }

  const preview = estimarGananciaPreview({
    modoOrigen: modo,
    precioVenta: precio,
    comisionPorcentaje: l.comisionPorcentaje,
    costoMateriales: l.costoMateriales,
    manoObra: l.manoObra,
  });
  return preview?.gananciaNetaEstimada ?? 0;
}

function todayInput() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function nowTimeInput() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toOffsetIso(fecha: string, hora: string) {
  const d = new Date(`${fecha}T${hora}:00`);
  const offsetMin = -d.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  const oh = String(Math.floor(abs / 60)).padStart(2, '0');
  const om = String(abs % 60).padStart(2, '0');
  return `${fecha}T${hora}:00${sign}${oh}:${om}`;
}

const FALLBACK_MEDIOS: MedioPagoItem[] = [
  { id: 0, nombre: 'Efectivo', slug: 'efectivo', activo: true, esDefault: true, orden: 1 },
];

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'fecha', label: 'Fecha' },
  { value: 'total', label: 'Monto' },
  { value: 'ganancia', label: 'Ganancia' },
  { value: 'items', label: 'Ítems' },
  { value: 'turno', label: 'Turno' },
  { value: 'medio', label: 'Medio de pago' },
];

function ventaUsuarioParams(filtro: string): Record<string, string> {
  if (filtro === '__mias__') return { mias: 'true' };
  if (filtro === '__sin_asignar__') return { sinUsuario: 'true' };
  if (filtro) return { usuarioId: filtro };
  return {};
}

export function VentasPage() {
  const { user } = useAuth();
  const canDeleteVenta = isAdmin(user?.rol);
  const canFilterAlcance = isAdmin(user?.rol);
  const [filtroUsuario, setFiltroUsuario] = useState(() => (isAdmin(user?.rol) ? '' : '__mias__'));
  const [usuariosFiltro, setUsuariosFiltro] = useState<{ id: string; nombre: string; eliminado: boolean }[]>([]);
  const [tab, setTab] = useState<'nueva' | 'historial'>('nueva');
  const [mediosPago, setMediosPago] = useState<MedioPagoItem[]>(FALLBACK_MEDIOS);
  const [turnosVenta, setTurnosVenta] = useState<TurnoVentaItem[]>(DEFAULT_TURNOS);

  const [fecha, setFecha] = useState(todayInput);
  const [hora, setHora] = useState(nowTimeInput);
  const [turno, setTurno] = useState(() => inferirTurnoSlug(nowTimeInput(), DEFAULT_TURNOS));
  const [turnoManual, setTurnoManual] = useState(false);
  const [medioPagoSlug, setMedioPagoSlug] = useState('efectivo');
  const [notas, setNotas] = useState('');
  const [descuentoGlobalModo, setDescuentoGlobalModo] = useState<'porcentaje' | 'monto'>('porcentaje');
  const [descuentoGlobalPorcentaje, setDescuentoGlobalPorcentaje] = useState(0);
  const [descuentoGlobalMonto, setDescuentoGlobalMonto] = useState(0);
  const [lineas, setLineas] = useState<LineaDraft[]>([]);
  const [saving, setSaving] = useState(false);

  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState<ProductoBusqueda[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [productoPendiente, setProductoPendiente] = useState<ProductoBusqueda | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const [filtroDesde, setFiltroDesde] = useState(todayInput());
  const [filtroHasta, setFiltroHasta] = useState(todayInput());
  const [filtroTurno, setFiltroTurno] = useState('');
  const [filtroQ, setFiltroQ] = useState('');
  const [ordenar, setOrdenar] = useState<SortField>('fecha');
  const [direccion, setDireccion] = useState<SortDir>('desc');
  const [ventas, setVentas] = useState<any[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [resumen, setResumen] = useState<any | null>(null);
  const [detalle, setDetalle] = useState<any | null>(null);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [cargandoEdicion, setCargandoEdicion] = useState(false);
  const [ventaAEliminar, setVentaAEliminar] = useState<any | null>(null);
  const carritoHydratingRef = useRef(true);
  const carritoReadyRef = useRef(false);

  const defaultMedioSlug = useMemo(() => {
    const fromApi = mediosPago.find((m) => m.esDefault)?.slug ?? mediosPago[0]?.slug;
    return fromApi || 'efectivo';
  }, [mediosPago]);

  const mediosActivos = useMemo(() => mediosPago.filter((m) => m.activo), [mediosPago]);
  const turnosActivos = useMemo(() => turnosActivosOrdenados(turnosVenta), [turnosVenta]);
  const turnoActual = useMemo(
    () => turnosVenta.find((t) => t.slug === turno) ?? turnosActivos[0],
    [turno, turnosVenta, turnosActivos]
  );

  const calculoVenta = useMemo(() => {
    const inputs = lineas.map((l) => ({
      cantidad: l.cantidad,
      precioUnitario: l.precioUnitario,
      gananciaBrutaLinea: calcGananciaLinea(l, l.precioUnitario) * l.cantidad,
      descuentoPorcentaje: l.descuentoPorcentaje ?? 0,
      descuentoMonto: l.descuentoMonto ?? 0,
    }));
    return calcularVentaDescuentos(
      inputs,
      descuentoGlobalModo === 'porcentaje' ? descuentoGlobalPorcentaje : 0,
      descuentoGlobalModo === 'monto' ? descuentoGlobalMonto : null
    );
  }, [lineas, descuentoGlobalModo, descuentoGlobalPorcentaje, descuentoGlobalMonto]);

  const subtotalBruto = calculoVenta.subtotalBruto;
  const total = calculoVenta.total;
  const gananciaTotal = calculoVenta.gananciaNetaEstimada;
  const descuentoGlobalAplicado = calculoVenta.descuentoGlobalMonto;
  const descuentoLineasTotal = calculoVenta.lineas.reduce((s, x) => s + x.descuentoLineaMonto, 0);
  const hayDescuentos = descuentoLineasTotal > 0 || descuentoGlobalAplicado > 0;

  useEffect(() => {
    api.getMediosPagoActivos()
      .then((data) => {
        if (data?.length) {
          setMediosPago(data);
          setMedioPagoSlug((prev) => {
            if (prev && data.some((m: MedioPagoItem) => m.slug === prev && m.activo)) return prev;
            return data.find((m: MedioPagoItem) => m.esDefault)?.slug ?? data[0]?.slug ?? 'efectivo';
          });
        }
      })
      .catch(() => {
        setMediosPago(FALLBACK_MEDIOS);
        setMedioPagoSlug('efectivo');
      });
  }, []);

  useEffect(() => {
    api.getTurnosVentaActivos()
      .then((data) => {
        if (data?.length) {
          setTurnosVenta(data);
          setTurno((prev) =>
            data.some((t: TurnoVentaItem) => t.slug === prev)
              ? prev
              : inferirTurnoSlug(hora, data)
          );
        }
      })
      .catch(() => setTurnosVenta(DEFAULT_TURNOS));
  }, []);

  useEffect(() => {
    if (!canFilterAlcance) return;
    api.getUsuariosFiltroVentas()
      .then((data) => setUsuariosFiltro(data ?? []))
      .catch(() => {});
  }, [canFilterAlcance]);

  useEffect(() => {
    if (!editandoId && defaultMedioSlug && !mediosActivos.some((m) => m.slug === medioPagoSlug)) {
      setMedioPagoSlug(defaultMedioSlug);
    }
  }, [defaultMedioSlug, editandoId, medioPagoSlug, mediosActivos]);

  useEffect(() => {
    if (tab !== 'nueva' || editandoId) return;

    const tick = () => {
      const t = nowTimeInput();
      setHora(t);
      if (!turnoManual) setTurno(inferirTurnoSlug(t, turnosVenta));
      setFecha(todayInput());
    };

    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [tab, editandoId, turnoManual, turnosVenta]);

  useEffect(() => {
    if (!turnoManual) {
      setTurno(inferirTurnoSlug(hora, turnosVenta));
    }
  }, [hora, turnoManual, turnosVenta]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResultados([]);
      return;
    }
    const t = setTimeout(async () => {
      setBuscando(true);
      try {
        const data = await api.buscarProductosVenta(query.trim(), 8);
        setResultados(data);
        setShowResults(true);
      } catch {
        toast.error('Error al buscar productos');
      } finally {
        setBuscando(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await api.getVentaCarrito();
        if (cancelled) return;
        const payload = saved?.payload;
        if (payload?.lineas?.length) {
          setLineas(payload.lineas);
          if (payload.notas) setNotas(payload.notas);
          if (payload.medioPagoSlug) setMedioPagoSlug(payload.medioPagoSlug);
          if (payload.turno) setTurno(payload.turno);
          if (typeof payload.turnoManual === 'boolean') setTurnoManual(payload.turnoManual);
          if (payload.descuentoGlobalModo === 'monto' || payload.descuentoGlobalModo === 'porcentaje') {
            setDescuentoGlobalModo(payload.descuentoGlobalModo);
          }
          if (typeof payload.descuentoGlobalPorcentaje === 'number') {
            setDescuentoGlobalPorcentaje(payload.descuentoGlobalPorcentaje);
          }
          if (typeof payload.descuentoGlobalMonto === 'number') {
            setDescuentoGlobalMonto(payload.descuentoGlobalMonto);
          }
        }
      } catch {
        /* sin carrito previo */
      } finally {
        carritoHydratingRef.current = false;
        carritoReadyRef.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (carritoHydratingRef.current || !carritoReadyRef.current || editandoId) return;

    const timer = window.setTimeout(() => {
      if (lineas.length === 0) {
        api.clearVentaCarrito().catch(() => {});
        return;
      }
      api
        .saveVentaCarrito({
          lineas,
          notas,
          medioPagoSlug,
          turno,
          turnoManual,
          descuentoGlobalModo,
          descuentoGlobalPorcentaje,
          descuentoGlobalMonto,
        })
        .catch(() => {});
    }, 700);

    return () => window.clearTimeout(timer);
  }, [lineas, notas, medioPagoSlug, turno, turnoManual, descuentoGlobalModo, descuentoGlobalPorcentaje, descuentoGlobalMonto, editandoId]);

  const resetForm = () => {
    setFecha(todayInput());
    const t = nowTimeInput();
    setHora(t);
    setTurnoManual(false);
    setTurno(inferirTurnoSlug(t, turnosVenta));
    setMedioPagoSlug(defaultMedioSlug);
    setNotas('');
    setDescuentoGlobalModo('porcentaje');
    setDescuentoGlobalPorcentaje(0);
    setDescuentoGlobalMonto(0);
    setLineas([]);
    setQuery('');
    setEditandoId(null);
    setTab('nueva');
    api.clearVentaCarrito().catch(() => {});
  };

  const agregarProducto = async (
    p: ProductoBusqueda,
    variante?: ProductoVarianteBusqueda | null,
    presentacion?: ProductoPresentacionBusqueda | null
  ) => {
    const full = await hydrateProductoVenta(p);
    const varianteId = variante?.id ?? null;
    const varianteLabel = variante?.label;
    const pres = presentacion ?? defaultPresentacion(full.presentaciones);
    const presentacionId = pres?.id ?? null;
    const lineKey = `${full.id}-${varianteId ?? 'base'}-${presentacionId ?? 'default'}`;

    setLineas((prev) => {
      const existing = prev.find(
        (l) =>
          l.productoId === full.id &&
          (l.varianteId ?? null) === varianteId &&
          (l.presentacionId ?? null) === presentacionId
      );
      if (existing) {
        return prev.map((l) =>
          l.productoId === full.id &&
          (l.varianteId ?? null) === varianteId &&
          (l.presentacionId ?? null) === presentacionId
            ? { ...l, cantidad: l.cantidad + 1 }
            : l
        );
      }
      const precio = pres?.precioVenta ?? full.precioVenta;
      if (!precio) {
        toast.error('Este producto no tiene precio de venta cargado');
        return prev;
      }
      return [
        ...prev,
        lineaConPresentacion(
          {
            key: `${lineKey}-${Date.now()}`,
            productoId: full.id,
            varianteId,
            varianteLabel,
            nombre: full.nombre,
            cantidad: 1,
          },
          pres,
          full
        ),
      ];
    });
    setQuery('');
    setShowResults(false);
    setProductoPendiente(null);
  };

  const seleccionarProducto = (p: ProductoBusqueda) => {
    const variantes = (p.variantes ?? []).filter((v) => v.id);
    if (variantes.length > 1) {
      setProductoPendiente(p);
      setShowResults(false);
      return;
    }
    void agregarProducto(p, variantes.length === 1 ? variantes[0] : null);
  };

  useEffect(() => {
    const pendientes = lineas.filter((l) => !l.presentacionesCargadas);
    if (!pendientes.length) return;

    let cancelled = false;
    (async () => {
      const updates = await Promise.all(
        pendientes.map(async (l) => {
          try {
            const detail = await api.getProductoPrecioVenta(l.productoId);
            return {
              key: l.key,
              presentaciones: (detail.presentaciones ?? []) as ProductoPresentacionBusqueda[],
            };
          } catch {
            return { key: l.key, presentaciones: l.presentaciones ?? [] };
          }
        })
      );
      if (cancelled) return;
      setLineas((prev) =>
        prev.map((l) => {
          const hit = updates.find((u) => u.key === l.key);
          if (!hit) return l;
          return { ...l, presentaciones: hit.presentaciones, presentacionesCargadas: true };
        })
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [lineas]);

  const guardarVenta = async () => {
    if (lineas.length === 0) {
      toast.error('Agregá al menos un producto');
      return;
    }
    if (!medioPagoSlug) {
      toast.error('Seleccioná un medio de pago');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        fechaHora: toOffsetIso(fecha, hora),
        turno,
        medioPagoSlug,
        notas: notas || null,
        descuentoGlobalPorcentaje: descuentoGlobalModo === 'porcentaje' ? descuentoGlobalPorcentaje : 0,
        descuentoGlobalMonto: descuentoGlobalModo === 'monto' ? descuentoGlobalMonto : null,
        lineas: lineas.map((l) => ({
          productoId: l.productoId,
          varianteId: l.varianteId ?? null,
          presentacionId: l.presentacionId ?? null,
          cantidad: l.cantidad,
          precioUnitario: l.precioUnitario,
          descuentoPorcentaje: l.descuentoPorcentaje ?? 0,
          descuentoMonto: (l.descuentoPorcentaje ?? 0) > 0 ? null : (l.descuentoMonto ?? 0) || null,
        })),
      };
      if (editandoId) {
        await api.updateVenta(editandoId, payload);
        toast.success('Venta actualizada');
        resetForm();
        setTab('historial');
        loadHistorial();
      } else {
        await api.createVenta(payload);
        toast.success('Venta registrada');
        resetForm();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const loadHistorial = useCallback(async () => {
    setLoadingHistorial(true);
    try {
      const params: Record<string, string> = {
        desde: filtroDesde,
        hasta: filtroHasta,
        ordenar,
        direccion,
      };
      if (filtroTurno) params.turno = filtroTurno;
      if (filtroQ.trim()) params.q = filtroQ.trim();
      Object.assign(params, ventaUsuarioParams(filtroUsuario));

      const usuarioExtra = ventaUsuarioParams(filtroUsuario);
      const lista = await api.getVentas(params);
      const resumenes =
        filtroDesde === filtroHasta
          ? await Promise.all(
              turnosActivos.map((t) => api.getVentaResumen(filtroDesde, t.slug, usuarioExtra))
            )
          : [];
      setVentas(lista);
      setResumen(resumenes);
    } catch {
      toast.error('Error al cargar historial');
    } finally {
      setLoadingHistorial(false);
    }
  }, [filtroDesde, filtroHasta, filtroTurno, filtroQ, filtroUsuario, ordenar, direccion, turnosActivos]);

  useEffect(() => {
    if (tab === 'historial') loadHistorial();
  }, [tab, loadHistorial]);

  const abrirEdicion = async (id: number) => {
    setCargandoEdicion(true);
    try {
      const v = await api.getVenta(id);
      const local = new Date(v.fechaHora);
      const pad = (n: number) => String(n).padStart(2, '0');
      setFecha(`${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}`);
      setHora(`${pad(local.getHours())}:${pad(local.getMinutes())}`);
      setTurno(v.turno);
      setTurnoManual(true);
      setMedioPagoSlug(v.medioPagoSlug || defaultMedioSlug);
      setNotas(v.notas || '');
      setEditandoId(id);
      setTab('nueva');

      if ((v.descuentoGlobalMonto ?? 0) > 0) {
        setDescuentoGlobalModo('monto');
        setDescuentoGlobalMonto(v.descuentoGlobalMonto);
        setDescuentoGlobalPorcentaje(0);
      } else if ((v.descuentoGlobalPorcentaje ?? 0) > 0) {
        setDescuentoGlobalModo('porcentaje');
        setDescuentoGlobalPorcentaje(v.descuentoGlobalPorcentaje);
        setDescuentoGlobalMonto(0);
      } else {
        setDescuentoGlobalModo('porcentaje');
        setDescuentoGlobalPorcentaje(0);
        setDescuentoGlobalMonto(0);
      }

      const lineasEdit = await Promise.all(
        v.lineas.map(async (l: any) => {
          try {
            return await hydrateLineaFromVenta(l);
          } catch {
            return {
              key: `edit-${l.id}`,
              productoId: l.productoId,
              varianteId: l.varianteId ?? null,
              varianteLabel: l.varianteLabel ?? undefined,
              presentacionId: l.presentacionId ?? null,
              presentacionNombre: l.presentacionNombre ?? undefined,
              presentaciones: [],
              presentacionesCargadas: false,
              nombre: l.productoNombre,
              cantidad: l.cantidad,
              precioUnitario: l.precioUnitarioVenta,
              unidadVenta: l.presentacionNombre ?? undefined,
              gananciaUnitaria: l.gananciaNetaEstimada / (l.cantidad || 1),
              descuentoPorcentaje: l.descuentoPorcentaje ?? 0,
              descuentoMonto:
                (l.descuentoPorcentaje ?? 0) > 0 ? 0 : (l.descuentoMonto ?? 0),
            } satisfies LineaDraft;
          }
        })
      );
      setLineas(lineasEdit);
    } catch {
      toast.error('No se pudo cargar la venta');
      setEditandoId(null);
    } finally {
      setCargandoEdicion(false);
    }
  };

  const eliminarVenta = async (id: number) => {
    try {
      await api.deleteVenta(id);
      toast.success('Venta eliminada');
      if (detalle?.id === id) setDetalle(null);
      loadHistorial();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const toggleDireccion = () => setDireccion((d) => (d === 'asc' ? 'desc' : 'asc'));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <ConfirmModal
        open={Boolean(ventaAEliminar)}
        title="Eliminar venta"
        description={
          ventaAEliminar
            ? `Se va a eliminar la venta #${ventaAEliminar.id} por ${fmt(ventaAEliminar.total)}.`
            : undefined
        }
        confirmLabel="Eliminar"
        onClose={() => setVentaAEliminar(null)}
        onConfirm={() => {
          if (!ventaAEliminar) return;
          void eliminarVenta(ventaAEliminar.id).finally(() => setVentaAEliminar(null));
        }}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <ShoppingCart className="h-7 w-7 text-brand-700" />
            Ventas
          </h1>
          <p className="text-sm text-stone-500 mt-1">Registro de ventas del mostrador por turno</p>
        </div>
        <div className="flex rounded-lg border border-stone-200 bg-white p-1 self-start">
          <button
            onClick={() => setTab('nueva')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === 'nueva' ? 'bg-brand-800 text-white' : 'text-stone-600 hover:bg-stone-50'
            }`}
          >
            <Plus className="inline h-4 w-4 mr-1" />
            Nueva venta
          </button>
          <button
            onClick={() => setTab('historial')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === 'historial' ? 'bg-brand-800 text-white' : 'text-stone-600 hover:bg-stone-50'
            }`}
          >
            <History className="inline h-4 w-4 mr-1" />
            Historial
          </button>
        </div>
      </div>

      {tab === 'nueva' && (
        <div className="space-y-4">
          {editandoId && (
            <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <span>
                Editando venta #{editandoId}
                {cargandoEdicion ? ' — cargando líneas…' : ''}
              </span>
              <button onClick={resetForm} className="text-amber-700 hover:underline">
                Cancelar edición
              </button>
            </div>
          )}

          <div
            className={`bg-white rounded-xl border border-stone-200 p-4 sm:p-6 space-y-4 ${
              showResults ? 'overflow-visible' : ''
            }`}
          >
            <div className="flex flex-wrap items-start gap-x-2 gap-y-3">
              <div className="shrink-0">
                <label className="admin-field-label">Fecha</label>
                <Input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="admin-input-compact-date"
                />
              </div>
              <div className="shrink-0">
                <label className="admin-field-label">Hora</label>
                <Input
                  type="time"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  className="admin-input-compact-time"
                />
              </div>
              <div className="shrink-0">
                <label className="admin-field-label">Turno</label>
                <Select
                  value={turno}
                  onChange={(e) => {
                    setTurnoManual(true);
                    setTurno(e.target.value);
                  }}
                  className="admin-select-compact"
                >
                  {turnosActivos.map((t) => (
                    <option key={t.slug} value={t.slug}>
                      {t.nombre}
                    </option>
                  ))}
                </Select>
                {turnoActual && (
                  <p className="text-[11px] text-stone-400 mt-1 max-w-[7.75rem] leading-tight">
                    {turnoManual ? 'Manual' : 'Auto'} · {turnoActual.descripcionHorario}
                  </p>
                )}
              </div>
              <div className="shrink-0">
                <label className="admin-field-label">
                  Medio de pago <span className="text-red-500">*</span>
                </label>
                <Select
                  value={medioPagoSlug}
                  onChange={(e) => setMedioPagoSlug(e.target.value)}
                  required
                  className="admin-select-medio"
                >
                  {mediosActivos.map((m) => (
                    <option key={m.slug} value={m.slug}>
                      {m.nombre}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div ref={searchRef} className="relative z-30">
              <label className="admin-field-label">Buscar producto</label>
              <InputWithIcon
                icon={Search}
                placeholder="Nombre o código Makor (mín. 2 letras)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => resultados.length > 0 && setShowResults(true)}
              />
              {showResults && resultados.length > 0 && (
                <div className="absolute left-0 right-0 z-50 mt-1 rounded-lg border border-stone-200 bg-white shadow-xl max-h-[16.5rem] overflow-y-auto overscroll-contain">
                  {resultados.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => seleccionarProducto(p)}
                      className={`w-full text-left px-4 py-3 transition-colors border-b border-stone-100 last:border-0 ${
                        p.activo === false
                          ? 'hover:bg-amber-50/70'
                          : 'hover:bg-brand-50/60'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="font-medium text-stone-900 text-sm flex-1 min-w-0">{p.nombre}</div>
                        {p.activo === false && (
                          <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                            No visible
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-stone-500 flex justify-between mt-0.5">
                        <span>{p.codigoMakor}</span>
                        <span>{p.precioVenta ? fmt(p.precioVenta) : 'Sin precio'}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {buscando && <p className="text-xs text-stone-400 mt-1">Buscando...</p>}
            </div>

            {productoPendiente && (
              <div className="rounded-xl border border-brand-200 bg-brand-50/40 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-stone-900">Elegí la variante</p>
                    <p className="text-xs text-stone-500 mt-0.5">{productoPendiente.nombre}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProductoPendiente(null)}
                    className="text-xs text-stone-500 hover:text-stone-800"
                  >
                    Cancelar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(productoPendiente.variantes ?? []).map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => void agregarProducto(productoPendiente, v)}
                      className="px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm font-medium text-stone-800 hover:border-brand-500 hover:bg-brand-50 transition-colors"
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {lineas.length > 0 && (
              <div className="border border-stone-200 rounded-lg overflow-x-auto">
                <table className="w-full min-w-[42rem] text-sm">
                  <thead className="bg-stone-50 text-stone-500 text-xs uppercase">
                    <tr>
                      <th className="text-left px-3 py-2">Producto</th>
                      <th className="text-right px-3 py-2 w-24">Cant.</th>
                      <th className="text-right px-3 py-2 w-32">Precio</th>
                      <th className="text-right px-3 py-2 w-24">Desc.</th>
                      <th className="text-right px-3 py-2 w-28">Subtotal</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {lineas.map((l, idx) => {
                      const calc = calculoVenta.lineas[idx];
                      return (
                      <tr key={l.key} className="border-t border-stone-100">
                        <td className="px-3 py-2">
                          <div className="font-medium text-stone-900">{l.nombre}</div>
                          {l.varianteLabel && (
                            <div className="text-xs text-brand-700">{l.varianteLabel}</div>
                          )}
                          {(l.presentaciones?.length ?? 0) > 1 ? (
                            <div className="mt-1.5 max-w-[11rem]">
                              <Select
                                value={String(l.presentacionId ?? l.presentaciones![0]?.id ?? '')}
                                onChange={(e) => {
                                  const pres = l.presentaciones?.find(
                                    (p) => String(p.id) === e.target.value
                                  );
                                  if (!pres) return;
                                  setLineas((prev) =>
                                    prev.map((x) => {
                                      if (x.key !== l.key) return x;
                                      const next: LineaDraft = {
                                        ...x,
                                        presentacionId: pres.id,
                                        presentacionNombre: pres.nombre,
                                        unidadVenta: pres.nombre,
                                        precioUnitario: pres.precioVenta ?? x.precioUnitario,
                                        costoReferencia: pres.costoReferencia ?? x.costoReferencia,
                                      };
                                      return {
                                        ...next,
                                        gananciaUnitaria: calcGananciaLinea(
                                          next,
                                          next.precioUnitario
                                        ),
                                      };
                                    })
                                  );
                                }}
                                className="admin-select-sm max-w-[11rem]"
                              >
                                {l.presentaciones!.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.nombre}
                                    {p.precioVenta != null ? ` · ${fmt(p.precioVenta)}` : ''}
                                  </option>
                                ))}
                              </Select>
                            </div>
                          ) : !l.presentacionesCargadas ? (
                            <div className="text-xs text-stone-400 mt-1">Cargando presentaciones…</div>
                          ) : (
                            l.unidadVenta && (
                              <div className="text-xs text-stone-400">{l.unidadVenta}</div>
                            )
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            className="text-right h-9"
                            value={l.cantidad}
                            onChange={(e) =>
                              setLineas((prev) =>
                                prev.map((x) =>
                                  x.key === l.key
                                    ? { ...x, cantidad: parseFloat(e.target.value) || 0 }
                                    : x
                                )
                              )
                            }
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            className="text-right h-9"
                            value={l.precioUnitario}
                            onChange={(e) => {
                              const precio = parseFloat(e.target.value) || 0;
                              setLineas((prev) =>
                                prev.map((x) =>
                                  x.key === l.key
                                    ? {
                                        ...x,
                                        precioUnitario: precio,
                                        gananciaUnitaria: calcGananciaLinea(x, precio),
                                      }
                                    : x
                                )
                              );
                            }}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex flex-col gap-1 w-[4.5rem] ml-auto">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              placeholder="%"
                              title="Descuento %"
                              className="text-right h-8 text-xs"
                              value={(l.descuentoPorcentaje ?? 0) > 0 ? l.descuentoPorcentaje : ''}
                              onChange={(e) => {
                                const pct = parseFloat(e.target.value) || 0;
                                setLineas((prev) =>
                                  prev.map((x) =>
                                    x.key === l.key
                                      ? {
                                          ...x,
                                          descuentoPorcentaje: pct,
                                          descuentoMonto: pct > 0 ? 0 : x.descuentoMonto,
                                        }
                                      : x
                                  )
                                );
                              }}
                            />
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              placeholder="$"
                              title="Descuento fijo"
                              className="text-right h-8 text-xs"
                              value={
                                (l.descuentoPorcentaje ?? 0) > 0
                                  ? ''
                                  : (l.descuentoMonto ?? 0) > 0
                                    ? l.descuentoMonto
                                    : ''
                              }
                              onChange={(e) => {
                                const monto = parseFloat(e.target.value) || 0;
                                setLineas((prev) =>
                                  prev.map((x) =>
                                    x.key === l.key
                                      ? { ...x, descuentoMonto: monto, descuentoPorcentaje: 0 }
                                      : x
                                  )
                                );
                              }}
                            />
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          {calc &&
                          ((calc.descuentoLineaMonto ?? 0) > 0 ||
                            (calc.descuentoGlobalAsignado ?? 0) > 0) ? (
                            <div>
                              <div className="text-xs text-stone-400 line-through">
                                {fmt(calc.subtotalBruto)}
                              </div>
                              <div>{fmt(calc.subtotalFinal)}</div>
                            </div>
                          ) : (
                            fmt(calc?.subtotalFinal ?? l.cantidad * l.precioUnitario)
                          )}
                        </td>
                        <td className="px-2 py-2">
                          <button
                            onClick={() => setLineas((prev) => prev.filter((x) => x.key !== l.key))}
                            className="p-1.5 text-stone-400 hover:text-red-600 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div>
              <label className="admin-field-label">Notas</label>
              <Input
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Opcional..."
              />
            </div>

            {lineas.length > 0 && (
              <div className="rounded-lg border border-stone-200 p-3 space-y-2">
                <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                  Descuento global
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex rounded-lg border border-stone-200 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setDescuentoGlobalModo('porcentaje')}
                      className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                        descuentoGlobalModo === 'porcentaje'
                          ? 'bg-brand-700 text-white'
                          : 'bg-white text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      %
                    </button>
                    <button
                      type="button"
                      onClick={() => setDescuentoGlobalModo('monto')}
                      className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                        descuentoGlobalModo === 'monto'
                          ? 'bg-brand-700 text-white'
                          : 'bg-white text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      $
                    </button>
                  </div>
                  {descuentoGlobalModo === 'porcentaje' ? (
                    <div className="w-28">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        className="text-right"
                        value={descuentoGlobalPorcentaje > 0 ? descuentoGlobalPorcentaje : ''}
                        placeholder="0"
                        onChange={(e) =>
                          setDescuentoGlobalPorcentaje(parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                  ) : (
                    <div className="w-32">
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        className="text-right"
                        value={descuentoGlobalMonto > 0 ? descuentoGlobalMonto : ''}
                        placeholder="0"
                        onChange={(e) =>
                          setDescuentoGlobalMonto(parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                  )}
                  {descuentoGlobalAplicado > 0 && (
                    <span className="text-sm text-red-600 pb-1.5">
                      −{fmt(descuentoGlobalAplicado)}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2 border-t border-stone-100">
              <div className="space-y-1">
                {hayDescuentos && (
                  <div className="space-y-0.5 text-sm text-stone-600 mb-2">
                    <div className="flex justify-between gap-8">
                      <span>Subtotal</span>
                      <span>{fmt(subtotalBruto)}</span>
                    </div>
                    {descuentoLineasTotal > 0 && (
                      <div className="flex justify-between gap-8 text-red-600">
                        <span>Desc. líneas</span>
                        <span>−{fmt(descuentoLineasTotal)}</span>
                      </div>
                    )}
                    {descuentoGlobalAplicado > 0 && (
                      <div className="flex justify-between gap-8 text-red-600">
                        <span>Desc. global</span>
                        <span>−{fmt(descuentoGlobalAplicado)}</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="text-2xl font-bold text-stone-900">{fmt(total)}</div>
                {gananciaTotal !== 0 && (
                  <div
                    className={`text-sm ${
                      gananciaTotal > 0 ? 'text-emerald-700' : 'text-red-600'
                    }`}
                  >
                    {gananciaTotal > 0 ? 'Ganancia estimada' : 'Pérdida estimada'}:{' '}
                    {fmt(Math.abs(gananciaTotal))}
                  </div>
                )}
              </div>
              <Button
                onClick={guardarVenta}
                disabled={saving || lineas.length === 0 || !medioPagoSlug}
                size="lg"
              >
                {saving ? 'Guardando...' : editandoId ? 'Actualizar venta' : 'Guardar venta'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {tab === 'historial' && (
        <div className="space-y-4">
          {Array.isArray(resumen) && resumen.length > 0 && filtroDesde === filtroHasta && (
            <div className={`grid gap-3 ${resumen.length > 2 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2'}`}>
              {resumen.map((r) => (
                <div key={r.turno} className="bg-white rounded-xl border border-stone-200 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-stone-700 mb-2">
                    <BarChart3 className="h-4 w-4 text-brand-700" />
                    Turno {turnoLabel(r.turno, turnosVenta)} — {r.fecha}
                  </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-stone-500">Ventas</span>
                        <div className="font-bold">{r.cantidadVentas}</div>
                      </div>
                      <div>
                        <span className="text-stone-500">Facturado</span>
                        <div className="font-bold">{fmt(r.totalFacturado)}</div>
                      </div>
                      <div>
                        <span className="text-stone-500">Ganancia est.</span>
                        <div className="font-bold text-emerald-700">{fmt(r.gananciaNetaEstimada)}</div>
                      </div>
                      <div>
                        <span className="text-stone-500">Ticket prom.</span>
                        <div className="font-bold">{fmt(r.ticketPromedio)}</div>
                      </div>
                    </div>
                  </div>
              ))}
            </div>
          )}

          <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              {canFilterAlcance && (
              <div>
                <label className="admin-field-label">Usuario</label>
                <Select
                  value={filtroUsuario}
                  onChange={(e) => setFiltroUsuario(e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="__mias__">Solo mías</option>
                  <option value="__sin_asignar__">Sin asignar</option>
                  {usuariosFiltro.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre}{u.eliminado ? ' (archivado)' : ''}
                    </option>
                  ))}
                </Select>
              </div>
              )}
              <div>
                <label className="admin-field-label">Desde</label>
                <Input type="date" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)} />
              </div>
              <div>
                <label className="admin-field-label">Hasta</label>
                <Input type="date" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)} />
              </div>
              <div>
                <label className="admin-field-label">Turno</label>
                <Select
                  value={filtroTurno}
                  onChange={(e) => setFiltroTurno(e.target.value)}
                >
                  <option value="">Todos</option>
                  {turnosActivos.map((t) => (
                    <option key={t.slug} value={t.slug}>
                      {t.nombre}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="col-span-2">
                <label className="admin-field-label">Buscar</label>
                <Input
                  value={filtroQ}
                  onChange={(e) => setFiltroQ(e.target.value)}
                  placeholder="Producto o nota..."
                />
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[10rem]">
                <label className="admin-field-label">Ordenar por</label>
                <Select value={ordenar} onChange={(e) => setOrdenar(e.target.value as SortField)}>
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </div>
              <Button variant="outline" size="sm" onClick={toggleDireccion} className="mb-0.5">
                <ArrowUpDown className="h-4 w-4 mr-1" />
                {direccion === 'asc' ? 'Ascendente' : 'Descendente'}
              </Button>
              <Button variant="outline" size="sm" onClick={loadHistorial} className="mb-0.5">
                Actualizar
              </Button>
            </div>
          </div>

          {loadingHistorial ? (
            <p className="text-stone-500 text-sm">Cargando...</p>
          ) : ventas.length === 0 ? (
            <p className="text-stone-500 text-sm bg-white rounded-xl border border-stone-200 p-8 text-center">
              No hay ventas en este período
            </p>
          ) : (
            <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-100">
              {ventas.map((v) => (
                <div key={v.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-stone-900">
                        {new Date(v.fechaHora).toLocaleString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                        {turnoLabel(v.turno, turnosVenta)}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                        {v.medioPagoNombre || v.medioPagoSlug}
                      </span>
                    </div>
                    <div className="text-sm text-stone-500 mt-0.5">
                      {v.cantidadLineas} ítem{v.cantidadLineas !== 1 ? 's' : ''}
                      {v.usuarioNombre && (
                        <span className="text-stone-400"> · Cargó: {v.usuarioNombre}</span>
                      )}
                      {v.notas && ` · ${v.notas}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-stone-900">{fmt(v.total)}</div>
                    <div className="text-xs text-emerald-700">+{fmt(v.gananciaNetaEstimada)}</div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setDetalle(detalle?.id === v.id ? null : v)}
                      className="p-2 text-stone-500 hover:bg-stone-100 rounded-md text-sm"
                    >
                      Ver
                    </button>
                    <button
                      onClick={() => void abrirEdicion(v.id)}
                      className="p-2 text-stone-500 hover:bg-stone-100 rounded-md"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    {canDeleteVenta && (
                    <button
                      onClick={() => setVentaAEliminar(v)}
                      className="p-2 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-md"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {detalle && (
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold">Detalle venta #{detalle.id}</h3>
                <button onClick={() => setDetalle(null)} className="text-stone-400 hover:text-stone-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <VentaDetalleContent id={detalle.id} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function VentaDetalleContent({ id }: { id: number }) {
  const [venta, setVenta] = useState<any>(null);

  useEffect(() => {
    api.getVenta(id).then(setVenta).catch(() => toast.error('Error al cargar detalle'));
  }, [id]);

  if (!venta) return <p className="text-sm text-stone-500">Cargando...</p>;

  return (
    <div className="space-y-2 text-sm">
      {venta.usuarioNombre && (
        <p className="text-xs text-stone-500 mb-2">Cargó: {venta.usuarioNombre}</p>
      )}
      {venta.lineas.map((l: any) => (
        <div key={l.id} className="flex justify-between gap-2 py-1 border-b border-stone-50">
          <div className="min-w-0">
            <div>
              {l.productoNombre} × {l.cantidad}
            </div>
            {((l.descuentoMonto ?? 0) > 0 || (l.descuentoPorcentaje ?? 0) > 0) && (
              <div className="text-xs text-stone-400">
                Desc. línea
                {(l.descuentoPorcentaje ?? 0) > 0
                  ? ` ${l.descuentoPorcentaje}%`
                  : ` −${fmt(l.descuentoMonto)}`}
              </div>
            )}
            {(l.descuentoGlobalAsignado ?? 0) > 0 && (
              <div className="text-xs text-stone-400">
                Desc. global −{fmt(l.descuentoGlobalAsignado)}
              </div>
            )}
          </div>
          <div className="text-right shrink-0">
            {(l.subtotalBruto ?? 0) > l.subtotal && (
              <div className="text-xs text-stone-400 line-through">{fmt(l.subtotalBruto)}</div>
            )}
            <span className="font-medium">{fmt(l.subtotal)}</span>
          </div>
        </div>
      ))}
      <div className="space-y-0.5 pt-2 text-sm text-stone-600">
        {(venta.subtotalBruto ?? 0) > venta.total && (
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{fmt(venta.subtotalBruto)}</span>
          </div>
        )}
        {(venta.descuentoGlobalMonto ?? 0) > 0 && (
          <div className="flex justify-between text-red-600">
            <span>
              Desc. global
              {(venta.descuentoGlobalPorcentaje ?? 0) > 0
                ? ` (${venta.descuentoGlobalPorcentaje}%)`
                : ''}
            </span>
            <span>−{fmt(venta.descuentoGlobalMonto)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-stone-900 text-base pt-1">
          <span>Total</span>
          <span>{fmt(venta.total)}</span>
        </div>
      </div>
    </div>
  );
}
