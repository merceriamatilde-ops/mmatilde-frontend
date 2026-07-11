import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../api/client';
import { ProductosTable } from '../../components/admin/ProductosTable';
import { ProductoModal } from '../../components/admin/ProductoModal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Search, Plus } from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner';
import { normalizeSearchQuery } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import { isAdmin } from '../../lib/adminAccess';

export function ProductosPage() {
  const { user } = useAuth();
  const canEdit = isAdmin(user?.rol);
  const [data, setData] = useState<any>({ items: [], total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [scrollToPrecios, setScrollToPrecios] = useState(false);

  const [filters, setFilters] = useState({
    q: '',
    categoriaId: '',
    subcategoriaId: '',
    proveedorId: '',
    tagId: '',
    activo: '',
    destacado: '',
    sinPrecio: false,
    sinImagen: false,
    sinSync: false,
    syncDesde: '',
    syncHasta: '',
    page: 1
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: filters.page.toString(), pageSize: '50' };
      const q = normalizeSearchQuery(filters.q);
      if (q) params.q = q;
      if (filters.categoriaId) params.categoriaId = filters.categoriaId;
      if (filters.subcategoriaId) params.subcategoriaId = filters.subcategoriaId;
      if (filters.proveedorId) params.proveedorId = filters.proveedorId;
      if (filters.tagId) params.tagId = filters.tagId;
      if (filters.activo !== '') params.activo = filters.activo;
      if (filters.destacado !== '') params.destacado = filters.destacado;
      if (filters.sinPrecio) params.sinPrecio = 'true';
      if (filters.sinImagen) params.sinImagen = 'true';
      if (filters.sinSync) params.sinSync = 'true';
      if (!filters.sinSync && filters.syncDesde) params.syncDesde = filters.syncDesde;
      if (!filters.sinSync && filters.syncHasta) params.syncHasta = filters.syncHasta;

      const res = await api.getProductosAdmin(params);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (canEdit) {
      api.getCategoriasAdmin().then((res) => setCategorias(res)).catch(console.error);
    } else {
      api.getAllCategorias().then((res) => setCategorias(res)).catch(console.error);
    }
    api.getTags().then((res) => setTags(res)).catch(console.error);
  }, [canEdit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, page: 1, q: normalizeSearchQuery(prev.q) }));
  };

  const handleNewProduct = () => {
    setEditingProduct(null);
    setScrollToPrecios(false);
    setModalOpen(true);
  };

  const handleEditProduct = async (id: number, opts?: { scrollToPrecios?: boolean }) => {
    try {
      const prod = await api.getProductoAdmin(id);
      setEditingProduct(prod);
      setScrollToPrecios(!!opts?.scrollToPrecios);
      setModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const selectedCategory = categorias.find(c => c.id.toString() === filters.categoriaId);
  const subcategorias = selectedCategory ? selectedCategory.subcategorias || [] : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight font-outfit">Productos</h1>
          <p className="text-stone-500 mt-1">
            {canEdit ? 'Gestioná el catálogo, precios y visibilidad.' : 'Consultá el catálogo de productos.'}
          </p>
        </div>
        {canEdit && (
          <Button onClick={handleNewProduct} className="gap-2">
            <Plus size={18} />
            Nuevo Producto
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <form onSubmit={handleFilterSubmit} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium text-stone-700 mb-1 block">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <Input 
                placeholder="Nombre o código..." 
                className="pl-9"
                value={filters.q}
                onChange={e => setFilters(prev => ({ ...prev, q: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="w-48">
            <label className="text-sm font-medium text-stone-700 mb-1 block">Categoría</label>
            <Select
              value={filters.categoriaId}
              onChange={e => setFilters(prev => ({ ...prev, categoriaId: e.target.value, subcategoriaId: '' }))}
            >
              <option value="">Todas</option>
              {categorias.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </Select>
          </div>

          <div className="w-48">
            <label className="text-sm font-medium text-stone-700 mb-1 block">Subcategoría</label>
            <Select
              value={filters.subcategoriaId}
              onChange={e => setFilters(prev => ({ ...prev, subcategoriaId: e.target.value }))}
              disabled={!filters.categoriaId || subcategorias.length === 0}
            >
              <option value="">Todas</option>
              {subcategorias.map((s: any) => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </Select>
          </div>

          <div className="w-48">
            <label className="text-sm font-medium text-stone-700 mb-1 block">Proveedor</label>
            <Select
              value={filters.proveedorId}
              onChange={e => setFilters(prev => ({ ...prev, proveedorId: e.target.value }))}
            >
              <option value="">Todos</option>
              <option value="1">Makor</option>
              <option value="2">Manual / Otros</option>
            </Select>
          </div>

          <div className="w-52">
            <label className="text-sm font-medium text-stone-700 mb-1 block">Tag / Colección</label>
            <Select
              value={filters.tagId}
              onChange={e => setFilters(prev => ({ ...prev, tagId: e.target.value, page: 1 }))}
            >
              <option value="">Todos</option>
              {tags.map(t => (
                <option key={t.id} value={t.id}>
                  {t.nombre}{t.productosCount != null ? ` (${t.productosCount})` : ''}
                  {!t.activo ? ' · inactivo' : ''}
                </option>
              ))}
            </Select>
          </div>

          <div className="w-40">
            <label className="text-sm font-medium text-stone-700 mb-1 block">Destacado</label>
            <Select
              value={filters.destacado}
              onChange={e => setFilters(prev => ({ ...prev, destacado: e.target.value, page: 1 }))}
            >
              <option value="">Todos</option>
              <option value="true">Solo destacados</option>
              <option value="false">No destacados</option>
            </Select>
          </div>

          <div className="w-40">
            <label className="text-sm font-medium text-stone-700 mb-1 block">Estado</label>
            <Select
              value={filters.activo}
              onChange={e => setFilters(prev => ({ ...prev, activo: e.target.value, page: 1 }))}
            >
              <option value="">Todos</option>
              <option value="true">Visibles</option>
              <option value="false">Ocultos</option>
            </Select>
          </div>

          <Button type="submit">Filtrar</Button>
        </form>

        <div className="mt-4 pt-4 border-t border-stone-100 flex flex-wrap gap-x-6 gap-y-3 items-end">
          <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer select-none">
            <input
              type="checkbox"
              className="rounded border-stone-300 text-brand-700 focus:ring-brand-500"
              checked={filters.sinPrecio}
              onChange={e => setFilters(prev => ({ ...prev, sinPrecio: e.target.checked, page: 1 }))}
            />
            Sin precio
          </label>
          <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer select-none">
            <input
              type="checkbox"
              className="rounded border-stone-300 text-brand-700 focus:ring-brand-500"
              checked={filters.sinImagen}
              onChange={e => setFilters(prev => ({ ...prev, sinImagen: e.target.checked, page: 1 }))}
            />
            Sin imagen
          </label>
          <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer select-none">
            <input
              type="checkbox"
              className="rounded border-stone-300 text-brand-700 focus:ring-brand-500"
              checked={filters.sinSync}
              onChange={e => setFilters(prev => ({
                ...prev,
                sinSync: e.target.checked,
                syncDesde: e.target.checked ? '' : prev.syncDesde,
                syncHasta: e.target.checked ? '' : prev.syncHasta,
                page: 1,
              }))}
            />
            Nunca sincronizado
          </label>

          <div className="w-40">
            <label className="text-sm font-medium text-stone-700 mb-1 block">Sync desde</label>
            <Input
              type="date"
              value={filters.syncDesde}
              disabled={filters.sinSync}
              onChange={e => setFilters(prev => ({ ...prev, syncDesde: e.target.value, page: 1 }))}
            />
          </div>
          <div className="w-40">
            <label className="text-sm font-medium text-stone-700 mb-1 block">Sync hasta</label>
            <Input
              type="date"
              value={filters.syncHasta}
              disabled={filters.sinSync}
              onChange={e => setFilters(prev => ({ ...prev, syncHasta: e.target.value, page: 1 }))}
            />
          </div>
        </div>
      </div>

      <div className="relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-[1px] rounded-xl">
            <Spinner size={40} />
          </div>
        )}
        <ProductosTable 
          items={data.items}
          total={data.total}
          page={data.page}
          totalPages={data.totalPages}
          onPageChange={(p: number) => setFilters(prev => ({ ...prev, page: p }))}
          onRefresh={loadData}
          readOnly={!canEdit}
          onEdit={canEdit ? handleEditProduct : undefined}
          onEditPrecios={canEdit ? (id: number) => handleEditProduct(id, { scrollToPrecios: true }) : undefined}
        />
      </div>

      {canEdit && modalOpen && (
        <ProductoModal 
          categorias={categorias}
          product={editingProduct}
          scrollToPrecios={scrollToPrecios}
          onPricesSaved={loadData}
          onClose={() => {
            setModalOpen(false);
            setScrollToPrecios(false);
          }}
          onSaved={() => {
            setModalOpen(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}
