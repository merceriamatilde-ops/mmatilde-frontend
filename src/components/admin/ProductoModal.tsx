import React, { useState, useEffect, useRef } from 'react';
import { X, UploadCloud, Image as ImageIcon, Loader2, Plus, Trash2, Search } from 'lucide-react';
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
    nombrePublico: '',
    codigo: '',
    categoriaId: '',
    subcategoriaId: '',
    descripcion: '',
    descripcionPublica: '',
    precioBase: '',
    destacado: false,
    visible: true,
    imagenUrl: '',
    imagenPublicaUrl: '',
    imagenProveedorUrl: ''
  });

  const [variantes, setVariantes] = useState<any[]>([]);
  const [colores, setColores] = useState<any[]>([]);
  const [subcategorias, setSubcategorias] = useState<any[]>([]);
  
  const [relacionados, setRelacionados] = useState<any[]>([]);
  const [searchRel, setSearchRel] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchingRel, setSearchingRel] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMakorProduct = isEditing && product?.proveedorId === 1;

  useEffect(() => {
    loadColores();
  }, []);

  const loadColores = async () => {
    try {
      const data = await api.getColores();
      setColores(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (searchRel.length < 3) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingRel(true);
      try {
        const res = await api.getProductosAdmin({ q: searchRel, pageSize: 5 });
        setSearchResults(res.items.filter((item: any) => item.id !== product?.id && !relacionados.some(r => r.id === item.id)));
      } catch (err) {
        console.error(err);
      } finally {
        setSearchingRel(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchRel, product?.id, relacionados]);

  useEffect(() => {
    if (product) {
      const proveedorImg = product.imagenProveedorUrl
        || product.imagenes?.find((i: any) => i.esDeProveedor)?.urlOriginal
        || product.imagenes?.[0]?.urlOriginal
        || '';

      setFormData({
        nombre: product.nombre || '',
        nombrePublico: product.nombrePublico || '',
        codigo: product.codigoMakor || '',
        categoriaId: product.categoriaId?.toString() || '',
        subcategoriaId: product.subcategoriaId?.toString() || '',
        descripcion: product.descripcion || '',
        descripcionPublica: product.descripcionPublica || '',
        precioBase: product.precioMayorista?.toString() || '',
        destacado: product.destacado || false,
        visible: product.activo ?? true,
        imagenUrl: product.imagenes?.find((i: any) => !i.esDeProveedor)?.urlOriginal || product.imagenes?.[0]?.urlOriginal || '',
        imagenPublicaUrl: product.imagenPublicaUrl || '',
        imagenProveedorUrl: proveedorImg
      });
      
      setVariantes(product.variantes || []);
      setRelacionados(product.relacionados || []);

      const cat = categorias.find(c => c.id.toString() === product.categoriaId?.toString());
      if (cat?.subcategorias) {
        setSubcategorias(cat.subcategorias);
      }
    } else {
      setVariantes([]);
      setRelacionados([]);
    }
  }, [product, categorias]);

  const handleCategoriaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const catId = e.target.value;
    setFormData(prev => ({ ...prev, categoriaId: catId, subcategoriaId: '' }));
    
    const cat = categorias.find(c => c.id.toString() === catId);
    setSubcategorias(cat?.subcategorias || []);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'publica' | 'manual' = 'manual') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await api.uploadImage(file);
      if (target === 'publica') {
        setFormData(prev => ({ ...prev, imagenPublicaUrl: res.url }));
      } else {
        setFormData(prev => ({ ...prev, imagenUrl: res.url }));
      }
      toast.success('Imagen subida correctamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMakorProduct && (!formData.nombre || !formData.categoriaId)) {
      toast.error('Completá los campos obligatorios');
      return;
    }

    setLoading(true);
    try {
      const payload = isMakorProduct ? {
        nombre: formData.nombre,
        codigo: formData.codigo,
        categoriaId: parseInt(formData.categoriaId),
        subcategoriaId: formData.subcategoriaId ? parseInt(formData.subcategoriaId) : null,
        descripcion: formData.descripcion,
        precioBase: formData.precioBase ? parseFloat(formData.precioBase) : null,
        destacado: formData.destacado,
        visible: formData.visible,
        imagenUrl: formData.imagenProveedorUrl,
        nombrePublico: formData.nombrePublico,
        descripcionPublica: formData.descripcionPublica,
        imagenPublicaUrl: formData.imagenPublicaUrl,
        variantes: variantes
          .filter(v => v.colorId || (v.talle && v.talle.trim()) || (v.medida && v.medida.trim()) || (v.codigoArticulo && v.codigoArticulo.trim()))
          .map((v, index) => ({
            id: v.id,
            colorId: v.colorId ? parseInt(v.colorId.toString()) : null,
            talle: v.talle,
            medida: v.medida,
            codigoArticulo: v.codigoArticulo,
            activo: v.activo,
            orden: index
          })),
        relacionadosIds: relacionados.map(r => r.id)
      } : {
        nombre: formData.nombre,
        codigo: formData.codigo,
        categoriaId: parseInt(formData.categoriaId),
        subcategoriaId: formData.subcategoriaId ? parseInt(formData.subcategoriaId) : null,
        descripcion: formData.descripcion,
        precioBase: formData.precioBase ? parseFloat(formData.precioBase) : null,
        destacado: formData.destacado,
        visible: formData.visible,
        imagenUrl: formData.imagenUrl,
        variantes: variantes
          .filter(v => v.colorId || (v.talle && v.talle.trim()) || (v.medida && v.medida.trim()) || (v.codigoArticulo && v.codigoArticulo.trim()))
          .map((v, index) => ({
            id: v.id,
            colorId: v.colorId ? parseInt(v.colorId.toString()) : null,
            talle: v.talle,
            medida: v.medida,
            codigoArticulo: v.codigoArticulo,
            activo: v.activo,
            orden: index
          })),
        relacionadosIds: relacionados.map(r => r.id)
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-stone-100 flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold font-outfit text-stone-900">
              {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
            </h3>
            {isMakorProduct && (
              <p className="text-sm text-brand-800 mt-1 font-medium bg-brand-50 inline-block px-2 py-0.5 rounded">
                Producto Makor — editá el contenido visible en el catálogo
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="productForm" onSubmit={handleSubmit} className="space-y-6">

            {isMakorProduct && (
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-stone-700">Datos originales de Makor</h4>
                  <p className="text-xs text-stone-500">Se actualizan automáticamente con cada sincronización</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-stone-500 mb-1 block">Título Makor</label>
                    <p className="text-sm text-stone-800 bg-white border border-stone-200 rounded-md px-3 py-2">{formData.nombre || '—'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-stone-500 mb-1 block">Imagen Makor</label>
                    {formData.imagenProveedorUrl ? (
                      <img src={formData.imagenProveedorUrl} alt="Makor" className="w-full h-24 object-cover rounded-lg border border-stone-200" />
                    ) : (
                      <p className="text-sm text-stone-400 bg-white border border-stone-200 rounded-md px-3 py-2">Sin imagen</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-500 mb-1 block">Descripción Makor</label>
                  <p className="text-sm text-stone-700 bg-white border border-stone-200 rounded-md px-3 py-2 min-h-[60px] whitespace-pre-wrap">
                    {formData.descripcion || 'Sin descripción'}
                  </p>
                </div>
              </div>
            )}

            {isMakorProduct && (
              <div className="rounded-xl border border-brand-200 bg-brand-50/30 p-4 space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-brand-900">Visible en el catálogo</h4>
                  <p className="text-xs text-stone-500">Si dejás un campo vacío, se usa el dato original de Makor</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-stone-700 mb-1 block">Título público</label>
                      <Input
                        placeholder={formData.nombre || 'Ej: Totora suelta'}
                        value={formData.nombrePublico}
                        onChange={e => setFormData({ ...formData, nombrePublico: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-stone-700 mb-1 block">Descripción pública</label>
                      <textarea
                        className="flex w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 min-h-[100px]"
                        placeholder="Descripción para el cliente..."
                        value={formData.descripcionPublica}
                        onChange={e => setFormData({ ...formData, descripcionPublica: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-stone-700 mb-1 block">Imagen pública</label>
                    <div className="border-2 border-dashed border-brand-200 rounded-xl p-4 text-center bg-white">
                      {formData.imagenPublicaUrl ? (
                        <div className="relative group">
                          <img src={formData.imagenPublicaUrl} alt="Pública" className="w-full h-32 object-cover rounded-lg" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                            <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                              Cambiar
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => setFormData(prev => ({ ...prev, imagenPublicaUrl: '' }))}>
                              Quitar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="py-4">
                          <ImageIcon className="mx-auto h-8 w-8 text-stone-300 mb-2" />
                          <p className="text-sm text-stone-500 mb-2">Subí una imagen propia o se usará la de Makor</p>
                          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4 mr-2" />}
                            {uploading ? 'Subiendo...' : 'Seleccionar Archivo'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {!isMakorProduct && (
                <div>
                  <label className="text-sm font-medium text-stone-700 mb-1 block">Nombre *</label>
                  <Input 
                    required 
                    value={formData.nombre} 
                    onChange={e => setFormData({...formData, nombre: e.target.value})} 
                  />
                </div>
                )}

                {isMakorProduct && (
                <div>
                  <label className="text-sm font-medium text-stone-700 mb-1 block">Código Makor</label>
                  <Input disabled value={formData.codigo} />
                </div>
                )}

                {!isMakorProduct && (
                <div>
                  <label className="text-sm font-medium text-stone-700 mb-1 block">Código / SKU</label>
                  <Input 
                    placeholder="Se autogenera si se deja vacío"
                    value={formData.codigo} 
                    onChange={e => setFormData({...formData, codigo: e.target.value})} 
                  />
                </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-stone-700 mb-1 block">Categoría *</label>
                    <select 
                      required={!isMakorProduct}
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

              {!isMakorProduct && (
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
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-stone-700 mb-1 block">Descripción</label>
                  <textarea 
                    className="flex w-full rounded-md border border-stone-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 min-h-[100px]"
                    placeholder="Detalles del producto..."
                    value={formData.descripcion}
                    onChange={e => setFormData({...formData, descripcion: e.target.value})}
                  />
                </div>
              </div>
              )}
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={(e) => handleImageUpload(e, isMakorProduct ? 'publica' : 'manual')}
            />
            
            <div className="pt-4 border-t border-stone-100">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h4 className="text-sm font-bold text-stone-900">Variantes del Producto</h4>
                  <p className="text-xs text-stone-500">Colores, talles, medidas y formatos de venta</p>
                </div>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline"
                  onClick={() => setVariantes([{ id: null, colorId: '', talle: '', medida: '', codigoArticulo: '', activo: true }, ...variantes])}
                >
                  <Plus className="h-4 w-4 mr-2" /> Agregar
                </Button>
              </div>

              {variantes.length > 0 ? (
                <div className="space-y-3">
                  {variantes.map((v, i) => {
                    const isDuplicate = v.colorId && variantes.findIndex((other, idx) => 
                      idx !== i &&
                      other.colorId === v.colorId && 
                      (other.talle || '').trim() === (v.talle || '').trim() && 
                      (other.medida || '').trim() === (v.medida || '').trim()
                    ) !== -1;

                    return (
                      <div key={i} className={`flex flex-wrap items-center gap-3 p-3 rounded-lg border ${isDuplicate ? 'border-red-400 bg-red-50/50 shadow-sm' : 'border-stone-200 bg-stone-50'}`}>
                      <div className="w-full md:w-auto flex-1 min-w-[120px]">
                        <select 
                          className="flex h-10 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
                          value={v.colorId || ''}
                          onChange={(e) => {
                            const newV = [...variantes];
                            newV[i].colorId = e.target.value;
                            setVariantes(newV);
                          }}
                        >
                          <option value="">(Sin color)</option>
                          {colores.map(c => (
                            <option key={c.id} value={c.id}>{c.nombre}</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-1/3 md:w-auto md:w-24">
                        <Input 
                          placeholder="Talle"
                          value={v.talle || ''}
                          onChange={(e) => {
                            const newV = [...variantes];
                            newV[i].talle = e.target.value;
                            setVariantes(newV);
                          }}
                        />
                      </div>
                      <div className="w-1/3 md:w-auto flex-1 min-w-[100px]">
                        <Input 
                          placeholder="Medida / Formato (Ej: Metro)"
                          value={v.medida || ''}
                          onChange={(e) => {
                            const newV = [...variantes];
                            newV[i].medida = e.target.value;
                            setVariantes(newV);
                          }}
                        />
                      </div>
                      <div className="w-full md:w-auto flex-1 min-w-[120px]">
                        <Input 
                          placeholder="SKU Variante"
                          value={v.codigoArticulo || ''}
                          onChange={(e) => {
                            const newV = [...variantes];
                            newV[i].codigoArticulo = e.target.value;
                            setVariantes(newV);
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={v.activo}
                          onCheckedChange={(checked) => {
                            const newV = [...variantes];
                            newV[i].activo = checked;
                            setVariantes(newV);
                          }}
                        />
                        <button 
                          type="button"
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                          onClick={() => {
                            const newV = [...variantes];
                            newV.splice(i, 1);
                            setVariantes(newV);
                          }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-stone-500 border-2 border-dashed border-stone-200 rounded-lg">
                  No hay variantes agregadas
                </div>
              )}
            </div>

            {/* Productos Relacionados */}
            <div className="pt-4 border-t border-stone-100">
              <div className="mb-4">
                <h4 className="text-sm font-bold text-stone-900">Productos Relacionados</h4>
                <p className="text-xs text-stone-500">Buscá y agregá productos para recomendaciones cruzadas</p>
              </div>
              
              <div className="relative mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <Input 
                    placeholder="Buscar producto por nombre o código (min 3 letras)..." 
                    value={searchRel}
                    onChange={(e) => setSearchRel(e.target.value)}
                    className="pl-9"
                  />
                  {searchingRel && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-brand-600" />}
                </div>

                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map(res => (
                      <button
                        key={res.id}
                        type="button"
                        onClick={() => {
                          setRelacionados([...relacionados, res]);
                          setSearchRel('');
                          setSearchResults([]);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-stone-50 border-b last:border-0 border-stone-100 flex items-center gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-stone-900 truncate">{res.nombre}</p>
                          <p className="text-xs text-stone-500">{res.codigoMakor || res.codigo}</p>
                        </div>
                        <Plus className="h-4 w-4 text-brand-600 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {relacionados.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {relacionados.map((rel) => (
                    <div key={rel.id} className="flex items-center justify-between p-2 bg-stone-50 border border-stone-200 rounded-lg">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-stone-900 truncate">{rel.nombre}</p>
                          <p className="text-xs text-stone-500">{rel.codigoMakor || rel.codigo}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRelacionados(relacionados.filter(r => r.id !== rel.id))}
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-stone-500 text-sm border-2 border-dashed border-stone-200 rounded-lg">
                  No hay productos relacionados asignados
                </div>
              )}
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
