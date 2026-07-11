import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { Switch } from '../ui/Switch';
import { Button } from '../ui/Button';
import { ConfirmModal } from '../ui/ConfirmModal';
import { Modal } from '../ui/Modal';
import { Banknote, Star, StarOff, Pencil, RefreshCw } from 'lucide-react';
import { api } from '../../api/client';
import { toast } from 'sonner';
import { formatPrice, formatDateTimeAr } from '../../lib/utils';
import { resolveMakorPublicTitle } from '../../lib/makorPublicContent';
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
    <Modal
      open={Boolean(product)}
      title={
        <div className="min-w-0 pr-4">
          <div className="text-xl font-bold font-outfit text-stone-900">Precios del producto</div>
          <p className="text-sm text-stone-500 mt-1 line-clamp-1">{product.nombre}</p>
        </div>
      }
      onClose={onClose}
      maxWidthClassName="max-w-lg"
      footer={
        <>
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
        </>
      }
    >
      <ProductoPreciosResumen productoId={product.id} />
    </Modal>
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
  readOnly = false,
}: any) {
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());
  const [selectedProductForPrices, setSelectedProductForPrices] = useState<any>(null);
  const [productoAEliminar, setProductoAEliminar] = useState<any>(null);
  const [showCatalogNames, setShowCatalogNames] = useState(() => {
    try {
      return localStorage.getItem('mmatilde_productos_nombre_catalogo') === '1';
    } catch {
      return false;
    }
  });

  const toggleNombreVista = () => {
    setShowCatalogNames((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('mmatilde_productos_nombre_catalogo', next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const catalogTitle = (item: any) => {
    const nombrePublico = item.nombrePublico ?? item.NombrePublico ?? null;
    if (item.proveedorId === 1) {
      return resolveMakorPublicTitle(item.nombre, nombrePublico);
    }
    return nombrePublico?.trim() || item.nombre;
  };

  const displayNombre = (item: any) =>
    showCatalogNames ? catalogTitle(item) : item.nombre;

  const handleResync = async (id: number) => {
    setLoadingIds((prev) => new Set(prev).add(id));
    try {
      await api.syncProducto(id);
      toast.success('Producto sincronizado');
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'No se pudo sincronizar');
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDelete = async (id: number) => {
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
      <ConfirmModal
        open={Boolean(productoAEliminar)}
        title="Eliminar producto"
        description={
          productoAEliminar
            ? `Se va a eliminar "${productoAEliminar.nombre}". Esta acción no se puede deshacer.`
            : undefined
        }
        confirmLabel="Eliminar"
        onClose={() => setProductoAEliminar(null)}
        onConfirm={() => {
          if (!productoAEliminar) return;
          void handleDelete(productoAEliminar.id).finally(() => setProductoAEliminar(null));
        }}
        loading={productoAEliminar ? loadingIds.has(productoAEliminar.id) : false}
      />

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
              <TableHead>
                <button
                  type="button"
                  onClick={toggleNombreVista}
                  className="text-left hover:text-brand-700 transition-colors"
                  title="Clic para alternar nombre original / catálogo"
                >
                  Producto
                  <span className="block text-[10px] font-normal text-stone-400 normal-case tracking-normal">
                    {showCatalogNames ? 'Catálogo · clic = original' : 'Original · clic = catálogo'}
                  </span>
                </button>
              </TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="w-[140px]">Precio venta</TableHead>
              {!readOnly && <TableHead className="w-[88px] text-center">Más precios</TableHead>}
              <TableHead className="w-[72px] text-center">Dest.</TableHead>
              <TableHead className="w-[72px] text-center">Visible</TableHead>
              {!readOnly && <TableHead className="w-[130px]">Últ. sync</TableHead>}
              {!readOnly && <TableHead className="w-[72px] text-center"></TableHead>}
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
                    <button
                      type="button"
                      onClick={toggleNombreVista}
                      className="font-medium text-stone-900 truncate text-left w-full hover:text-brand-800 transition-colors"
                      title={
                        showCatalogNames
                          ? `Catálogo: ${displayNombre(item)}\nClic para ver original`
                          : `Original: ${item.nombre}\nClic para ver catálogo`
                      }
                    >
                      {displayNombre(item)}
                    </button>
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
                    {precioVenta != null ? (
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-brand-800 tabular-nums whitespace-nowrap">
                          {formatPrice(precioVenta)}
                        </div>
                        {item.precioVentaPresentacion && (
                          <div
                            className="text-[11px] leading-tight text-stone-500 truncate"
                            title={`Precio por ${item.precioVentaPresentacion}`}
                          >
                            por {item.precioVentaPresentacion}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                        Sin precio
                      </span>
                    )}
                  </TableCell>
                  {!readOnly && (
                    <TableCell className="text-center">
                      <button
                        onClick={() => setSelectedProductForPrices(item)}
                        className="inline-flex items-center justify-center rounded-md p-1.5 text-emerald-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
                        title="Ver más precios"
                        aria-label="Ver más precios"
                      >
                        <Banknote size={18} strokeWidth={2.25} />
                      </button>
                    </TableCell>
                  )}
                  <TableCell className="text-center">
                    {readOnly ? (
                      item.destacado ? (
                        <Star size={18} className="inline text-brand-600" fill="currentColor" />
                      ) : (
                        <StarOff size={18} className="inline text-stone-300" />
                      )
                    ) : (
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
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {readOnly ? (
                      <span
                        className={`text-xs font-medium ${item.activo ? 'text-emerald-700' : 'text-stone-400'}`}
                      >
                        {item.activo ? 'Sí' : 'No'}
                      </span>
                    ) : (
                    <div className="flex justify-center">
                      <Switch
                        checked={item.activo}
                        onCheckedChange={() => handleToggleActivo(item.id, item.activo)}
                        disabled={loadingIds.has(item.id)}
                      />
                    </div>
                    )}
                  </TableCell>
                  {!readOnly && (
                  <>
                  <TableCell className="text-xs text-stone-500 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {item.ultimaSync ? (
                        <span title={formatDateTimeAr(item.ultimaSync)}>{formatDateTimeAr(item.ultimaSync)}</span>
                      ) : (
                        <span className="text-stone-400">Nunca</span>
                      )}
                      {item.codigoMakor && (
                        <button
                          type="button"
                          onClick={() => handleResync(item.id)}
                          disabled={loadingIds.has(item.id)}
                          className="p-1 text-sky-600 rounded hover:bg-sky-50 transition-colors disabled:opacity-40 shrink-0"
                          title="Re-sincronizar con Makor"
                        >
                          <RefreshCw size={14} className={loadingIds.has(item.id) ? 'animate-spin' : ''} />
                        </button>
                      )}
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
                        onClick={() => setProductoAEliminar(item)}
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
                  </>
                  )}
                </TableRow>
              );
            })}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={readOnly ? 6 : 9} className="h-24 text-center text-stone-500">
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
