export type LineaDescuentoInput = {
  cantidad: number;
  precioUnitario: number;
  gananciaBrutaLinea: number;
  descuentoPorcentaje?: number;
  descuentoMonto?: number;
};

export type LineaDescuentoResult = {
  subtotalBruto: number;
  descuentoLineaMonto: number;
  subtotalNeto: number;
  descuentoGlobalAsignado: number;
  subtotalFinal: number;
  gananciaNetaEstimada: number;
};

export type VentaDescuentoResult = {
  subtotalBruto: number;
  subtotalNetoLineas: number;
  descuentoGlobalMonto: number;
  total: number;
  gananciaNetaEstimada: number;
  lineas: LineaDescuentoResult[];
};

const round = (v: number) => Math.round(v * 100) / 100;
const clampPct = (p: number) => Math.min(100, Math.max(0, p));

export function calcularVentaDescuentos(
  lineas: LineaDescuentoInput[],
  descuentoGlobalPorcentaje = 0,
  descuentoGlobalMonto?: number | null
): VentaDescuentoResult {
  if (lineas.length === 0) {
    return {
      subtotalBruto: 0,
      subtotalNetoLineas: 0,
      descuentoGlobalMonto: 0,
      total: 0,
      gananciaNetaEstimada: 0,
      lineas: [],
    };
  }

  const intermediates = lineas.map((l) => {
    const subBruto = round(l.cantidad * l.precioUnitario);
    const descLinea =
      (l.descuentoMonto ?? 0) > 0
        ? round(l.descuentoMonto!)
        : round(subBruto * clampPct(l.descuentoPorcentaje ?? 0) / 100);
    const descLineaFinal = Math.min(descLinea, subBruto);
    const subNeto = subBruto - descLineaFinal;
    const ganAfterLine = l.gananciaBrutaLinea - descLineaFinal;
    return { subBruto, descLinea: descLineaFinal, subNeto, ganAfterLine };
  });

  const baseGlobal = intermediates.reduce((s, x) => s + x.subNeto, 0);
  let descGlobal =
    (descuentoGlobalMonto ?? 0) > 0
      ? round(descuentoGlobalMonto!)
      : round(baseGlobal * clampPct(descuentoGlobalPorcentaje) / 100);
  if (descGlobal > baseGlobal) descGlobal = baseGlobal;

  const results: LineaDescuentoResult[] = [];
  let assigned = 0;
  let maxIdx = 0;
  let maxNeto = 0;

  intermediates.forEach((it, i) => {
    const share = baseGlobal > 0 ? round(descGlobal * (it.subNeto / baseGlobal)) : 0;
    assigned += share;
    if (it.subNeto >= maxNeto) {
      maxNeto = it.subNeto;
      maxIdx = i;
    }
    results.push({
      subtotalBruto: it.subBruto,
      descuentoLineaMonto: it.descLinea,
      subtotalNeto: it.subNeto,
      descuentoGlobalAsignado: share,
      subtotalFinal: it.subNeto - share,
      gananciaNetaEstimada: it.ganAfterLine - share,
    });
  });

  const diff = round(descGlobal - assigned);
  if (diff !== 0 && results.length > 0) {
    const r = results[maxIdx];
    results[maxIdx] = {
      ...r,
      descuentoGlobalAsignado: r.descuentoGlobalAsignado + diff,
      subtotalFinal: r.subtotalFinal - diff,
      gananciaNetaEstimada: r.gananciaNetaEstimada - diff,
    };
  }

  return {
    subtotalBruto: results.reduce((s, x) => s + x.subtotalBruto, 0),
    subtotalNetoLineas: baseGlobal,
    descuentoGlobalMonto: descGlobal,
    total: baseGlobal - descGlobal,
    gananciaNetaEstimada: results.reduce((s, x) => s + x.gananciaNetaEstimada, 0),
    lineas: results,
  };
}
