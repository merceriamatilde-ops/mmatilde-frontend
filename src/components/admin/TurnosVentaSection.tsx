import React, { useEffect, useMemo, useState } from 'react';
import { Clock, Plus, Sun, Sunset, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../api/client';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { ConfirmModal } from '../ui/ConfirmModal';
import { Switch } from '../ui/Switch';
import { Spinner } from '../ui/Spinner';
import {
  DEFAULT_TURNOS,
  parseHoraMinutos,
  turnosActivosOrdenados,
  type TurnoVentaItem,
} from '../../lib/turnosVenta';

const SEGMENT_COLORS = [
  'bg-amber-100 border-amber-300 text-amber-900',
  'bg-indigo-100 border-indigo-300 text-indigo-900',
  'bg-emerald-100 border-emerald-300 text-emerald-900',
  'bg-rose-100 border-rose-300 text-rose-900',
  'bg-sky-100 border-sky-300 text-sky-900',
];

function TimelinePreview({ turnos }: { turnos: TurnoVentaItem[] }) {
  const activos = turnosActivosOrdenados(turnos);
  if (activos.length === 0) {
    return (
      <p className="text-sm text-stone-500 rounded-lg border border-dashed border-stone-200 p-4">
        Activá al menos 2 turnos para ver la línea de tiempo.
      </p>
    );
  }

  const segments = activos.map((t, i) => {
    const start = parseHoraMinutos(t.horaDesde);
    const end =
      i < activos.length - 1
        ? parseHoraMinutos(activos[i + 1].horaDesde)
        : 24 * 60;
    const width = ((end - start) / (24 * 60)) * 100;
    return { turno: t, width, color: SEGMENT_COLORS[i % SEGMENT_COLORS.length] };
  });

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-stone-700">
        <Clock className="h-4 w-4 text-brand-700" />
        Cómo se reparte el día
      </div>
      <div className="relative h-10 rounded-lg overflow-hidden border border-stone-200 bg-white flex">
        {segments.map(({ turno, width, color }) => (
          <div
            key={turno.id || turno.slug}
            className={`h-full border-r last:border-r-0 flex items-center justify-center text-[10px] sm:text-xs font-semibold px-1 truncate ${color}`}
            style={{ width: `${width}%` }}
            title={`${turno.nombre}: ${turno.descripcionHorario}`}
          >
            <span className="truncate">{turno.nombre}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-stone-400 px-0.5">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>24:00</span>
      </div>
      <ul className="space-y-1.5">
        {activos.map((t, i) => (
          <li key={t.id || t.slug} className="text-sm text-stone-600 flex gap-2">
            <span
              className={`inline-block w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                SEGMENT_COLORS[i % SEGMENT_COLORS.length].split(' ')[0]
              }`}
            />
            <span>
              <strong className="text-stone-800">{t.nombre}</strong>
              <span className="text-stone-500"> — {t.descripcionHorario}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TurnosVentaSection() {
  const [turnos, setTurnos] = useState<TurnoVentaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState('');
  const [horaDesde, setHoraDesde] = useState('09:00');
  const [orden, setOrden] = useState('0');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [turnoAEliminar, setTurnoAEliminar] = useState<TurnoVentaItem | null>(null);

  const activosCount = useMemo(() => turnos.filter((t) => t.activo).length, [turnos]);

  const load = async () => {
    try {
      const data = await api.getTurnosVenta();
      setTurnos(data?.length ? data : DEFAULT_TURNOS);
    } catch {
      toast.error('Error al cargar turnos');
      setTurnos(DEFAULT_TURNOS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setNombre('');
    setHoraDesde('09:00');
    setOrden('0');
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!nombre.trim()) return;

    const payload = {
      nombre: nombre.trim(),
      horaDesde,
      orden: parseInt(orden, 10) || 0,
      activo: true,
    };

    try {
      if (editingId) {
        const actual = turnos.find((t) => t.id === editingId);
        await api.updateTurnoVenta(editingId, { ...payload, activo: actual?.activo ?? true });
        toast.success('Turno actualizado');
      } else {
        await api.createTurnoVenta(payload);
        toast.success('Turno creado');
      }
      resetForm();
      load();
    } catch (err: any) {
      let msg = 'Error al guardar';
      try {
        const parsed = JSON.parse(err.message);
        msg = parsed.message || msg;
      } catch {
        if (err.message) msg = err.message;
      }
      toast.error(msg);
    }
  };

  const toggleActivo = async (turno: TurnoVentaItem) => {
    if (turno.activo && activosCount <= 2) {
      toast.error('Deben quedar al menos 2 turnos activos');
      return;
    }
    try {
      await api.updateTurnoVenta(turno.id, {
        nombre: turno.nombre,
        horaDesde: turno.horaDesde,
        orden: turno.orden,
        activo: !turno.activo,
      });
      load();
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar');
    }
  };

  const handleDelete = async (id: number) => {
    if (turnos.length <= 2) {
      toast.error('Deben quedar al menos 2 turnos');
      return;
    }
    try {
      await api.deleteTurnoVenta(id);
      toast.success('Eliminado');
      load();
    } catch (err: any) {
      let msg = 'No se pudo eliminar';
      try {
        const parsed = JSON.parse(err.message);
        msg = parsed.message || msg;
      } catch {
        if (err.message) msg = err.message;
      }
      toast.error(msg);
    }
  };

  if (loading) return <Spinner size={24} />;

  return (
    <div className="space-y-5">
      <ConfirmModal
        open={Boolean(turnoAEliminar)}
        title="Eliminar turno"
        description={
          turnoAEliminar
            ? `Se va a eliminar "${turnoAEliminar.nombre}" (${turnoAEliminar.descripcionHorario}).`
            : undefined
        }
        confirmLabel="Eliminar"
        onClose={() => setTurnoAEliminar(null)}
        onConfirm={() => {
          if (!turnoAEliminar) return;
          void handleDelete(turnoAEliminar.id).finally(() => setTurnoAEliminar(null));
        }}
      />

      <p className="text-sm text-stone-500">
        Definí los turnos del mostrador. Cada venta se asigna automáticamente según la hora, pero podés
        cambiarla manualmente al registrar. Los horarios de inicio no pueden repetirse y el primer turno
        debe empezar a las 00:00.
      </p>

      <TimelinePreview turnos={turnos} />

      <div className="flex flex-col lg:flex-row gap-3 items-end">
        <div className="flex-1 w-full space-y-1">
          <label className="admin-field-label">Nombre del turno</label>
          <Input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Mañana, Tarde, Noche"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void handleSubmit();
              }
            }}
          />
        </div>
        <div className="w-32 space-y-1">
          <label className="admin-field-label">Empieza a las</label>
          <Input type="time" value={horaDesde} onChange={(e) => setHoraDesde(e.target.value)} />
        </div>
        <div className="w-20 space-y-1">
          <label className="admin-field-label">Orden</label>
          <Input type="number" value={orden} onChange={(e) => setOrden(e.target.value)} />
        </div>
        <Button type="button" onClick={() => void handleSubmit()}>
          <Plus className="h-4 w-4 mr-1" />
          {editingId ? 'Actualizar' : 'Agregar'}
        </Button>
        {editingId && (
          <Button type="button" variant="outline" onClick={resetForm}>
            Cancelar
          </Button>
        )}
      </div>

      <div className="divide-y divide-stone-100 border border-stone-200 rounded-lg overflow-hidden">
        {turnos.map((t, i) => {
          const Icon = i % 2 === 0 ? Sun : Sunset;
          return (
            <div key={t.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-white hover:bg-stone-50/80">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="h-9 w-9 rounded-full bg-brand-50 flex items-center justify-center text-brand-800 shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-stone-900">{t.nombre}</div>
                  <div className="text-xs text-stone-400">{t.slug}</div>
                  <div className="text-sm text-stone-600 mt-1">{t.descripcionHorario}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:shrink-0 pl-12 sm:pl-0">
                <div className="text-sm text-stone-500 tabular-nums">{t.horaDesde}</div>
                <Switch
                  checked={t.activo}
                  onCheckedChange={() => toggleActivo(t)}
                  disabled={t.activo && activosCount <= 2}
                />
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(t.id);
                    setNombre(t.nombre);
                    setHoraDesde(t.horaDesde);
                    setOrden(String(t.orden));
                  }}
                  className="text-xs text-brand-700 hover:underline px-2"
                >
                  Editar
                </button>
                {turnos.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setTurnoAEliminar(t)}
                    className="p-2 rounded-md text-stone-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
