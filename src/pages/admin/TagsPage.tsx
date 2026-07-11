import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../api/client';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Switch } from '../../components/ui/Switch';
import { Spinner } from '../../components/ui/Spinner';

const emptyForm = {
  nombre: '',
  descripcion: '',
  colorHex: '#8B4513',
  visibleEnCatalogo: true,
  orden: '0',
  activo: true,
};

export function TagsPage() {
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [tagAEliminar, setTagAEliminar] = useState<any>(null);

  const load = async () => {
    try {
      const data = await api.getTags();
      setTags(data);
    } catch {
      toast.error('Error al cargar tags');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      colorHex: form.colorHex || null,
      visibleEnCatalogo: form.visibleEnCatalogo,
      orden: parseInt(form.orden) || 0,
      activo: form.activo,
    };

    try {
      if (editingId) {
        await api.updateTag(editingId, payload);
        toast.success('Tag actualizado');
      } else {
        await api.createTag(payload);
        toast.success('Tag creado');
      }
      setForm(emptyForm);
      setEditingId(null);
      load();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar');
    }
  };

  const handleEdit = (tag: any) => {
    setEditingId(tag.id);
    setForm({
      nombre: tag.nombre,
      descripcion: tag.descripcion || '',
      colorHex: tag.colorHex || '#8B4513',
      visibleEnCatalogo: tag.visibleEnCatalogo,
      orden: tag.orden?.toString() || '0',
      activo: tag.activo,
    });
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteTag(id);
      toast.success('Tag eliminado');
      load();
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Spinner size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConfirmModal
        open={Boolean(tagAEliminar)}
        title="Eliminar tag"
        description={
          tagAEliminar
            ? `Se va a eliminar "${tagAEliminar.nombre}" y se quitará de todos los productos.`
            : undefined
        }
        confirmLabel="Eliminar"
        onClose={() => setTagAEliminar(null)}
        onConfirm={() => {
          if (!tagAEliminar) return;
          void handleDelete(tagAEliminar.id).finally(() => setTagAEliminar(null));
        }}
      />

      <div>
        <h1 className="font-outfit text-3xl font-bold tracking-tight text-stone-900">Tags / Colecciones</h1>
        <p className="mt-1 text-stone-500">
          Agrupá productos por interés (artesanías, arreglos, ingreso nuevo…) para mostrarlos en el catálogo.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm lg:col-span-1"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-stone-900">{editingId ? 'Editar tag' : 'Nuevo tag'}</h2>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }}>
                <X size={18} className="text-stone-400" />
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Nombre</label>
              <Input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="ej. Para artesanías"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Descripción (catálogo)</label>
              <Input
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Texto corto para la landing"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">Color</label>
                <Input
                  type="color"
                  value={form.colorHex}
                  onChange={(e) => setForm({ ...form, colorHex: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">Orden</label>
                <Input
                  type="number"
                  value={form.orden}
                  onChange={(e) => setForm({ ...form, orden: e.target.value })}
                />
              </div>
            </div>
            <label className="flex items-center justify-between text-sm text-stone-700">
              Visible en catálogo
              <Switch
                checked={form.visibleEnCatalogo}
                onCheckedChange={(v) => setForm({ ...form, visibleEnCatalogo: v })}
              />
            </label>
            <label className="flex items-center justify-between text-sm text-stone-700">
              Activo
              <Switch checked={form.activo} onCheckedChange={(v) => setForm({ ...form, activo: v })} />
            </label>
          </div>

          <Button type="submit" className="mt-4 w-full gap-2">
            {editingId ? <Edit2 size={16} /> : <Plus size={16} />}
            {editingId ? 'Actualizar' : 'Crear tag'}
          </Button>
        </form>

        <div className="rounded-xl border border-stone-200 bg-white shadow-sm lg:col-span-2">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 text-left text-stone-500">
                  <th className="px-4 py-3 font-medium">Tag</th>
                  <th className="px-4 py-3 font-medium">Productos</th>
                  <th className="px-4 py-3 font-medium">Catálogo</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {tags.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-stone-400">
                      No hay tags creados
                    </td>
                  </tr>
                ) : (
                  tags.map((tag) => (
                    <tr key={tag.id} className="border-b border-stone-50 hover:bg-stone-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: tag.colorHex || '#8B4513' }}
                          />
                          <div>
                            <p className="font-medium text-stone-900">{tag.nombre}</p>
                            <p className="text-xs text-stone-400">/{tag.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-stone-600">{tag.productosCount}</td>
                      <td className="px-4 py-3">
                        {tag.visibleEnCatalogo ? (
                          <span className="text-brand-700">Sí</span>
                        ) : (
                          <span className="text-stone-400">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {tag.activo ? (
                          <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700">Activo</span>
                        ) : (
                          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">Inactivo</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleEdit(tag)}
                            className="rounded p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setTagAEliminar(tag)}
                            className="rounded p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Vista mobile: tarjetas */}
          <div className="divide-y divide-stone-100 md:hidden">
            {tags.length === 0 ? (
              <div className="px-4 py-8 text-center text-stone-400">No hay tags creados</div>
            ) : (
              tags.map((tag) => (
                <div key={tag.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="mt-1 h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: tag.colorHex || '#8B4513' }}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-stone-900">{tag.nombre}</p>
                        <p className="truncate text-xs text-stone-400">/{tag.slug}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(tag)}
                        className="rounded p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setTagAEliminar(tag)}
                        className="rounded p-2 text-stone-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-stone-600">
                      {tag.productosCount} productos
                    </span>
                    <span className={tag.visibleEnCatalogo ? 'rounded-full bg-brand-50 px-2 py-0.5 text-brand-700' : 'rounded-full bg-stone-100 px-2 py-0.5 text-stone-500'}>
                      {tag.visibleEnCatalogo ? 'En catálogo' : 'Oculto'}
                    </span>
                    {tag.activo ? (
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-green-700">Activo</span>
                    ) : (
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-stone-500">Inactivo</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
