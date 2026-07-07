import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { BarChart3, TrendingDown, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Spinner } from '../../components/ui/Spinner';

type PeriodoPreset = 'hoy' | 'semana' | 'mes' | 'mes_anterior' | 'custom';

const fmt = (n: number) =>
  n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;

const TURNO_COLORS = ['#8B5E3C', '#C4A882'];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toDateInput(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function rangoPreset(preset: PeriodoPreset): { desde: string; hasta: string } {
  const hoy = new Date();
  const hasta = toDateInput(hoy);

  if (preset === 'hoy') return { desde: hasta, hasta };

  if (preset === 'semana') {
    const d = new Date(hoy);
    const day = d.getDay();
    const diff = day === 0 ? 6 : day - 1;
    d.setDate(d.getDate() - diff);
    return { desde: toDateInput(d), hasta };
  }

  if (preset === 'mes') {
    const d = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    return { desde: toDateInput(d), hasta };
  }

  if (preset === 'mes_anterior') {
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const fin = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
    return { desde: toDateInput(inicio), hasta: toDateInput(fin) };
  }

  return { desde: hasta, hasta };
}

function turnoLabel(t: string) {
  return t === 'MANANA' ? 'Mañana' : t === 'TARDE' ? 'Tarde' : t;
}

function origenLabel(o: string) {
  const map: Record<string, string> = {
    REVENTA: 'Reventa',
    CONSIGNACION: 'Consignación',
    ELABORACION_PROPIA: 'Elaboración',
    SIN_COSTO: 'Sin costo',
  };
  return map[o] ?? o;
}

function Delta({ actual, anterior, invertir = false }: { actual: number; anterior?: number; invertir?: boolean }) {
  if (anterior == null || anterior === 0) return null;
  const pct = ((actual - anterior) / anterior) * 100;
  const positivo = invertir ? pct < 0 : pct > 0;
  const Icon = positivo ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${positivo ? 'text-emerald-600' : 'text-red-500'}`}>
      <Icon className="h-3.5 w-3.5" />
      {fmtPct(pct)} vs ant.
    </span>
  );
}

function KpiCard({
  label,
  value,
  sub,
  delta,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</p>
      <p className="text-2xl font-bold text-stone-900 mt-1">{value}</p>
      {sub && <p className="text-sm text-stone-500 mt-0.5">{sub}</p>}
      {delta && <div className="mt-2">{delta}</div>}
    </div>
  );
}

export function EstadisticasPage() {
  const [preset, setPreset] = useState<PeriodoPreset>('mes');
  const [desde, setDesde] = useState(() => rangoPreset('mes').desde);
  const [hasta, setHasta] = useState(() => rangoPreset('mes').hasta);
  const [turno, setTurno] = useState('');
  const [medioPago, setMedioPago] = useState('');
  const [medios, setMedios] = useState<any[]>([]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMediosPagoActivos().then(setMedios).catch(() => {});
  }, []);

  const applyPreset = (p: PeriodoPreset) => {
    setPreset(p);
    if (p !== 'custom') {
      const r = rangoPreset(p);
      setDesde(r.desde);
      setHasta(r.hasta);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { desde, hasta, comparar: 'true' };
      if (turno) params.turno = turno;
      if (medioPago) params.medioPago = medioPago;
      const res = await api.getEstadisticasResumen(params);
      setData(res);
    } catch {
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  }, [desde, hasta, turno, medioPago]);

  useEffect(() => {
    load();
  }, [load]);

  const kpis = data?.kpis;
  const prev = data?.kpisPeriodoAnterior;

  const porDiaChart = useMemo(
    () =>
      (data?.porDia ?? []).map((d: any) => ({
        ...d,
        label: d.fecha.slice(5).replace('-', '/'),
      })),
    [data]
  );

  const porTurnoChart = useMemo(
    () =>
      (data?.porTurno ?? []).map((t: any) => ({
        ...t,
        nombre: turnoLabel(t.turno),
        value: t.facturacion,
      })),
    [data]
  );

  const porCategoriaChart = useMemo(
    () =>
      (data?.porCategoria ?? []).slice(0, 8).map((c: any) => ({
        nombre: c.categoriaNombre.length > 18 ? `${c.categoriaNombre.slice(0, 16)}…` : c.categoriaNombre,
        facturacion: c.facturacion,
      })),
    [data]
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
          <BarChart3 className="h-7 w-7 text-brand-700" />
          Estadísticas
        </h1>
        <p className="text-sm text-stone-500 mt-1">Análisis de ventas, ganancias y tendencias</p>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['hoy', 'Hoy'],
              ['semana', 'Esta semana'],
              ['mes', 'Este mes'],
              ['mes_anterior', 'Mes anterior'],
              ['custom', 'Personalizado'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                preset === key
                  ? 'bg-brand-800 text-white border-brand-800'
                  : 'border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="shrink-0">
            <label className="admin-field-label">Desde</label>
            <Input
              type="date"
              className="admin-input-compact-date"
              value={desde}
              onChange={(e) => {
                setPreset('custom');
                setDesde(e.target.value);
              }}
            />
          </div>
          <div className="shrink-0">
            <label className="admin-field-label">Hasta</label>
            <Input
              type="date"
              className="admin-input-compact-date"
              value={hasta}
              onChange={(e) => {
                setPreset('custom');
                setHasta(e.target.value);
              }}
            />
          </div>
          <div className="shrink-0">
            <label className="admin-field-label">Turno</label>
            <Select
              className="admin-select-compact"
              value={turno}
              onChange={(e) => setTurno(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="MANANA">Mañana</option>
              <option value="TARDE">Tarde</option>
            </Select>
          </div>
          <div className="shrink-0 min-w-[10rem]">
            <label className="admin-field-label">Medio de pago</label>
            <Select
              className="admin-select-medio"
              value={medioPago}
              onChange={(e) => setMedioPago(e.target.value)}
            >
              <option value="">Todos</option>
              {medios.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.nombre}
                </option>
              ))}
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={load} className="mb-0.5">
            Actualizar
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner size={36} />
        </div>
      ) : !kpis ? (
        <p className="text-stone-500 text-sm">Sin datos</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <KpiCard
              label="Facturación"
              value={fmt(kpis.facturacion)}
              delta={<Delta actual={kpis.facturacion} anterior={prev?.facturacion} />}
            />
            <KpiCard
              label="Ganancia estimada"
              value={fmt(kpis.gananciaNeta)}
              delta={<Delta actual={kpis.gananciaNeta} anterior={prev?.gananciaNeta} />}
            />
            <KpiCard
              label="Margen promedio"
              value={`${kpis.margenPorcentaje}%`}
              sub="Sobre facturación"
              delta={<Delta actual={kpis.margenPorcentaje} anterior={prev?.margenPorcentaje} />}
            />
            <KpiCard
              label="Ventas"
              value={String(kpis.cantidadVentas)}
              delta={<Delta actual={kpis.cantidadVentas} anterior={prev?.cantidadVentas} />}
            />
            <KpiCard
              label="Ticket promedio"
              value={fmt(kpis.ticketPromedio)}
              delta={<Delta actual={kpis.ticketPromedio} anterior={prev?.ticketPromedio} />}
            />
            <KpiCard
              label="Ítems vendidos"
              value={kpis.itemsVendidos.toLocaleString('es-AR', { maximumFractionDigits: 1 })}
              delta={<Delta actual={kpis.itemsVendidos} anterior={prev?.itemsVendidos} />}
            />
          </div>

          {kpis.cantidadVentas === 0 ? (
            <div className="rounded-xl border border-stone-200 bg-white p-10 text-center text-stone-500 text-sm">
              No hay ventas en este período. Cuando registres ventas en el mostrador, las estadísticas aparecerán acá.
            </div>
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-stone-200 bg-white p-4">
                  <h3 className="text-sm font-semibold text-stone-800 mb-4">Facturación por día</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={porDiaChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v) => fmt(Number(v ?? 0))} />
                        <Bar dataKey="facturacion" fill="#6B4423" radius={[4, 4, 0, 0]} name="Facturación" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-xl border border-stone-200 bg-white p-4">
                  <h3 className="text-sm font-semibold text-stone-800 mb-4">Mañana vs tarde</h3>
                  <div className="h-64">
                    {porTurnoChart.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={porTurnoChart}
                            dataKey="value"
                            nameKey="nombre"
                            cx="50%"
                            cy="50%"
                            outerRadius={90}
                            label={(props) => {
                              const nombre = String(props.name ?? '');
                              const pct = props.percent ?? 0;
                              return `${nombre} ${(pct * 100).toFixed(0)}%`;
                            }}
                          >
                            {porTurnoChart.map((_: any, i: number) => (
                              <Cell key={i} fill={TURNO_COLORS[i % TURNO_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => fmt(Number(v ?? 0))} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-sm text-stone-400 text-center pt-20">Sin datos de turno</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-stone-200 bg-white p-4">
                  <h3 className="text-sm font-semibold text-stone-800 mb-4">Top categorías</h3>
                  <div className="h-64">
                    {porCategoriaChart.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={porCategoriaChart} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                          <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                          <YAxis type="category" dataKey="nombre" width={100} tick={{ fontSize: 10 }} />
                          <Tooltip formatter={(v) => fmt(Number(v ?? 0))} />
                          <Bar dataKey="facturacion" fill="#8B5E3C" radius={[0, 4, 4, 0]} name="Facturación" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-sm text-stone-400 text-center pt-20">Sin categorías</p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-stone-200 bg-white p-4 overflow-x-auto">
                  <h3 className="text-sm font-semibold text-stone-800 mb-4">Top productos</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs uppercase text-stone-500 border-b border-stone-100">
                        <th className="text-left py-2">Producto</th>
                        <th className="text-right py-2">Cant.</th>
                        <th className="text-right py-2">Facturado</th>
                        <th className="text-right py-2">Ganancia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.topProductos ?? []).slice(0, 10).map((p: any) => (
                        <tr key={p.productoId} className="border-b border-stone-50">
                          <td className="py-2 pr-2 max-w-[12rem] truncate" title={p.productoNombre}>
                            {p.productoNombre}
                          </td>
                          <td className="py-2 text-right text-stone-600">{p.cantidad}</td>
                          <td className="py-2 text-right font-medium">{fmt(p.facturacion)}</td>
                          <td className="py-2 text-right text-emerald-700">{fmt(p.ganancia)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-stone-200 bg-white p-4">
                  <h3 className="text-sm font-semibold text-stone-800 mb-3">Por medio de pago</h3>
                  <div className="space-y-2">
                    {(data?.porMedioPago ?? []).map((m: any) => (
                      <div key={m.medioPagoSlug} className="flex items-center justify-between text-sm">
                        <span className="text-stone-700">{m.medioPagoNombre}</span>
                        <span className="font-medium">{fmt(m.facturacion)}</span>
                      </div>
                    ))}
                    {(data?.porMedioPago ?? []).length === 0 && (
                      <p className="text-sm text-stone-400">Sin datos</p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-stone-200 bg-white p-4">
                  <h3 className="text-sm font-semibold text-stone-800 mb-3">Por origen económico</h3>
                  <div className="space-y-2">
                    {(data?.porOrigenEconomico ?? []).map((o: any) => (
                      <div key={o.origenEconomico} className="flex items-center justify-between text-sm">
                        <span className="text-stone-700">{origenLabel(o.origenEconomico)}</span>
                        <div className="text-right">
                          <div className="font-medium">{fmt(o.facturacion)}</div>
                          <div className="text-xs text-emerald-700">+{fmt(o.ganancia)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
