import type { ModoOrigenEconomico } from '../components/admin/productoPreciosLabels';

export type GananciaPreview = {
  costoReferencia?: number | null;
  gananciaNetaEstimada?: number | null;
  margenSobreVentaPorcentaje?: number | null;
  nota: string;
};

export function calcularPrecioFormula(
  costoBase: number | null | undefined,
  cantidadUnidadBase: number,
  iva: number,
  margen: number,
  descuentoPorcentaje = 0
): number | null {
  if (costoBase == null || cantidadUnidadBase <= 0) return null;

  const costoPresentacion = costoBase * cantidadUnidadBase;
  const conIva = costoPresentacion * (1 + iva / 100);
  let precio = conIva * (1 + margen / 100);

  if (descuentoPorcentaje > 0) {
    precio *= 1 - descuentoPorcentaje / 100;
  }

  return Math.round(precio * 100) / 100;
}

export function calcularMargenElaboracion(params: {
  costoMateriales?: number | null;
  manoObra?: number | null;
  margenPorcentaje?: number | null;
  margenMonto?: number | null;
}): number {
  const base = (params.costoMateriales ?? 0) + (params.manoObra ?? 0);
  if (params.margenMonto != null && !Number.isNaN(params.margenMonto)) {
    return Math.round(params.margenMonto * 100) / 100;
  }
  const pct = params.margenPorcentaje ?? 0;
  return Math.round(((base * pct) / 100) * 100) / 100;
}

export function calcularPrecioElaboracion(params: {
  costoMateriales?: number | null;
  manoObra?: number | null;
  margenPorcentaje?: number | null;
  margenMonto?: number | null;
}): number | null {
  const base = (params.costoMateriales ?? 0) + (params.manoObra ?? 0);
  if (base <= 0 && params.margenMonto == null && params.margenPorcentaje == null) return null;
  return Math.round((base + calcularMargenElaboracion(params)) * 100) / 100;
}

export function estimarGananciaPreview(params: {
  modoOrigen: ModoOrigenEconomico;
  precioVenta: number | null;
  comisionPorcentaje?: number | null;
  costoMateriales?: number | null;
  manoObra?: number | null;
  margenElaboracionPorcentaje?: number | null;
  margenElaboracionMonto?: number | null;
  costoCompraPresentacion?: number | null;
  ivaPorcentaje?: number | null;
}): GananciaPreview | null {
  const { modoOrigen, precioVenta } = params;
  if (precioVenta == null || precioVenta <= 0) return null;

  switch (modoOrigen) {
    case 'CONSIGNACION': {
      const pct = params.comisionPorcentaje ?? 0;
      const ganancia = Math.round(((precioVenta * pct) / 100) * 100) / 100;
      const aTitular = precioVenta - ganancia;
      return {
        costoReferencia: aTitular,
        gananciaNetaEstimada: ganancia,
        margenSobreVentaPorcentaje: pct,
        nota: `Consignación: la mercería retiene ${pct}% (${formatMoney(ganancia)}); ${formatMoney(aTitular)} corresponde al titular.`,
      };
    }
    case 'ELABORACION_PROPIA': {
      const materiales = params.costoMateriales ?? 0;
      const manoObra = params.manoObra ?? 0;
      const baseCosto = materiales + manoObra;
      const margenObjetivo = calcularMargenElaboracion({
        costoMateriales: materiales,
        manoObra,
        margenPorcentaje: params.margenElaboracionPorcentaje,
        margenMonto: params.margenElaboracionMonto,
      });
      const ganancia = precioVenta - baseCosto;

      return {
        costoReferencia: baseCosto,
        gananciaNetaEstimada: ganancia,
        margenSobreVentaPorcentaje: precioVenta > 0 ? (ganancia / precioVenta) * 100 : null,
        nota:
          ganancia < 0
            ? `Pérdida estimada: por debajo del costo (materiales + MO = ${formatMoney(baseCosto)}). Margen objetivo: ${formatMoney(margenObjetivo)}.`
            : `Ganancia = precio − (materiales + mano de obra). Margen objetivo: ${formatMoney(margenObjetivo)}. Materiales y MO no son ganancia.`,
      };
    }
    case 'SIN_COSTO':
      return {
        costoReferencia: 0,
        gananciaNetaEstimada: precioVenta,
        margenSobreVentaPorcentaje: 100,
        nota: 'Ganancia total: no hay costo de adquisición.',
      };
    default: {
      const costo = params.costoCompraPresentacion;
      if (costo == null) {
        return {
          costoReferencia: null,
          gananciaNetaEstimada: null,
          margenSobreVentaPorcentaje: null,
          nota: 'Falta costo de compra para estimar ganancia.',
        };
      }
      const iva = params.ivaPorcentaje ?? 0;
      const costoConIva = Math.round(costo * (1 + iva / 100) * 100) / 100;
      const ganancia = precioVenta - costoConIva;
      return {
        costoReferencia: costoConIva,
        gananciaNetaEstimada: ganancia,
        margenSobreVentaPorcentaje: precioVenta > 0 ? (ganancia / precioVenta) * 100 : 0,
        nota:
          ganancia < 0
            ? `Pérdida estimada: venta por debajo de costo + IVA (${formatMoney(costoConIva)}). El IVA no es ganancia.`
            : 'Reventa: precio de venta menos costo de compra con IVA. El IVA no es ganancia.',
      };
    }
  }
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  }).format(value);
}
