import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Edit2, X, Search, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../api/client';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Spinner } from '../../components/ui/Spinner';

function parseApiError(err: any, fallback: string): string {
  const raw = err?.message;
  if (typeof raw === 'string' && raw.trim().startsWith('{')) {
    try {
      return JSON.parse(raw).message || fallback;
    } catch {
      /* no era JSON */
    }
  }
  return raw || fallback;
}

export function ColoresPage() {
  const [colores, setColores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [nombre, setNombre] = useState('');
  const [codigoHex, setCodigoHex] = useState('#000000');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [colorAEliminar, setColorAEliminar] = useState<any>(null);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    loadColores();
  }, []);

  const loadColores = async () => {
    try {
      const data = await api.getColores();
      setColores(data);
    } catch (err) {
      toast.error('Error al cargar colores');
    } finally {
      setLoading(false);
    }
  };

  const nombreDuplicado = useMemo(() => {
    const objetivo = nombre.trim().toLowerCase();
    if (!objetivo) return null;
    return (
      colores.find(
        (c) => c.id !== editingId && (c.nombre || '').trim().toLowerCase() === objetivo
      ) ?? null
    );
  }, [nombre, colores, editingId]);

  const coloresFiltrados = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    if (!q) return colores;
    return colores.filter(
      (c) =>
        (c.nombre || '').toLowerCase().includes(q) ||
        (c.codigoHex || '').toLowerCase().includes(q)
    );
  }, [colores, filtro]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    if (nombreDuplicado) {
      toast.error(`Ya existe un color llamado "${nombreDuplicado.nombre}"`);
      return;
    }
    try {
      if (editingId) {
        await api.updateColor(editingId, { nombre, codigoHex });
        toast.success('Color actualizado');
      } else {
        await api.createColor({ nombre, codigoHex });
        toast.success('Color creado');
      }
      setNombre('');
      setCodigoHex('#000000');
      setEditingId(null);
      loadColores();
    } catch (err: any) {
      toast.error(parseApiError(err, 'Error al guardar el color'));
    }
  };

  const handleEditClick = (color: any) => {
    setEditingId(color.id);
    setNombre(color.nombre);
    setCodigoHex(color.codigoHex || '#000000');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNombre('');
    setCodigoHex('#000000');
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteColor(id);
      toast.success('Color eliminado');
      loadColores();
    } catch (err: any) {
      toast.error(parseApiError(err, 'Error al eliminar'));
    }
  };

  if (loading) return <div className="flex h-[50vh] items-center justify-center"><Spinner size={40} /></div>;

  return (
    <div className="space-y-6">
      <ConfirmModal
        open={Boolean(colorAEliminar)}
        title="Eliminar color"
        description={
          colorAEliminar ? `Se va a eliminar "${colorAEliminar.nombre}".` : undefined
        }
        confirmLabel="Eliminar"
        onClose={() => setColorAEliminar(null)}
        onConfirm={() => {
          if (!colorAEliminar) return;
          void handleDelete(colorAEliminar.id).finally(() => setColorAEliminar(null));
        }}
      />

      <h1 className="text-2xl font-bold font-outfit text-stone-900">Catálogo Global de Colores</h1>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm sticky top-6">
            <h2 className="text-lg font-medium mb-4">{editingId ? 'Editar Color' : 'Nuevo Color'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:outline-none ${
                    nombreDuplicado
                      ? 'border-red-400 focus:ring-red-500 bg-red-50'
                      : 'border-stone-300 focus:ring-brand-600'
                  }`}
                  placeholder="Ej: Rojo Carmesí"
                  required
                />
                {nombreDuplicado && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                    <AlertCircle size={14} className="shrink-0" />
                    Ya existe un color llamado &quot;{nombreDuplicado.nombre}&quot;
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Color (Hex)</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={codigoHex}
                    onChange={(e) => setCodigoHex(e.target.value)}
                    className="h-10 w-10 p-1 border border-stone-300 rounded-md cursor-pointer"
                  />
                  <input
                    type="text"
                    value={codigoHex}
                    onChange={(e) => setCodigoHex(e.target.value)}
                    className="flex-1 px-3 py-2 border border-stone-300 rounded-md font-mono focus:ring-2 focus:ring-brand-600 focus:outline-none"
                  />
                </div>
                <p className="mt-1 text-xs text-stone-400">Dos colores con distinto nombre pueden compartir el mismo hex.</p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={Boolean(nombreDuplicado)}
                  className="flex-1 flex items-center justify-center space-x-2 bg-brand-800 text-white px-4 py-2 rounded-md hover:bg-brand-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-brand-800"
                >
                  {editingId ? <Edit2 size={18} /> : <Plus size={18} />}
                  <span>{editingId ? 'Guardar Cambios' : 'Agregar'}</span>
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex-none flex items-center justify-center bg-stone-100 text-stone-600 px-3 py-2 rounded-md hover:bg-stone-200 transition-colors"
                    title="Cancelar edición"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        <div className="md:col-span-2 min-w-0 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Buscar por nombre o hex..."
              className="w-full pl-9 pr-9 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-brand-600 focus:outline-none"
            />
            {filtro && (
              <button
                type="button"
                onClick={() => setFiltro('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                title="Limpiar filtro"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200">
              <thead className="bg-stone-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Muestra</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">Hex</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-stone-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-stone-200">
                {coloresFiltrados.map(color => (
                  <tr key={color.id} className={editingId === color.id ? 'bg-brand-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className="w-8 h-8 rounded-full border border-stone-200 shadow-sm"
                        style={{ backgroundColor: color.codigoHex || '#ccc' }}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900 font-medium">
                      {color.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500 font-mono">
                      {color.codigoHex}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button
                        onClick={() => handleEditClick(color)}
                        className="text-brand-600 hover:text-brand-900"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => setColorAEliminar(color)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {coloresFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-stone-500">
                      {colores.length === 0
                        ? 'No hay colores en el catálogo. Agregá el primero.'
                        : 'Ningún color coincide con el filtro.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
