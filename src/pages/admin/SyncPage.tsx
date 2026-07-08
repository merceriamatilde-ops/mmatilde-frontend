import React, { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { SyncButton } from '../../components/admin/SyncButton';
import { api } from '../../api/client';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';

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

  const loadLogs = () => {
    api.getSyncLogs().then(setLogs).catch(console.error);
  };

  useEffect(() => {
    loadLogs();
  }, []);

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
          <Button variant="outline" onClick={() => setSelectedLog(null)}>
            Cerrar
          </Button>
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
              <TableHead className="text-center">Detalle</TableHead>
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
                  <button
                    type="button"
                    onClick={() => setSelectedLog(log)}
                    className="inline-flex items-center justify-center rounded-md p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-brand-700"
                    title="Ver detalle"
                  >
                    <BookOpen size={17} />
                  </button>
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
