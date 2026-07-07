import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../../api/client';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { toast } from 'sonner';

export function PreciosPage() {
  const [iva, setIva] = useState('21');
  const [margenGlobal, setMargenGlobal] = useState('115');
  const [reglas, setReglas] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);

  const [nuevaRegla, setNuevaRegla] = useState({
    categoriaId: '',
    subcategoriaId: '',
    margenPorcentaje: '115',
    tipo: 'MARKUP_CATEGORIA',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [config, reglasData, cats] = await Promise.all([
        api.getPrecioConfig(),
        api.getReglasPrecio(),
        api.getCategoriasAdmin(),
      ]);
      setIva(config.ivaPorcentaje.toString());
      setMargenGlobal(config.margenGlobal.toString());
      setReglas(reglasData);
      setCategorias(cats);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar configuración de precios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveConfig = async () => {
    setSavingConfig(true);
    try {
      await api.updatePrecioConfig({
        ivaPorcentaje: parseFloat(iva) || 21,
        margenGlobal: parseFloat(margenGlobal) || 115,
      });
      toast.success('Configuración guardada');
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSavingConfig(false);
    }
  };

  const addRegla = async () => {
    try {
      await api.createReglaPrecio({
        categoriaId: nuevaRegla.categoriaId ? parseInt(nuevaRegla.categoriaId) : null,
        subcategoriaId: nuevaRegla.subcategoriaId ? parseInt(nuevaRegla.subcategoriaId) : null,
        margenPorcentaje: parseFloat(nuevaRegla.margenPorcentaje) || 115,
        tipo: nuevaRegla.tipo,
      });
      toast.success('Regla agregada');
      setNuevaRegla({ categoriaId: '', subcategoriaId: '', margenPorcentaje: '115', tipo: 'MARKUP_CATEGORIA' });
      load();
    } catch {
      toast.error('Error al crear regla');
    }
  };

  const deleteRegla = async (id: number) => {
    if (!confirm('¿Eliminar esta regla de precio?')) return;
    try {
      await api.deleteReglaPrecio(id);
      toast.success('Regla eliminada');
      load();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const subcategorias = nuevaRegla.categoriaId
    ? categorias.find((c) => c.id === parseInt(nuevaRegla.categoriaId))?.subcategorias || []
    : [];

  if (loading) {
    return <div className="py-20 text-center text-stone-500">Cargando…</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-outfit text-3xl font-bold tracking-tight text-stone-900">Precios</h1>
        <p className="mt-1 text-stone-500">
          Configuración global de márgenes e IVA. Los precios de venta por producto se definen en cada
          producto (unidades y presentaciones).
        </p>
      </div>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="font-outfit text-lg font-semibold text-stone-900">Configuración global</h2>
        <p className="mt-1 text-sm text-stone-500">
          Fórmula: costo por unidad base × cantidad × (1 + IVA%) × (1 + margen%)
        </p>
        <div className="mt-4 grid max-w-md gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-600">IVA %</label>
            <Input type="number" value={iva} onChange={(e) => setIva(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-600">Margen global %</label>
            <Input type="number" value={margenGlobal} onChange={(e) => setMargenGlobal(e.target.value)} />
            <p className="mt-1 text-[11px] text-stone-400">Se usa si no hay regla por categoría</p>
          </div>
        </div>
        <Button className="mt-4" onClick={saveConfig} disabled={savingConfig}>
          {savingConfig ? 'Guardando…' : 'Guardar configuración'}
        </Button>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="font-outfit text-lg font-semibold text-stone-900">Reglas por categoría</h2>
        <p className="mt-1 text-sm text-stone-500">
          Margen distinto según categoría o subcategoría (tiene prioridad sobre el margen global).
        </p>

        <div className="mt-4 grid gap-3 rounded-lg border border-dashed border-stone-200 bg-stone-50 p-4 sm:grid-cols-4">
          <Select
            value={nuevaRegla.categoriaId}
            onChange={(e) => setNuevaRegla({ ...nuevaRegla, categoriaId: e.target.value, subcategoriaId: '' })}
          >
            <option value="">Categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
          <Select
            value={nuevaRegla.subcategoriaId}
            onChange={(e) => setNuevaRegla({ ...nuevaRegla, subcategoriaId: e.target.value })}
            disabled={!nuevaRegla.categoriaId}
          >
            <option value="">Toda la categoría</option>
            {subcategorias.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </Select>
          <Input
            type="number"
            placeholder="Margen %"
            value={nuevaRegla.margenPorcentaje}
            onChange={(e) => setNuevaRegla({ ...nuevaRegla, margenPorcentaje: e.target.value })}
          />
          <Button type="button" variant="outline" onClick={addRegla}>
            <Plus size={16} className="mr-1" />
            Agregar regla
          </Button>
        </div>

        {reglas.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500">No hay reglas. Se usa el margen global para todos.</p>
        ) : (
          <ul className="mt-4 divide-y divide-stone-100 rounded-lg border border-stone-200">
            {reglas.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <span className="font-medium text-stone-900">
                    {r.subcategoriaNombre || r.categoriaNombre || 'Global'}
                  </span>
                  <span className="ml-2 text-stone-500">+{r.margenPorcentaje}%</span>
                </div>
                <button
                  type="button"
                  onClick={() => deleteRegla(r.id)}
                  className="text-stone-400 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-sm text-amber-900">
        <strong>Próximo paso:</strong> stock y compras. Por ahora configurá unidades y presentaciones de venta
        en cada producto (modal de edición → sección &quot;Unidades y precios de venta&quot;).
      </section>
    </div>
  );
}
