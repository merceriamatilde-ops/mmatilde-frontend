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

function ResumenCard({
  label,
  facturacion,
  ganancia,
  ventas,
  ticket,
}: {
  label: string;
  facturacion: number;
  ganancia: number;
  ventas: number;
  ticket: number;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-stone-700 mb-4">{label}</h3>
      <div className="grid grid-cols-2 gap-4">
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
    </div>
  );
}

export function DashboardPage() {
  const hoy = todayInput();
  const [loading, setLoading] = useState(true);
  const [catalogo, setCatalogo] = useState<any>(null);
  const [dia, setDia] = useState<any>(null);
  const [mes, setMes] = useState<any>(null);
  const [turnoManana, setTurnoManana] = useState<any>(null);
  const [turnoTarde, setTurnoTarde] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [cat, resDia, resMes, manana, tarde] = await Promise.all([
          api.getDashboardStats(),
          api.getEstadisticasResumen({ desde: hoy, hasta: hoy, comparar: 'false' }),
          api.getEstadisticasResumen({ desde: monthStartInput(), hasta: hoy, comparar: 'true' }),
          api.getVentaResumen(hoy, 'MANANA'),
          api.getVentaResumen(hoy, 'TARDE'),
        ]);
        setCatalogo(cat);
        setDia(resDia);
        setMes(resMes);
        setTurnoManana(manana);
        setTurnoTarde(tarde);
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

      <div className="grid gap-4 lg:grid-cols-2">
        <ResumenCard
          label="Resumen del día"
          facturacion={kpiDia?.facturacion ?? 0}
          ganancia={kpiDia?.gananciaNeta ?? 0}
          ventas={kpiDia?.cantidadVentas ?? 0}
          ticket={kpiDia?.ticketPromedio ?? 0}
        />
        <ResumenCard
          label="Resumen del mes"
          facturacion={kpiMes?.facturacion ?? 0}
          ganancia={kpiMes?.gananciaNeta ?? 0}
          ventas={kpiMes?.cantidadVentas ?? 0}
          ticket={kpiMes?.ticketPromedio ?? 0}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-stone-200 bg-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-700">
              <Sun className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-stone-900">Turno mañana</p>
              <p className="text-xs text-stone-500">{turnoManana?.cantidadVentas ?? 0} ventas hoy</p>
            </div>
          </div>
          <p className="text-lg font-bold text-stone-900">{fmt(turnoManana?.totalFacturado ?? 0)}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700">
              <Sunset className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-stone-900">Turno tarde</p>
              <p className="text-xs text-stone-500">{turnoTarde?.cantidadVentas ?? 0} ventas hoy</p>
            </div>
          </div>
          <p className="text-lg font-bold text-stone-900">{fmt(turnoTarde?.totalFacturado ?? 0)}</p>
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
