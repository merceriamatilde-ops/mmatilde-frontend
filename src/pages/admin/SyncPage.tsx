import React, { useEffect, useState, useCallback } from 'react';
import { BookOpen, RefreshCw, Search } from 'lucide-react';
import { SyncButton } from '../../components/admin/SyncButton';
import { api } from '../../api/client';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Spinner } from '../../components/ui/Spinner';
import { toast } from 'sonner';
import { formatDateTimeAr, normalizeSearchQuery } from '../../lib/utils';

function parseJsonSafe<T>(raw?: string | null, fallback: T = [] as T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function getAny(obj: any, ...keys: string[]) {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return undefined;
}

function isSameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getRecentSyncLabel(date: Date, now: Date) {
  if (isSameLocalDay(date, now)) {
    return {
      label: 'Sincronizado hoy',
      title: `Sincronizado hoy a las ${date.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
      })}`,
    };
  }

  const diffMs = now.getTime() - date.getTime();
  const hours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));
  return {
    label: `Sincronizado hace ${hours} h`,
    title: `Última sync ${date.toLocaleString('es-AR')}`,
  };
}

function normalizeRecentSyncKey(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function SyncPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [productoQuery, setProductoQuery] = useState('');
  const [productoResults, setProductoResults] = useState<any[]>([]);
  const [productoSearchLoading, setProductoSearchLoading] = useState(false);
  const [syncingIds, setSyncingIds] = useState<Set<number>>(new Set());
  const [syncingLogIds, setSyncingLogIds] = useState<Set<number>>(new Set());

  const loadLogs = () => {
    api.getSyncLogs().then(setLogs).catch(console.error);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    const q = normalizeSearchQuery(productoQuery);
    if (q.length < 2) {
      setProductoResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setProductoSearchLoading(true);
      try {
        const res = await api.getProductosAdmin({ q, pageSize: '12', proveedorId: '1' });
        setProductoResults((res.items || []).filter((p: any) => p.codigoMakor));
      } catch {
        setProductoResults([]);
      } finally {
        setProductoSearchLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [productoQuery]);

  const handleResyncLog = useCallback(async (log: any) => {
    const terms = parseJsonSafe<string[]>(log.termsJson);
    if (terms.length === 0) {
      toast.error('Este registro no tiene términos para re-sincronizar');
      return;
    }

    setSyncingLogIds((prev) => new Set(prev).add(log.id));
    toast.info('Re-sincronización iniciada...');
    try {
      const res = await api.executeSync(terms);
      if (res.success) {
        toast.success(`Re-sync completado: ${res.count} productos procesados`);
        loadLogs();
      } else {
        toast.error('Ocurrió un error en la re-sincronización');
      }
    } catch (error: any) {
      toast.error(error.message || 'No se pudo re-sincronizar');
    } finally {
      setSyncingLogIds((prev) => {
        const next = new Set(prev);
        next.delete(log.id);
        return next;
      });
    }
  }, []);

  const handleResyncProducto = useCallback(async (id: number) => {
    setSyncingIds((prev) => new Set(prev).add(id));
    try {
      await api.syncProducto(id);
      toast.success('Producto re-sincronizado');
      loadLogs();
      const q = normalizeSearchQuery(productoQuery);
      if (q.length >= 2) {
        const res = await api.getProductosAdmin({ q, pageSize: '12', proveedorId: '1' });
        setProductoResults((res.items || []).filter((p: any) => p.codigoMakor));
      }
    } catch (error: any) {
      toast.error(error.message || 'No se pudo re-sincronizar');
    } finally {
      setSyncingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, [productoQuery]);

  const recentCategorySyncs = React.useMemo(() => {
    const now = new Date();
    const maxAgeMs = 24 * 60 * 60 * 1000;
    const map: Record<string, { label: string; title: string; at: number }> = {};

    for (const log of logs) {
      const startedAtRaw = log.iniciadoEn ?? log.finalizadoEn;
      if (!startedAtRaw) continue;

      const startedAt = new Date(startedAtRaw);
      const ageMs = now.getTime() - startedAt.getTime();
      if (Number.isNaN(startedAt.getTime()) || ageMs < 0 || ageMs > maxAgeMs) continue;

      const terms = parseJsonSafe<string[]>(log.termsJson);

      for (const term of terms) {
        const key = normalizeRecentSyncKey(term);
        if (!key) continue;

        const existing = map[key];
        if (!existing || startedAt.getTime() > existing.at) {
          const badge = getRecentSyncLabel(startedAt, now);
          map[key] = { ...badge, at: startedAt.getTime() };
        }
      }
    }

    return Object.fromEntries(
      Object.entries(map).map(([slug, info]) => [slug, { label: info.label, title: info.title }])
    );
  }, [logs]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETADO': return <Badge variant="success">Completado</Badge>;
      case 'ERROR': return <Badge variant="danger">Error</Badge>;
      case 'EN_PROCESO': return <Badge variant="warning">En Proceso</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const renderDetalle = (log: any) => (
    <div className="space-y-4 text-sm text-stone-600">
      {parseJsonSafe<string[]>(log.termsJson).length > 0 && (
        <div>
          <p className="font-semibold text-stone-900 mb-1">Términos</p>
          <p>{parseJsonSafe<string[]>(log.termsJson).join(', ')}</p>
        </div>
      )}

      {parseJsonSafe<string[]>(log.categoriasJson).length > 0 && (
        <div>
          <p className="font-semibold text-stone-900 mb-1">Categorías afectadas</p>
          <div className="flex flex-wrap gap-2">
            {parseJsonSafe<string[]>(log.categoriasJson).map((categoria) => (
              <span
                key={categoria}
                className="inline-flex rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs text-stone-700"
              >
                {categoria}
              </span>
            ))}
          </div>
        </div>
      )}

      {parseJsonSafe<any[]>(log.resumenJson).length > 0 && (
        <div>
          <p className="font-semibold text-stone-900 mb-2">Resumen por término</p>
          <div className="space-y-2">
            {parseJsonSafe<any[]>(log.resumenJson).map((item, idx) => {
              const term = getAny(item, 'term', 'Term', 'termino', 'Termino') ?? 'sin término';
              const esCategoria = getAny(item, 'esCategoria', 'EsCategoria');
              const encontrados = getAny(item, 'productosEncontrados', 'ProductosEncontrados') ?? 0;
              const nuevos = getAny(item, 'productosNuevos', 'ProductosNuevos') ?? 0;
              const actualizados = getAny(item, 'productosActualizados', 'ProductosActualizados') ?? 0;
              const errores = getAny(item, 'errores', 'Errores') ?? 0;

              return (
                <div key={`${term}-${idx}`} className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                  <p className="font-medium text-stone-900">
                    "{term}"{esCategoria ? ' [cat]' : ''}
                  </p>
                  <p className="mt-1 text-xs text-stone-600">
                    Encontrados: {encontrados} · Nuevos: {nuevos} · Actualizados: {actualizados}
                    {errores > 0 ? ` · Errores: ${errores}` : ''}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {parseJsonSafe<string[]>(log.detalleErrores).length > 0 && (
        <div>
          <p className="font-semibold text-stone-900 mb-2">Errores</p>
          <div className="space-y-2">
            {parseJsonSafe<string[]>(log.detalleErrores).map((error) => (
              <div key={error} className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                {error}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      <Modal
        open={Boolean(selectedLog)}
        title={selectedLog ? `Detalle sync #${selectedLog.id}` : 'Detalle'}
        onClose={() => setSelectedLog(null)}
        maxWidthClassName="max-w-3xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setSelectedLog(null)}>
              Cerrar
            </Button>
            {selectedLog && parseJsonSafe<string[]>(selectedLog.termsJson).length > 0 && (
              <Button
                type="button"
                disabled={syncingLogIds.has(selectedLog.id)}
                onClick={() => void handleResyncLog(selectedLog)}
              >
                <RefreshCw className={`h-4 w-4 mr-1.5 ${syncingLogIds.has(selectedLog.id) ? 'animate-spin' : ''}`} />
                Volver a sincronizar
              </Button>
            )}
          </>
        }
      >
        {selectedLog ? renderDetalle(selectedLog) : null}
      </Modal>

      <div>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight font-outfit">Sincronización Makor</h1>
        <p className="text-stone-500 mt-1">Importá o actualizá productos desde el catálogo de Makor.</p>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <SyncButton onSyncComplete={loadLogs} recentCategorySyncs={recentCategorySyncs} />
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-lg font-medium text-stone-900">Re-sincronizar un producto</h3>
          <p className="text-sm text-stone-500 mt-1">
            Buscá por nombre o código Makor y actualizá solo ese artículo sin correr una sync masiva.
          </p>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            placeholder="Nombre o código Makor..."
            className="pl-9"
            value={productoQuery}
            onChange={(e) => setProductoQuery(e.target.value)}
          />
        </div>

        {productoSearchLoading && (
          <div className="flex justify-center py-6">
            <Spinner size={28} />
          </div>
        )}

        {!productoSearchLoading && normalizeSearchQuery(productoQuery).length >= 2 && productoResults.length === 0 && (
          <p className="text-sm text-stone-500 py-2">No se encontraron productos Makor.</p>
        )}

        {!productoSearchLoading && productoResults.length > 0 && (
          <div className="divide-y divide-stone-100 border border-stone-200 rounded-lg overflow-hidden">
            {productoResults.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 bg-white hover:bg-stone-50/80">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-900 truncate">{p.nombre}</p>
                  <p className="text-xs text-stone-500">
                    {p.codigoMakor}
                    {p.ultimaSync ? ` · ${formatDateTimeAr(p.ultimaSync)}` : ' · Nunca sincronizado'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={syncingIds.has(p.id)}
                  onClick={() => void handleResyncProducto(p.id)}
                  className="shrink-0"
                >
                  <RefreshCw className={`h-4 w-4 mr-1.5 ${syncingIds.has(p.id) ? 'animate-spin' : ''}`} />
                  Re-sync
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-medium text-stone-900 mb-4">Historial Reciente</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Nuevos</TableHead>
              <TableHead className="text-right">Actualizados</TableHead>
              <TableHead className="text-right">Errores</TableHead>
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{new Date(log.iniciadoEn).toLocaleString('es-AR')}</TableCell>
                <TableCell>{getStatusBadge(log.estado)}</TableCell>
                <TableCell className="text-right font-medium text-green-600">+{log.productosNuevos}</TableCell>
                <TableCell className="text-right font-medium text-brand-600">+{log.productosActualizados}</TableCell>
                <TableCell className="text-right text-red-600">{log.errores}</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedLog(log)}
                      className="inline-flex items-center justify-center rounded-md p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-brand-700"
                      title="Ver detalle"
                    >
                      <BookOpen size={17} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleResyncLog(log)}
                      disabled={
                        syncingLogIds.has(log.id) ||
                        parseJsonSafe<string[]>(log.termsJson).length === 0
                      }
                      className="inline-flex items-center justify-center rounded-md p-2 text-sky-600 transition-colors hover:bg-sky-50 disabled:opacity-40 disabled:pointer-events-none"
                      title={
                        parseJsonSafe<string[]>(log.termsJson).length === 0
                          ? 'Sin términos guardados'
                          : 'Volver a sincronizar estos términos'
                      }
                    >
                      <RefreshCw size={17} className={syncingLogIds.has(log.id) ? 'animate-spin' : ''} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-stone-500">
                  No hay registros de sincronización.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
