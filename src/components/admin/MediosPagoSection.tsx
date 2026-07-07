import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../api/client';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { Spinner } from '../ui/Spinner';

type MedioPago = {
  id: number;
  nombre: string;
  slug: string;
  activo: boolean;
  esDefault: boolean;
  orden: number;
};

export function MediosPagoSection() {
  const [medios, setMedios] = useState<MedioPago[]>([]);
  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState('');
  const [orden, setOrden] = useState('0');
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = async () => {
    try {
      const data = await api.getMediosPago();
      setMedios(data);
    } catch {
      toast.error('Error al cargar medios de pago');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setNombre('');
    setOrden('0');
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    const payload = {
      nombre: nombre.trim(),
      orden: parseInt(orden, 10) || 0,
      activo: true,
    };

    try {
      if (editingId) {
        const actual = medios.find((m) => m.id === editingId);
        await api.updateMedioPago(editingId, { ...payload, activo: actual?.activo ?? true });
        toast.success('Medio de pago actualizado');
      } else {
        await api.createMedioPago(payload);
        toast.success('Medio de pago creado');
      }
      resetForm();
      load();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar');
    }
  };

  const toggleActivo = async (medio: MedioPago) => {
    if (medio.activo && medios.filter((m) => m.activo).length <= 1) {
      toast.error('Debe quedar al menos un medio de pago activo');
      return;
    }
    try {
      await api.updateMedioPago(medio.id, {
        nombre: medio.nombre,
        orden: medio.orden,
        activo: !medio.activo,
      });
      load();
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar');
    }
  };

  const setDefault = async (id: number) => {
    try {
      await api.setMedioPagoDefault(id);
      toast.success('Medio predeterminado actualizado');
      load();
    } catch (err: any) {
      toast.error(err.message || 'Error');
    }
  };

  const handleDelete = async (id: number) => {
    if (medios.length <= 1) {
      toast.error('Debe quedar al menos un medio de pago');
      return;
    }
    if (!confirm('¿Eliminar este medio de pago?')) return;
    try {
      await api.deleteMedioPago(id);
      toast.success('Eliminado');
      load();
    } catch (err: any) {
      toast.error(err.message || 'No se pudo eliminar');
    }
  };

  if (loading) return <Spinner size={24} />;

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-500">
        Gestioná los medios de cobro del mostrador. El predeterminado se selecciona automáticamente al registrar ventas.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1 w-full space-y-1">
          <label className="admin-field-label">Nombre</label>
          <Input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Tarjeta débito"
          />
        </div>
        <div className="w-24 space-y-1">
          <label className="admin-field-label">Orden</label>
          <Input type="number" value={orden} onChange={(e) => setOrden(e.target.value)} />
        </div>
        <Button type="submit">
          <Plus className="h-4 w-4 mr-1" />
          {editingId ? 'Actualizar' : 'Agregar'}
        </Button>
        {editingId && (
          <Button type="button" variant="outline" onClick={resetForm}>
            Cancelar
          </Button>
        )}
      </form>

      <div className="divide-y divide-stone-100 border border-stone-200 rounded-lg overflow-hidden">
        {medios.length === 0 ? (
          <p className="p-4 text-sm text-stone-500">No hay medios de pago cargados.</p>
        ) : (
          medios.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-3 bg-white hover:bg-stone-50/80">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-stone-900 flex items-center gap-2">
                  {m.nombre}
                  {m.esDefault && (
                    <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-brand-50 text-brand-800">
                      Default
                    </span>
                  )}
                </div>
                <div className="text-xs text-stone-400">{m.slug}</div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={m.activo}
                  onCheckedChange={() => toggleActivo(m)}
                  disabled={m.activo && medios.filter((x) => x.activo).length <= 1}
                />
                <button
                  type="button"
                  onClick={() => setDefault(m.id)}
                  disabled={m.esDefault || !m.activo}
                  className="p-2 rounded-md text-stone-400 hover:text-amber-600 hover:bg-amber-50 disabled:opacity-30"
                  title="Marcar como predeterminado"
                >
                  <Star className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(m.id);
                    setNombre(m.nombre);
                    setOrden(String(m.orden));
                  }}
                  className="text-xs text-brand-700 hover:underline px-2"
                >
                  Editar
                </button>
                {medios.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDelete(m.id)}
                    className="p-2 rounded-md text-stone-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
