import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../api/client';
import { Spinner } from '../../components/ui/Spinner';

export function ColoresPage() {
  const [colores, setColores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [nombre, setNombre] = useState('');
  const [codigoHex, setCodigoHex] = useState('#000000');
  const [editingId, setEditingId] = useState<number | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
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
      toast.error(err.message || 'Error al guardar el color');
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
    if (!confirm('¿Eliminar este color?')) return;
    try {
      await api.deleteColor(id);
      toast.success('Color eliminado');
      loadColores();
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar');
    }
  };

  if (loading) return <div className="flex h-[50vh] items-center justify-center"><Spinner size={40} /></div>;

  return (
    <div className="space-y-6">
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
                  className="w-full px-3 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-brand-600 focus:outline-none"
                  placeholder="Ej: Rojo Carmesí"
                  required
                />
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
              </div>
              <div className="flex gap-2 pt-2">
                <button 
                  type="submit"
                  className="flex-1 flex items-center justify-center space-x-2 bg-brand-800 text-white px-4 py-2 rounded-md hover:bg-brand-900 transition-colors"
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

        <div className="md:col-span-2 min-w-0">
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
                {colores.map(color => (
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
                        onClick={() => handleDelete(color.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {colores.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-stone-500">
                      No hay colores en el catálogo. Agregá el primero.
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
