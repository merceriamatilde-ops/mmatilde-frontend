import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../api/client';
import { ProductosTable } from '../../components/admin/ProductosTable';
import { ProductoModal } from '../../components/admin/ProductoModal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Search, Plus } from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner';

export function ProductosPage() {
  const [data, setData] = useState<any>({ items: [], total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [categorias, setCategorias] = useState<any[]>([]);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const [filters, setFilters] = useState({
    q: '',
    categoriaId: '',
    subcategoriaId: '',
    proveedorId: '',
    activo: '',
    page: 1
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: filters.page.toString(), pageSize: '50' };
      if (filters.q) params.q = filters.q;
      if (filters.categoriaId) params.categoriaId = filters.categoriaId;
      if (filters.subcategoriaId) params.subcategoriaId = filters.subcategoriaId;
      if (filters.proveedorId) params.proveedorId = filters.proveedorId;
      if (filters.activo !== '') params.activo = filters.activo;

      const res = await api.getProductosAdmin(params);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    api.getCategoriasAdmin().then(res => setCategorias(res)).catch(console.error);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  const handleNewProduct = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const handleEditProduct = async (id: number) => {
    try {
      const prod = await api.getProductoAdmin(id);
      setEditingProduct(prod);
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
          <p className="text-stone-500 mt-1">Gestioná el catálogo, precios y visibilidad.</p>
        </div>
        <Button onClick={handleNewProduct} className="gap-2">
          <Plus size={18} />
          Nuevo Producto
        </Button>
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
            <select 
              className="flex h-10 w-full rounded-md border border-stone-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
              value={filters.categoriaId}
              onChange={e => setFilters(prev => ({ ...prev, categoriaId: e.target.value, subcategoriaId: '' }))}
            >
              <option value="">Todas</option>
              {categorias.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          <div className="w-48">
            <label className="text-sm font-medium text-stone-700 mb-1 block">Subcategoría</label>
            <select 
              className="flex h-10 w-full rounded-md border border-stone-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 disabled:opacity-50"
              value={filters.subcategoriaId}
              onChange={e => setFilters(prev => ({ ...prev, subcategoriaId: e.target.value }))}
              disabled={!filters.categoriaId || subcategorias.length === 0}
            >
              <option value="">Todas</option>
              {subcategorias.map((s: any) => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>

          <div className="w-48">
            <label className="text-sm font-medium text-stone-700 mb-1 block">Proveedor</label>
            <select 
              className="flex h-10 w-full rounded-md border border-stone-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
              value={filters.proveedorId}
              onChange={e => setFilters(prev => ({ ...prev, proveedorId: e.target.value }))}
            >
              <option value="">Todos</option>
              <option value="1">Makor</option>
              <option value="2">Manual / Otros</option>
            </select>
          </div>

          <div className="w-40">
            <label className="text-sm font-medium text-stone-700 mb-1 block">Estado</label>
            <select 
              className="flex h-10 w-full rounded-md border border-stone-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
              value={filters.activo}
              onChange={e => setFilters(prev => ({ ...prev, activo: e.target.value }))}
            >
              <option value="">Todos</option>
              <option value="true">Visibles</option>
              <option value="false">Ocultos</option>
            </select>
          </div>

          <Button type="submit">Filtrar</Button>
        </form>
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
          onEdit={handleEditProduct}
        />
      </div>

      {modalOpen && (
        <ProductoModal 
          categorias={categorias}
          product={editingProduct}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}
