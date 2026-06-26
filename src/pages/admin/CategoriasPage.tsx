import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, Folder, FolderTree, AlertCircle } from 'lucide-react';
import { api } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';
import { Input } from '../../components/ui/Input';

export function CategoriasPage() {
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE_CAT' | 'EDIT_CAT' | 'CREATE_SUB' | 'EDIT_SUB'>('CREATE_CAT');
  const [modalData, setModalData] = useState<any>(null);
  const [inputValue, setInputValue] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getCategoriasAdmin();
      setCategorias(data);
    } catch (err) {
      toast.error('Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleExpand = (id: number) => {
    const newExp = new Set(expanded);
    if (newExp.has(id)) newExp.delete(id);
    else newExp.add(id);
    setExpanded(newExp);
  };

  const openModal = (mode: 'CREATE_CAT' | 'EDIT_CAT' | 'CREATE_SUB' | 'EDIT_SUB', data: any = null) => {
    setModalMode(mode);
    setModalData(data);
    setInputValue(mode.includes('EDIT') ? data.nombre : '');
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!inputValue.trim()) {
      toast.error('El nombre no puede estar vacío');
      return;
    }

    try {
      if (modalMode === 'CREATE_CAT') {
        await api.createCategoria(inputValue.trim());
        toast.success('Categoría creada');
      } else if (modalMode === 'EDIT_CAT') {
        await api.updateCategoria(modalData.id, inputValue.trim());
        toast.success('Categoría actualizada');
      } else if (modalMode === 'CREATE_SUB') {
        await api.createSubcategoria(modalData.categoriaId, inputValue.trim());
        toast.success('Subcategoría creada');
      } else if (modalMode === 'EDIT_SUB') {
        await api.updateSubcategoria(modalData.id, inputValue.trim());
        toast.success('Subcategoría actualizada');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar');
    }
  };

  const handleDelete = async (id: number, type: 'CAT' | 'SUB') => {
    if (!confirm('¿Estás seguro de eliminar esto?')) return;
    try {
      if (type === 'CAT') {
        await api.deleteCategoria(id);
        toast.success('Categoría eliminada');
      } else {
        await api.deleteSubcategoria(id);
        toast.success('Subcategoría eliminada');
      }
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'No se pudo eliminar');
    }
  };

  if (loading) return <div className="p-8 text-center text-stone-500">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-outfit text-stone-900">Categorías y Subcategorías</h1>
          <p className="text-stone-500">Administra el árbol de categorías de tu tienda.</p>
        </div>
        <Button onClick={() => openModal('CREATE_CAT')}>
          <Plus size={20} className="mr-2" />
          Nueva Categoría
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        {categorias.length === 0 ? (
          <div className="p-8 text-center text-stone-500">No hay categorías. Crea una para empezar.</div>
        ) : (
          <div className="divide-y divide-stone-100">
            {categorias.map(cat => {
              const isExpanded = expanded.has(cat.id);
              const isMakor = cat.esMakor;
              const hasProducts = cat.count > 0;
              const hasSubcategories = cat.subcategorias && cat.subcategorias.length > 0;
              const canDelete = !isMakor && !hasProducts && !hasSubcategories;

              return (
                <div key={cat.id} className="flex flex-col">
                  {/* Fila Categoría */}
                  <div className="flex items-center p-4 hover:bg-stone-50 transition-colors">
                    <button onClick={() => toggleExpand(cat.id)} className="p-1 mr-2 text-stone-400 hover:text-stone-600">
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </button>
                    <Folder className="text-brand-600 mr-3" size={20} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-900">{cat.nombre}</span>
                        {isMakor ? (
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">Sincronizada (Makor)</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-xs font-medium">Manual</span>
                        )}
                      </div>
                      <div className="text-xs text-stone-500 mt-1">
                        {cat.subcategorias?.length || 0} subcategorías • {cat.count} productos
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => openModal('CREATE_SUB', { categoriaId: cat.id })}>
                        <Plus size={16} className="mr-1" /> Sub
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openModal('EDIT_CAT', cat)}>
                        <Edit2 size={16} />
                      </Button>
                      <div title={!canDelete ? "No se puede eliminar porque es de Makor o tiene productos/subcategorías" : ""}>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={!canDelete}
                          onClick={() => handleDelete(cat.id, 'CAT')}
                          className={canDelete ? "text-red-600 hover:bg-red-50 hover:border-red-200" : ""}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Filas Subcategorías */}
                  {isExpanded && cat.subcategorias?.map((sub: any) => {
                    const subIsMakor = sub.esMakor;
                    const subHasProducts = sub.count > 0;
                    const subCanDelete = !subIsMakor && !subHasProducts;

                    return (
                      <div key={sub.id} className="flex items-center p-3 pl-14 bg-stone-50/50 border-t border-stone-50 hover:bg-stone-50 transition-colors">
                        <FolderTree className="text-stone-400 mr-3" size={18} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-stone-700">{sub.nombre}</span>
                            {subIsMakor ? (
                              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-medium">Makor</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 text-[10px] font-medium">Manual</span>
                            )}
                          </div>
                          <div className="text-xs text-stone-500">
                            {sub.count} productos
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => openModal('EDIT_SUB', sub)}>
                            <Edit2 size={14} />
                          </Button>
                          <div title={!subCanDelete ? "No se puede eliminar porque es de Makor o tiene productos" : ""}>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              disabled={!subCanDelete}
                              onClick={() => handleDelete(sub.id, 'SUB')}
                              className={subCanDelete ? "text-red-600 hover:bg-red-50 hover:border-red-200" : ""}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-lg font-bold text-stone-900 mb-4">
                {modalMode === 'CREATE_CAT' && 'Nueva Categoría'}
                {modalMode === 'EDIT_CAT' && 'Editar Categoría'}
                {modalMode === 'CREATE_SUB' && 'Nueva Subcategoría'}
                {modalMode === 'EDIT_SUB' && 'Editar Subcategoría'}
              </h3>
              
              {modalData?.esMakor && modalMode.includes('EDIT') && (
                <div className="mb-4 bg-blue-50 text-blue-800 p-3 rounded-lg text-sm flex gap-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <p>Al editar una categoría de Makor, solo se cambiará el nombre visual. El identificador interno se mantiene para no romper la sincronización.</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Nombre</label>
                  <Input 
                    autoFocus
                    value={inputValue} 
                    onChange={e => setInputValue(e.target.value)} 
                    placeholder="Ej: Accesorios"
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSubmit();
                      if (e.key === 'Escape') setIsModalOpen(false);
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="p-4 bg-stone-50 border-t border-stone-100 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit}>Guardar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
