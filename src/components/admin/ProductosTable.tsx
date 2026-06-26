import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { Switch } from '../ui/Switch';
import { Button } from '../ui/Button';
import { Star, StarOff, Calculator, X } from 'lucide-react';
import { api } from '../../api/client';
import { toast } from 'sonner';
import { formatPrice } from '../../lib/utils';
import { Input } from '../ui/Input';

function PricesModal({ product, onClose }: { product: any, onClose: () => void }) {
  const [customMarkup, setCustomMarkup] = useState('115');
  const [customDiscount, setCustomDiscount] = useState('10');

  if (!product) return null;

  const basePrice = product.precioMayorista || 0;
  const priceIva = basePrice * 1.21;
  const price70 = priceIva * 1.70;
  const price115 = priceIva * 2.15;

  const customMarkupNum = parseFloat(customMarkup) || 0;
  const customPrice = priceIva * (1 + customMarkupNum / 100);
  
  const customDiscountNum = parseFloat(customDiscount) || 0;
  const discountedPrice = customPrice * (1 - customDiscountNum / 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-stone-100">
          <div>
            <h3 className="text-xl font-bold font-outfit text-stone-900">Calculadora de Precios</h3>
            <p className="text-sm text-stone-500 mt-1 line-clamp-1">{product.nombre}</p>
          </div>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-stone-50">
              <span className="text-stone-600">Precio Base (Makor)</span>
              <span className="font-medium text-stone-900">{formatPrice(basePrice)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-stone-50">
              <span className="text-stone-600">Precio + IVA (21%)</span>
              <span className="font-medium text-stone-900">{formatPrice(priceIva)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-stone-50">
              <span className="text-stone-600">Minorista (+70%)</span>
              <span className="font-bold text-brand-800 text-lg">{formatPrice(price70)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-stone-50">
              <span className="text-stone-600">Minorista (+115%)</span>
              <span className="font-bold text-brand-800 text-lg">{formatPrice(price115)}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
              <h4 className="font-medium text-stone-900 mb-3 flex items-center gap-2">
                <Calculator size={16} className="text-brand-600" />
                Calculadora Personalizada
              </h4>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium text-stone-500 mb-1 block">Margen (%)</label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      value={customMarkup} 
                      onChange={e => setCustomMarkup(e.target.value)}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">%</span>
                  </div>
                </div>
                <div className="flex-1 text-right">
                  <label className="text-xs font-medium text-stone-500 mb-1 block">Precio Final</label>
                  <div className="text-xl font-bold text-stone-900 h-10 flex items-center justify-end">
                    {formatPrice(customPrice)}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
              <h4 className="font-medium text-emerald-900 mb-3 flex items-center gap-2">
                Descuento Especial
              </h4>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium text-emerald-700 mb-1 block">Descuento (%)</label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      value={customDiscount} 
                      onChange={e => setCustomDiscount(e.target.value)}
                      className="pr-8 border-emerald-200 focus:ring-emerald-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 text-sm">%</span>
                  </div>
                </div>
                <div className="flex-1 text-right">
                  <label className="text-xs font-medium text-emerald-700 mb-1 block">Precio c/Dto.</label>
                  <div className="text-xl font-bold text-emerald-700 h-10 flex items-center justify-end">
                    {formatPrice(discountedPrice)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-stone-50 border-t border-stone-100 flex justify-end">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </div>
  );
}

export function ProductosTable({ items, total, page, totalPages, onPageChange, onRefresh, onEdit }: any) {
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());
  const [selectedProductForPrices, setSelectedProductForPrices] = useState<any>(null);

  const handleDelete = async (id: number, proveedorId: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;
    
    setLoadingIds(prev => new Set(prev).add(id));
    try {
      await api.deleteProducto(id);
      toast.success('Producto eliminado');
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar');
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleToggleActivo = async (id: number, current: boolean) => {
    setLoadingIds(prev => new Set(prev).add(id));
    try {
      await api.toggleProductoActivo(id, !current);
      toast.success('Estado actualizado');
      onRefresh();
    } catch (error) {
      toast.error('Error al actualizar');
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleToggleDestacado = async (id: number, current: boolean) => {
    setLoadingIds(prev => new Set(prev).add(id));
    try {
      await api.toggleProductoDestacado(id, !current);
      toast.success('Destacado actualizado');
      onRefresh();
    } catch (error) {
      toast.error('Error al actualizar');
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <div className="space-y-4">
      {selectedProductForPrices && (
        <PricesModal 
          product={selectedProductForPrices} 
          onClose={() => setSelectedProductForPrices(null)} 
        />
      )}

      <div className="rounded-md border border-stone-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Precios</TableHead>
              <TableHead className="w-[100px] text-center">Destacado</TableHead>
              <TableHead className="w-[100px] text-center">Visible</TableHead>
              <TableHead className="w-[80px] text-center"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item: any) => (

              <TableRow key={item.id} className={!item.activo ? 'bg-stone-50/50' : ''}>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <div className="font-medium text-stone-900">{item.nombre}</div>
                    <div className="text-xs text-stone-500">{item.codigoMakor}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-stone-100 text-stone-600 text-xs font-medium">
                    {item.categoria}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={() => setSelectedProductForPrices(item)}
                      className="text-xs text-brand-800 hover:text-brand-700 flex items-center gap-1 w-fit group font-medium"
                    >
                      <Calculator size={14} className="group-hover:rotate-12 transition-transform" />
                      Ver precios
                    </button>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <button 
                    onClick={() => handleToggleDestacado(item.id, item.destacado)}
                    disabled={loadingIds.has(item.id)}
                    className={`p-1.5 rounded-full transition-colors inline-flex justify-center ${
                      item.destacado 
                        ? 'text-brand-600 hover:bg-brand-50' 
                        : 'text-stone-300 hover:text-brand-600 hover:bg-stone-100'
                    }`}
                    title={item.destacado ? "Quitar destacado" : "Destacar"}
                  >
                    {item.destacado ? <Star size={18} fill="currentColor" /> : <StarOff size={18} />}
                  </button>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center">
                    <Switch 
                      checked={item.activo} 
                      onCheckedChange={() => handleToggleActivo(item.id, item.activo)}
                      disabled={loadingIds.has(item.id)}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => onEdit && onEdit(item.id)}
                      className="p-1.5 text-brand-800 rounded-md hover:bg-stone-100 transition-colors"
                      title="Editar"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id, item.proveedorId)}
                      disabled={loadingIds.has(item.id)}
                      className="p-1.5 rounded-md transition-colors text-stone-400 hover:text-red-600 hover:bg-red-50"
                      title="Borrar"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-stone-500">
                  No se encontraron productos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-between text-sm text-stone-500">
        <div>
          Mostrando {items.length} de {total} productos
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            Anterior
          </Button>
          <div className="px-2 font-medium text-stone-900">
            {page} / {totalPages || 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}
