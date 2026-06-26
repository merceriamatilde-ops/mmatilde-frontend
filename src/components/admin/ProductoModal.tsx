import React, { useState, useEffect, useRef } from 'react';
import { X, UploadCloud, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { api } from '../../api/client';
import { toast } from 'sonner';

interface ProductoModalProps {
  product?: any;
  categorias: any[];
  onClose: () => void;
  onSaved: () => void;
}

export function ProductoModal({ product, categorias, onClose, onSaved }: ProductoModalProps) {
  const isEditing = !!product;

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    categoriaId: '',
    subcategoriaId: '',
    descripcion: '',
    precioBase: '',
    destacado: false,
    visible: true,
    imagenUrl: ''
  });

  const [subcategorias, setSubcategorias] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (product) {
      setFormData({
        nombre: product.nombre || '',
        codigo: product.codigoMakor || '',
        categoriaId: product.categoriaId?.toString() || '',
        subcategoriaId: product.subcategoriaId?.toString() || '',
        descripcion: product.descripcion || '',
        precioBase: product.precioMayorista?.toString() || '',
        destacado: product.destacado || false,
        visible: product.activo ?? true,
        imagenUrl: product.imagenes?.[0]?.urlOriginal || ''
      });
      
      const cat = categorias.find(c => c.id.toString() === product.categoriaId?.toString());
      if (cat?.subcategorias) {
        setSubcategorias(cat.subcategorias);
      }
    }
  }, [product, categorias]);

  const handleCategoriaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const catId = e.target.value;
    setFormData(prev => ({ ...prev, categoriaId: catId, subcategoriaId: '' }));
    
    const cat = categorias.find(c => c.id.toString() === catId);
    setSubcategorias(cat?.subcategorias || []);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await api.uploadImage(file);
      setFormData(prev => ({ ...prev, imagenUrl: res.url }));
      toast.success('Imagen subida correctamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.categoriaId) {
      toast.error('Completá los campos obligatorios');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        nombre: formData.nombre,
        codigo: formData.codigo,
        categoriaId: parseInt(formData.categoriaId),
        subcategoriaId: formData.subcategoriaId ? parseInt(formData.subcategoriaId) : null,
        descripcion: formData.descripcion,
        precioBase: formData.precioBase ? parseFloat(formData.precioBase) : null,
        destacado: formData.destacado,
        visible: formData.visible,
        imagenUrl: formData.imagenUrl
      };

      if (isEditing) {
        await api.updateProducto(product.id, payload);
        toast.success('Producto actualizado');
      } else {
        await api.createProducto(payload);
        toast.success('Producto creado');
      }
      onSaved();
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar el producto');
    } finally {
      setLoading(false);
    }
  };

  const isMakorProduct = isEditing && product?.proveedorId === 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-stone-100 flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold font-outfit text-stone-900">
              {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
            </h3>
            {isMakorProduct && (
              <p className="text-sm text-brand-800 mt-1 font-medium bg-brand-50 inline-block px-2 py-0.5 rounded">
                Producto sincronizado. Algunos campos están bloqueados.
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="productForm" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-stone-700 mb-1 block">Nombre *</label>
                  <Input 
                    required 
                    disabled={isMakorProduct}
                    value={formData.nombre} 
                    onChange={e => setFormData({...formData, nombre: e.target.value})} 
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-stone-700 mb-1 block">Código / SKU</label>
                  <Input 
                    disabled={isMakorProduct}
                    placeholder="Se autogenera si se deja vacío"
                    value={formData.codigo} 
                    onChange={e => setFormData({...formData, codigo: e.target.value})} 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-stone-700 mb-1 block">Categoría *</label>
                    <select 
                      required
                      disabled={isMakorProduct}
                      className="flex h-10 w-full rounded-md border border-stone-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 disabled:opacity-50 disabled:bg-stone-50"
                      value={formData.categoriaId}
                      onChange={handleCategoriaChange}
                    >
                      <option value="">Seleccionar...</option>
                      {categorias.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-stone-700 mb-1 block">Subcategoría</label>
                    <select 
                      disabled={isMakorProduct || subcategorias.length === 0}
                      className="flex h-10 w-full rounded-md border border-stone-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 disabled:opacity-50 disabled:bg-stone-50"
                      value={formData.subcategoriaId}
                      onChange={e => setFormData({...formData, subcategoriaId: e.target.value})}
                    >
                      <option value="">Ninguna</option>
                      {subcategorias.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-stone-700 mb-1 block">Precio Base</label>
                  <Input 
                    type="number"
                    step="0.01"
                    disabled={isMakorProduct}
                    placeholder="Ej: 1500.50"
                    value={formData.precioBase} 
                    onChange={e => setFormData({...formData, precioBase: e.target.value})} 
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-stone-700 mb-1 block">Imagen</label>
                  <div className="border-2 border-dashed border-stone-200 rounded-xl p-4 text-center hover:bg-stone-50 transition-colors">
                    {formData.imagenUrl ? (
                      <div className="relative group">
                        <img src={formData.imagenUrl} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                          <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                            Cambiar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-4">
                        <ImageIcon className="mx-auto h-8 w-8 text-stone-300 mb-2" />
                        <p className="text-sm text-stone-500 mb-2">Sube una imagen para el producto</p>
                        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4 mr-2" />}
                          {uploading ? 'Subiendo...' : 'Seleccionar Archivo'}
                        </Button>
                      </div>
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-stone-700 mb-1 block">Descripción</label>
                  <textarea 
                    disabled={isMakorProduct}
                    className="flex w-full rounded-md border border-stone-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 min-h-[100px] disabled:opacity-50 disabled:bg-stone-50"
                    placeholder="Detalles del producto..."
                    value={formData.descripcion}
                    onChange={e => setFormData({...formData, descripcion: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-8 pt-4 border-t border-stone-100">
              <div className="flex items-center gap-3">
                <Switch 
                  checked={formData.visible}
                  onCheckedChange={v => setFormData({...formData, visible: v})}
                />
                <div>
                  <div className="text-sm font-medium text-stone-900">Visible</div>
                  <div className="text-xs text-stone-500">Mostrar en el catálogo público</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch 
                  checked={formData.destacado}
                  onCheckedChange={v => setFormData({...formData, destacado: v})}
                />
                <div>
                  <div className="text-sm font-medium text-stone-900">Destacado</div>
                  <div className="text-xs text-stone-500">Aparecerá en la sección principal</div>
                </div>
              </div>
            </div>

          </form>
        </div>

        <div className="p-4 bg-stone-50 border-t border-stone-100 flex justify-end gap-3 flex-shrink-0">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button form="productForm" type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Producto'}
          </Button>
        </div>
      </div>
    </div>
  );
}
