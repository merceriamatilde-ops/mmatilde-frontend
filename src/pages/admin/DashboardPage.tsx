import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  BarChart3,
  Package,
  Eye,
  RefreshCw,
  Plus,
  Sun,
  Sunset,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../api/client';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import { DEFAULT_TURNOS, turnosActivosOrdenados, type TurnoVentaItem } from '../../lib/turnosVenta';

const fmt = (n: number) =>
  n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function todayInput() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function monthStartInput() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
}

function ResumenDiaCard({
  facturacion,
  ganancia,
  ventas,
  ticket,
  turnos,
}: {
  facturacion: number;
  ganancia: number;
  ventas: number;
  ticket: number;
  turnos: { turno: TurnoVentaItem; data: any }[];
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm lg:col-span-2">
      <h3 className="text-sm font-semibold text-stone-700 mb-4">Resumen del día</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-stone-500">Facturado</p>
          <p className="text-2xl font-bold text-stone-900 mt-0.5">{fmt(facturacion)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-stone-500">Ganancia est.</p>
          <p className="text-2xl font-bold text-emerald-700 mt-0.5">{fmt(ganancia)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-stone-500">Ventas</p>
          <p className="text-lg font-semibold text-stone-900 mt-0.5">{ventas}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-stone-500">Ticket prom.</p>
          <p className="text-lg font-semibold text-stone-900 mt-0.5">{fmt(ticket)}</p>
        </div>
      </div>

      {turnos.length > 0 && (
        <div className="border-t border-stone-100 pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500 mb-3">Por turno</p>
          <div className={`grid gap-3 ${turnos.length > 2 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2'}`}>
            {turnos.map(({ turno, data }, i) => (
              <div
                key={turno.slug}
                className="rounded-lg border border-stone-100 bg-stone-50/60 p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                      i % 2 === 0 ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-700'
                    }`}
                  >
                    {i % 2 === 0 ? <Sun className="h-4 w-4" /> : <Sunset className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-900 truncate">{turno.nombre}</p>
                    <p className="text-xs text-stone-500">{data?.cantidadVentas ?? 0} ventas</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-stone-900 shrink-0 ml-2">{fmt(data?.totalFacturado ?? 0)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function DashboardPage() {
  const hoy = todayInput();
  const [loading, setLoading] = useState(true);
  const [catalogo, setCatalogo] = useState<any>(null);
  const [dia, setDia] = useState<any>(null);
  const [mes, setMes] = useState<any>(null);
  const [turnosResumen, setTurnosResumen] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const turnos: TurnoVentaItem[] = await api.getTurnosVentaActivos().catch(() => DEFAULT_TURNOS);
        const activos = turnosActivosOrdenados(turnos.length ? turnos : DEFAULT_TURNOS);
        const [cat, resDia, resMes, ...resTurnos] = await Promise.all([
          api.getDashboardStats(),
          api.getEstadisticasResumen({ desde: hoy, hasta: hoy, comparar: 'false' }),
          api.getEstadisticasResumen({ desde: monthStartInput(), hasta: hoy, comparar: 'true' }),
          ...activos.map((t) => api.getVentaResumen(hoy, t.slug)),
        ]);
        setCatalogo(cat);
        setDia(resDia);
        setMes(resMes);
        setTurnosResumen(
          activos.map((t, i) => ({
            turno: t,
            data: resTurnos[i],
          }))
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [hoy]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size={40} />
      </div>
    );
  }

  const kpiDia = dia?.kpis;
  const kpiMes = mes?.kpis;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Dashboard</h1>
          <p className="text-stone-500 mt-1">Resumen del negocio — {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <Link to="/ventas">
          <Button size="lg" className="w-full sm:w-auto">
            <Plus className="h-5 w-5 mr-2" />
            Registrar venta
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ResumenDiaCard
          facturacion={kpiDia?.facturacion ?? 0}
          ganancia={kpiDia?.gananciaNeta ?? 0}
          ventas={kpiDia?.cantidadVentas ?? 0}
          ticket={kpiDia?.ticketPromedio ?? 0}
          turnos={turnosResumen}
        />
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-stone-700 mb-4">Resumen del mes</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-stone-500">Facturado</p>
              <p className="text-2xl font-bold text-stone-900 mt-0.5">{fmt(kpiMes?.facturacion ?? 0)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-stone-500">Ganancia est.</p>
              <p className="text-2xl font-bold text-emerald-700 mt-0.5">{fmt(kpiMes?.gananciaNeta ?? 0)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-stone-500">Ventas</p>
              <p className="text-lg font-semibold text-stone-900 mt-0.5">{kpiMes?.cantidadVentas ?? 0}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-stone-500">Ticket prom.</p>
              <p className="text-lg font-semibold text-stone-900 mt-0.5">{fmt(kpiMes?.ticketPromedio ?? 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {mes?.kpisPeriodoAnterior && kpiMes && (
        <div className="rounded-xl border border-brand-100 bg-brand-50/40 px-4 py-3 text-sm text-stone-700">
          Este mes vs período anterior: facturación{' '}
          <strong>{fmt(kpiMes.facturacion)}</strong>
          {mes.kpisPeriodoAnterior.facturacion > 0 && (
            <span className="text-stone-500">
              {' '}
              (antes {fmt(mes.kpisPeriodoAnterior.facturacion)})
            </span>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          to="/ventas"
          className="rounded-xl border border-stone-200 bg-white p-4 hover:border-brand-600 hover:bg-brand-50/50 transition-colors group"
        >
          <ShoppingCart className="h-6 w-6 text-brand-700 mb-2" />
          <p className="font-medium text-stone-900">Ventas</p>
          <p className="text-xs text-stone-500 mt-0.5">Cargar y ver historial</p>
          <ArrowRight className="h-4 w-4 text-stone-400 mt-2 group-hover:text-brand-700" />
        </Link>
        <Link
          to="/estadisticas"
          className="rounded-xl border border-stone-200 bg-white p-4 hover:border-brand-600 hover:bg-brand-50/50 transition-colors group"
        >
          <BarChart3 className="h-6 w-6 text-brand-700 mb-2" />
          <p className="font-medium text-stone-900">Estadísticas</p>
          <p className="text-xs text-stone-500 mt-0.5">Gráficos y análisis</p>
          <ArrowRight className="h-4 w-4 text-stone-400 mt-2 group-hover:text-brand-700" />
        </Link>
        <Link
          to="/sync"
          className="rounded-xl border border-stone-200 bg-white p-4 hover:border-brand-600 hover:bg-brand-50/50 transition-colors group"
        >
          <RefreshCw className="h-6 w-6 text-brand-700 mb-2" />
          <p className="font-medium text-stone-900">Sync Makor</p>
          <p className="text-xs text-stone-500 mt-0.5">Actualizar productos</p>
          <ArrowRight className="h-4 w-4 text-stone-400 mt-2 group-hover:text-brand-700" />
        </Link>
        <Link
          to="/productos"
          className="rounded-xl border border-stone-200 bg-white p-4 hover:border-brand-600 hover:bg-brand-50/50 transition-colors group"
        >
          <Package className="h-6 w-6 text-brand-700 mb-2" />
          <p className="font-medium text-stone-900">Productos</p>
          <p className="text-xs text-stone-500 mt-0.5">{catalogo?.productosActivos ?? 0} activos</p>
          <ArrowRight className="h-4 w-4 text-stone-400 mt-2 group-hover:text-brand-700" />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-stone-100 bg-stone-50/80 px-4 py-3 text-center">
          <p className="text-xs text-stone-500 uppercase">Productos</p>
          <p className="text-xl font-bold text-stone-800">{catalogo?.totalProductos ?? 0}</p>
        </div>
        <div className="rounded-lg border border-stone-100 bg-stone-50/80 px-4 py-3 text-center">
          <p className="text-xs text-stone-500 uppercase flex items-center justify-center gap-1">
            <Eye className="h-3 w-3" /> Visibles
          </p>
          <p className="text-xl font-bold text-stone-800">{catalogo?.productosActivos ?? 0}</p>
        </div>
        <div className="rounded-lg border border-stone-100 bg-stone-50/80 px-4 py-3 text-center">
          <p className="text-xs text-stone-500 uppercase">Categorías</p>
          <p className="text-xl font-bold text-stone-800">{catalogo?.totalCategorias ?? 0}</p>
        </div>
      </div>
    </div>
  );
}
