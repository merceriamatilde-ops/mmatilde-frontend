import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { Switch } from '../ui/Switch';
import { Button } from '../ui/Button';
import { Star, StarOff, Eye, X, Pencil } from 'lucide-react';
import { api } from '../../api/client';
import { toast } from 'sonner';
import { formatPrice } from '../../lib/utils';
import { ProductoPreciosResumen } from './ProductoPreciosResumen';

function PricesModal({
  product,
  onClose,
  onEdit,
}: {
  product: { id: number; nombre: string };
  onClose: () => void;
  onEdit?: (id: number) => void;
}) {
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-stone-100 flex-shrink-0">
          <div className="min-w-0 pr-4">
            <h3 className="text-xl font-bold font-outfit text-stone-900">Precios del producto</h3>
            <p className="text-sm text-stone-500 mt-1 line-clamp-1">{product.nombre}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <ProductoPreciosResumen productoId={product.id} />
        </div>

        <div className="p-4 bg-stone-50 border-t border-stone-100 flex justify-end gap-2 flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          {onEdit && (
            <Button
              onClick={() => {
                onClose();
                onEdit(product.id);
              }}
            >
              <Pencil size={16} className="mr-1.5" />
              Editar precios
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProductosTable({
  items,
  total,
  page,
  totalPages,
  onPageChange,
  onRefresh,
  onEdit,
  onEditPrecios,
}: any) {
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());
  const [selectedProductForPrices, setSelectedProductForPrices] = useState<any>(null);

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;

    setLoadingIds((prev) => new Set(prev).add(id));
    try {
      await api.deleteProducto(id);
      toast.success('Producto eliminado');
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar');
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleToggleActivo = async (id: number, current: boolean) => {
    setLoadingIds((prev) => new Set(prev).add(id));
    try {
      await api.toggleProductoActivo(id, !current);
      toast.success('Estado actualizado');
      onRefresh();
    } catch (error) {
      toast.error('Error al actualizar');
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleToggleDestacado = async (id: number, current: boolean) => {
    setLoadingIds((prev) => new Set(prev).add(id));
    try {
      await api.toggleProductoDestacado(id, !current);
      toast.success('Destacado actualizado');
      onRefresh();
    } catch (error) {
      toast.error('Error al actualizar');
    } finally {
      setLoadingIds((prev) => {
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
          onEdit={onEditPrecios ?? onEdit}
        />
      )}

      <div className="rounded-md border border-stone-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Código</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="w-[140px]">Precio venta</TableHead>
              <TableHead className="w-[72px] text-center">Dest.</TableHead>
              <TableHead className="w-[72px] text-center">Visible</TableHead>
              <TableHead className="w-[72px] text-center"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item: any) => {
              const precioVenta = item.precioVentaFinal ?? item.precioMinorista;
              return (
                <TableRow key={item.id} className={!item.activo ? 'bg-stone-50/50' : ''}>
                  <TableCell className="text-xs text-stone-500 font-mono whitespace-nowrap">
                    {item.codigoMakor || '—'}
                  </TableCell>
                  <TableCell className="max-w-[240px]">
                    <div className="font-medium text-stone-900 truncate" title={item.nombre}>
                      {item.nombre}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[160px]">
                    <span
                      className="inline-block max-w-full truncate rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600"
                      title={item.categoria}
                    >
                      {item.categoria}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <span className="text-sm font-semibold text-brand-800 tabular-nums">
                        {precioVenta != null ? formatPrice(precioVenta) : '—'}
                      </span>
                      <button
                        onClick={() => setSelectedProductForPrices(item)}
                        className="inline-flex shrink-0 items-center gap-0.5 text-[11px] text-brand-800 hover:text-brand-700 font-medium"
                        title="Ver precios"
                      >
                        <Eye size={13} />
                        Ver
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
                      title={item.destacado ? 'Quitar destacado' : 'Destacar'}
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
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 20h9"></path>
                          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={loadingIds.has(item.id)}
                        className="p-1.5 rounded-md transition-colors text-stone-400 hover:text-red-600 hover:bg-red-50"
                        title="Borrar"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-stone-500">
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
          <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
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
