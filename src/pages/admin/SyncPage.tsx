import React, { useEffect, useState } from 'react';
import { SyncButton } from '../../components/admin/SyncButton';
import { api } from '../../api/client';
import { Badge } from '../../components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';

export function SyncPage() {
  const [logs, setLogs] = useState<any[]>([]);

  const loadLogs = () => {
    api.getSyncLogs().then(setLogs).catch(console.error);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETADO': return <Badge variant="success">Completado</Badge>;
      case 'ERROR': return <Badge variant="danger">Error</Badge>;
      case 'EN_PROCESO': return <Badge variant="warning">En Proceso</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight font-outfit">Sincronización Makor</h1>
        <p className="text-stone-500 mt-1">Importá o actualizá productos desde el catálogo de Makor.</p>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-medium text-stone-900 mb-4">Sincronización Manual</h3>
        <p className="text-sm text-stone-500 mb-6">
          Ingresá palabras clave para buscar en Makor. El sistema buscará esos términos, extraerá los resultados y los guardará en tu base de datos de forma automática.
        </p>
        <SyncButton onSyncComplete={loadLogs} />
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{new Date(log.iniciadoEn).toLocaleString('es-AR')}</TableCell>
                <TableCell>{getStatusBadge(log.estado)}</TableCell>
                <TableCell className="text-right font-medium text-green-600">+{log.productosNuevos}</TableCell>
                <TableCell className="text-right font-medium text-amber-500">+{log.productosActualizados}</TableCell>
                <TableCell className="text-right text-red-600">{log.errores}</TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-stone-500">
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
