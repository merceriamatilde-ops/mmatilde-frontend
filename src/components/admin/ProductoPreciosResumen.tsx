import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { formatPrice } from '../../lib/utils';
import {
  getModoPrecioLabel,
  getOrigenMeta,
  type ModoOrigenEconomico,
  type ModoPrecio,
} from './productoPreciosLabels';

type GananciaEstimada = {
  costoReferencia?: number | null;
  gananciaNetaEstimada?: number | null;
  margenSobreVentaPorcentaje?: number | null;
  nota: string;
};

type Presentacion = {
  id?: number | null;
  nombre: string;
  cantidadUnidadBase: number;
  precioVenta?: number | null;
  margenPorcentaje?: number | null;
  precioCalculado?: number | null;
  esDefault: boolean;
  activo: boolean;
  orden: number;
};

type PreciosData = {
  unidadBase?: string | null;
  cantidadUnidadCompra?: number | null;
  etiquetaUnidadCompra?: string | null;
  unidadCompraAutoDetectada?: boolean;
  precioCompra?: number | null;
  costoPorUnidadBase?: number | null;
  ivaPorcentaje?: number;
  margenAplicado?: number;
  modoPrecio?: string;
  ivaPorcentajeProducto?: number | null;
  margenPorcentajeProducto?: number | null;
  ivaGlobal?: number;
  margenGlobal?: number;
  modoOrigenEconomico?: string;
  comisionTiendaPorcentaje?: number | null;
  titularConsignacion?: string | null;
  costoMateriales?: number | null;
  manoObra?: number | null;
  gananciaEstimada?: GananciaEstimada | null;
  precioVentaFinal?: number | null;
  precioVentaPorUnidad?: number | null;
  cantidadReferenciaVenta?: number;
  precioVentaPresentacion?: string | null;
  presentaciones?: Presentacion[];
};

const UNIDAD_LABEL: Record<string, string> = {
  g: 'g',
  kg: 'kg',
  cm: 'cm',
  m: 'm',
  ml: 'ml',
  l: 'l',
  unidad: 'unidad',
  par: 'par',
  docena: 'docena',
};

function etiquetaUnidad(unidad?: string | null) {
  if (!unidad) return 'unidad';
  return UNIDAD_LABEL[unidad] ?? unidad;
}

function precioPresentacion(p: Presentacion) {
  if (p.precioVenta != null) return p.precioVenta;
  if (p.precioCalculado != null) return p.precioCalculado;
  return null;
}

function precioVentaFinal(data: PreciosData) {
  if (data.precioVentaFinal != null) {
    return {
      precio: data.precioVentaFinal,
      precioPorUnidad: data.precioVentaPorUnidad ?? null,
      cantidad: data.cantidadReferenciaVenta ?? 1,
      presentacion: data.precioVentaPresentacion || null,
    };
  }

  const presentaciones = (data.presentaciones || []).filter((p) => p.activo);
  const defaultPres =
    presentaciones.find((p) => p.esDefault) ?? presentaciones[0] ?? null;
  const precio = defaultPres ? precioPresentacion(defaultPres) : null;
  const cantidad = defaultPres?.cantidadUnidadBase ?? 1;
  return {
    precio,
    precioPorUnidad:
      precio != null && cantidad > 0
        ? Math.round((precio / cantidad) * 100) / 100
        : null,
    cantidad,
    presentacion: defaultPres?.nombre || null,
  };
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-stone-50 last:border-0">
      <span className="text-stone-600 shrink-0">{label}</span>
      <span className="font-medium text-stone-900 text-right">{value}</span>
    </div>
  );
}

type ProductoPreciosResumenProps = {
  productoId: number;
};

export function ProductoPreciosResumen({ productoId }: ProductoPreciosResumenProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PreciosData | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getProductoPrecios(productoId)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err: { status?: number }) => {
        if (!cancelled) {
          setError(
            err?.status === 404
              ? 'No se encontró la API de precios.'
              : 'Error al cargar precios del producto.'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productoId]);

  if (loading) {
    return <p className="text-sm text-stone-500 py-8 text-center">Cargando precios…</p>;
  }

  if (error || !data) {
    return <p className="text-sm text-red-600 py-8 text-center">{error ?? 'Sin datos'}</p>;
  }

  const origen = (data.modoOrigenEconomico || 'REVENTA') as ModoOrigenEconomico;
  const modoPrecio = (data.modoPrecio || 'AUTOMATICO') as ModoPrecio;
  const origenMeta = getOrigenMeta(origen);
  const esReventa = origen === 'REVENTA';
  const esConsignacion = origen === 'CONSIGNACION';
  const esElaboracion = origen === 'ELABORACION_PROPIA';
  const usaFormula = esReventa && modoPrecio !== 'PRECIO_FIJO';
  const presentaciones = (data.presentaciones || []).filter((p) => p.activo);
  const venta = precioVentaFinal(data);
  const ganancia = data.gananciaEstimada;
  const unidad = etiquetaUnidad(data.unidadBase);
  const muestraPorUnidad = venta.cantidad > 1 && venta.precioPorUnidad != null;
  const sinPrecioCompra = usaFormula && (data.precioCompra == null || data.precioCompra <= 0);
  const sinPrecioVenta = venta.precio == null;

  return (
    <div className="space-y-5">
      {(sinPrecioCompra || sinPrecioVenta) && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-900">Precio incompleto</p>
          <p className="mt-1 text-xs text-amber-800">
            {sinPrecioCompra && sinPrecioVenta
              ? 'Makor no envió precio de compra y aún no hay precio de venta. Editá precios para cargarlo.'
              : sinPrecioCompra
                ? 'Sin precio de compra en Makor — la fórmula no puede calcular hasta que lo cargues.'
                : 'Sin precio de venta configurado.'}
          </p>
        </div>
      )}
      <div className="rounded-xl border border-brand-200 bg-brand-50/50 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-700">
          Precio de venta final
        </p>
        {muestraPorUnidad ? (
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-stone-500">
                Por {unidad}
              </p>
              <p className="mt-0.5 text-2xl font-bold text-brand-900 tabular-nums">
                {formatPrice(venta.precioPorUnidad!)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-stone-500">
                {venta.presentacion || `Paquete x${venta.cantidad}`}
              </p>
              <p className="mt-0.5 text-2xl font-bold text-brand-900 tabular-nums">
                {venta.precio != null ? formatPrice(venta.precio) : '—'}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-1 text-2xl font-bold text-brand-900 tabular-nums">
            {venta.precio != null ? formatPrice(venta.precio) : '—'}
          </p>
        )}
        {muestraPorUnidad && venta.presentacion && (
          <p className="mt-2 text-xs text-stone-600">Presentación: {venta.presentacion}</p>
        )}
        {!muestraPorUnidad && venta.presentacion && (
          <p className="mt-0.5 text-xs text-stone-600">Presentación: {venta.presentacion}</p>
        )}
      </div>

      <section className="rounded-lg border border-stone-200 bg-stone-50/60 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
          Tipo de producto
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-medium text-stone-800 border border-stone-200">
            {origenMeta.emoji} {origenMeta.label}
          </span>
          {esReventa && (
            <span className="inline-flex items-center rounded-md bg-white px-2 py-1 text-xs font-medium text-stone-700 border border-stone-200">
              {getModoPrecioLabel(modoPrecio)}
            </span>
          )}
        </div>
      </section>

      {usaFormula && (
        <section className="rounded-xl border border-stone-200 bg-stone-50/60 p-4">
          <h4 className="text-sm font-semibold text-stone-900 mb-2">Costos y fórmula</h4>
          <Row
            label="Precio compra"
            value={data.precioCompra != null ? formatPrice(data.precioCompra) : '—'}
          />
          <Row
            label="Costo por unidad base"
            value={data.costoPorUnidadBase != null ? formatPrice(data.costoPorUnidadBase) : '—'}
          />
          {data.unidadBase && (
            <Row
              label="Unidad base"
              value={
                data.cantidadUnidadCompra
                  ? `${data.cantidadUnidadCompra} ${data.unidadBase}${data.etiquetaUnidadCompra ? ` (${data.etiquetaUnidadCompra})` : ''}`
                  : data.unidadBase
              }
            />
          )}
          <Row label="IVA aplicado" value={`${data.ivaPorcentaje ?? '—'}%`} />
          <Row label="Margen aplicado" value={`${data.margenAplicado ?? '—'}%`} />
          {modoPrecio === 'EXCEPCION' && (
            <>
              <Row
                label="IVA producto"
                value={
                  data.ivaPorcentajeProducto != null ? `${data.ivaPorcentajeProducto}%` : '—'
                }
              />
              <Row
                label="Margen producto"
                value={
                  data.margenPorcentajeProducto != null
                    ? `${data.margenPorcentajeProducto}%`
                    : '—'
                }
              />
            </>
          )}
        </section>
      )}

      {esConsignacion && (
        <section className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
          <h4 className="text-sm font-semibold text-stone-900 mb-2">Consignación</h4>
          <Row
            label="% mercería"
            value={
              data.comisionTiendaPorcentaje != null ? `${data.comisionTiendaPorcentaje}%` : '—'
            }
          />
          <Row label="Titular" value={data.titularConsignacion || '—'} />
        </section>
      )}

      {esElaboracion && (
        <section className="rounded-xl border border-violet-200 bg-violet-50/40 p-4">
          <h4 className="text-sm font-semibold text-stone-900 mb-2">Elaboración propia</h4>
          <Row
            label="Materiales"
            value={data.costoMateriales != null ? formatPrice(data.costoMateriales) : '—'}
          />
          <Row label="Mano de obra" value={data.manoObra != null ? formatPrice(data.manoObra) : '—'} />
        </section>
      )}

      {presentaciones.length > 0 && (
        <section className="rounded-xl border border-stone-200 p-4">
          <h4 className="text-sm font-semibold text-stone-900 mb-3">Presentaciones</h4>
          <div className="space-y-2">
            {presentaciones.map((p) => {
              const precio = precioPresentacion(p);
              return (
                <div
                  key={p.id ?? `${p.nombre}-${p.orden}`}
                  className="flex items-center justify-between gap-3 rounded-lg bg-stone-50 px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-stone-900 truncate">{p.nombre || '—'}</span>
                    {p.esDefault && (
                      <span className="shrink-0 rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand-800">
                        Default
                      </span>
                    )}
                  </div>
                  <span className="font-semibold text-brand-800 shrink-0">
                    {precio != null ? formatPrice(precio) : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {ganancia?.gananciaNetaEstimada != null && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-900">
            Ganancia estimada: {formatPrice(ganancia.gananciaNetaEstimada)}
            {ganancia.margenSobreVentaPorcentaje != null && (
              <span className="ml-2 font-normal text-emerald-700">
                ({ganancia.margenSobreVentaPorcentaje.toFixed(0)}% del precio)
              </span>
            )}
          </p>
          {ganancia.nota && <p className="mt-1 text-xs text-stone-600">{ganancia.nota}</p>}
        </div>
      )}
    </div>
  );
}
