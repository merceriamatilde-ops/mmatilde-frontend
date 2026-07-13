import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, Folder, FolderTree, AlertCircle, Image as ImageIcon, Upload, Download, X, GripVertical, Home } from 'lucide-react';
import { api } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Modal } from '../../components/ui/Modal';
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
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; type: 'CAT' | 'SUB'; nombre: string } | null>(null);

  // Imagen de categoría
  const [imageCat, setImageCat] = useState<any>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageSyncing, setImageSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag & drop de orden
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const HOME_LIMIT = 8;

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

  const patchImageInState = (catId: number, imagen: string | null) => {
    setCategorias((prev) => prev.map((c) => (c.id === catId ? { ...c, imagen } : c)));
    setImageCat((prev: any) => (prev && prev.id === catId ? { ...prev, imagen } : prev));
  };

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !imageCat) return;
    setImageUploading(true);
    try {
      const { url } = await api.uploadImage(file);
      await api.updateCategoriaImagen(imageCat.id, url);
      patchImageInState(imageCat.id, url);
      toast.success('Imagen actualizada');
    } catch (err: any) {
      toast.error(err.message || 'No se pudo subir la imagen');
    } finally {
      setImageUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSyncImage = async () => {
    if (!imageCat) return;
    setImageSyncing(true);
    try {
      const { imagen } = await api.syncCategoriaImagen(imageCat.id);
      patchImageInState(imageCat.id, imagen);
      toast.success('Imagen traída de Makor');
    } catch (err: any) {
      toast.error(err.message || 'No se pudo traer la imagen de Makor');
    } finally {
      setImageSyncing(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!imageCat) return;
    try {
      await api.updateCategoriaImagen(imageCat.id, null);
      patchImageInState(imageCat.id, null);
      toast.success('Imagen quitada');
    } catch (err: any) {
      toast.error(err.message || 'No se pudo quitar la imagen');
    }
  };

  const persistOrden = async (list: any[]) => {
    try {
      await api.reorderCategorias(list.map((c) => c.id));
    } catch (err: any) {
      toast.error(err.message || 'No se pudo guardar el orden');
      loadData();
    }
  };

  const handleDropOn = (targetIndex: number) => {
    setOverIndex(null);
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      return;
    }
    setCategorias((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(targetIndex, 0, moved);
      void persistOrden(next);
      return next;
    });
    setDragIndex(null);
  };

  const handleDelete = async (id: number, type: 'CAT' | 'SUB') => {
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

  // Las primeras HOME_LIMIT categorías con productos son las que se muestran en la home.
  const homeIds = new Set<number>();
  let homeCount = 0;
  for (const c of categorias) {
    if (homeCount >= HOME_LIMIT) break;
    if ((c.count || 0) > 0) {
      homeIds.add(c.id);
      homeCount++;
    }
  }

  return (
    <div className="space-y-6">
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title={deleteTarget?.type === 'CAT' ? 'Eliminar categoría' : 'Eliminar subcategoría'}
        description={
          deleteTarget
            ? `Se va a eliminar "${deleteTarget.nombre}".`
            : undefined
        }
        confirmLabel="Eliminar"
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          void handleDelete(deleteTarget.id, deleteTarget.type).finally(() => setDeleteTarget(null));
        }}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-outfit text-stone-900">Categorías y Subcategorías</h1>
          <p className="text-stone-500">
            Arrastrá para ordenar. Las primeras {HOME_LIMIT} con productos (marcadas con{' '}
            <Home size={12} className="inline align-[-1px] text-brand-600" />) se muestran en la home.
          </p>
        </div>
        <Button onClick={() => openModal('CREATE_CAT')} className="w-full sm:w-auto">
          <Plus size={20} className="mr-2" />
          Nueva Categoría
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        {categorias.length === 0 ? (
          <div className="p-8 text-center text-stone-500">No hay categorías. Crea una para empezar.</div>
        ) : (
          <div className="divide-y divide-stone-100">
            {categorias.map((cat, index) => {
              const isExpanded = expanded.has(cat.id);
              const isMakor = cat.esMakor;
              const hasProducts = cat.count > 0;
              const hasSubcategories = cat.subcategorias && cat.subcategorias.length > 0;
              const canDelete = !isMakor && !hasProducts && !hasSubcategories;
              const enHome = homeIds.has(cat.id);

              return (
                <div key={cat.id} className="flex flex-col">
                  {/* Fila Categoría */}
                  <div
                    onDragOver={(e) => {
                      if (dragIndex === null) return;
                      e.preventDefault();
                      setOverIndex(index);
                    }}
                    onDrop={() => handleDropOn(index)}
                    className={`flex flex-wrap items-center gap-y-2 p-4 transition-colors ${
                      dragIndex === index ? 'opacity-40' : ''
                    } ${overIndex === index && dragIndex !== index ? 'bg-brand-50' : 'hover:bg-stone-50'}`}
                  >
                    <span
                      draggable
                      onDragStart={() => setDragIndex(index)}
                      onDragEnd={() => {
                        setDragIndex(null);
                        setOverIndex(null);
                      }}
                      title="Arrastrar para reordenar"
                      className="mr-1 flex shrink-0 cursor-grab items-center text-stone-300 hover:text-stone-500 active:cursor-grabbing"
                    >
                      <GripVertical size={18} />
                    </span>
                    <button onClick={() => toggleExpand(cat.id)} className="p-1 mr-2 text-stone-400 hover:text-stone-600 shrink-0">
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </button>
                    <button
                      onClick={() => setImageCat(cat)}
                      title="Gestionar imagen"
                      className="mr-3 flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-stone-200 bg-stone-50 text-stone-400 transition-colors hover:border-brand-300"
                    >
                      {cat.imagen ? (
                        <img src={cat.imagen} alt={cat.nombre} className="h-full w-full object-cover" />
                      ) : (
                        <Folder className="text-brand-600" size={18} />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-semibold text-stone-900">{cat.nombre}</span>
                        {isMakor ? (
                          <span className="shrink-0 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">Sincronizada (Makor)</span>
                        ) : (
                          <span className="shrink-0 px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-xs font-medium">Manual</span>
                        )}
                        {enHome && (
                          <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                            <Home size={11} /> En la home
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-stone-500 mt-1">
                        {cat.subcategorias?.length || 0} subcategorías • {cat.count} productos
                      </div>
                    </div>
                    
                    <div className="ml-auto flex shrink-0 items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setImageCat(cat)} title="Imagen">
                        <ImageIcon size={16} />
                      </Button>
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
                          onClick={() => setDeleteTarget({ id: cat.id, type: 'CAT', nombre: cat.nombre })}
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
                      <div key={sub.id} className="flex flex-wrap items-center gap-y-2 p-3 pl-8 sm:pl-14 bg-stone-50/50 border-t border-stone-50 hover:bg-stone-50 transition-colors">
                        <FolderTree className="text-stone-400 mr-3 shrink-0" size={18} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-stone-700">{sub.nombre}</span>
                            {subIsMakor ? (
                              <span className="shrink-0 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-medium">Makor</span>
                            ) : (
                              <span className="shrink-0 px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 text-[10px] font-medium">Manual</span>
                            )}
                          </div>
                          <div className="text-xs text-stone-500">
                            {sub.count} productos
                          </div>
                        </div>
                        <div className="ml-auto flex shrink-0 items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => openModal('EDIT_SUB', sub)}>
                            <Edit2 size={14} />
                          </Button>
                          <div title={!subCanDelete ? "No se puede eliminar porque es de Makor o tiene productos" : ""}>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              disabled={!subCanDelete}
                              onClick={() => setDeleteTarget({ id: sub.id, type: 'SUB', nombre: sub.nombre })}
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

      <Modal
        open={isModalOpen}
        title={
          <>
            {modalMode === 'CREATE_CAT' && 'Nueva Categoría'}
            {modalMode === 'EDIT_CAT' && 'Editar Categoría'}
            {modalMode === 'CREATE_SUB' && 'Nueva Subcategoría'}
            {modalMode === 'EDIT_SUB' && 'Editar Subcategoría'}
          </>
        }
        onClose={() => setIsModalOpen(false)}
        maxWidthClassName="max-w-sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>Guardar</Button>
          </>
        }
      >
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
      </Modal>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFile}
      />

      <Modal
        open={Boolean(imageCat)}
        title={imageCat ? `Imagen · ${imageCat.nombre}` : 'Imagen'}
        onClose={() => setImageCat(null)}
        maxWidthClassName="max-w-md"
        footer={
          <Button variant="outline" onClick={() => setImageCat(null)}>
            Cerrar
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
            {imageCat?.imagen ? (
              <img src={imageCat.imagen} alt={imageCat.nombre} className="h-full w-full object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-1 text-stone-400">
                <ImageIcon size={32} />
                <span className="text-sm">Sin imagen</span>
              </span>
            )}
            {imageCat?.imagen && (
              <button
                onClick={handleRemoveImage}
                title="Quitar imagen"
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-red-600 shadow-sm transition-colors hover:bg-white"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <p className="text-xs text-stone-500">
            Esta imagen se muestra en la home y en el listado de categorías. Subí la tuya cuando la tengas
            diseñada, o traé una provisoria desde Makor.
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              className="flex-1"
              disabled={imageUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={16} className="mr-2" />
              {imageUploading ? 'Subiendo...' : 'Subir imagen'}
            </Button>
            {imageCat?.esMakor && (
              <Button
                variant="outline"
                className="flex-1"
                disabled={imageSyncing}
                onClick={handleSyncImage}
              >
                <Download size={16} className="mr-2" />
                {imageSyncing ? 'Trayendo...' : 'Traer de Makor'}
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
