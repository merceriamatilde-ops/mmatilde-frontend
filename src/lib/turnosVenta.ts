export type TurnoVentaItem = {
  id: number;
  slug: string;
  nombre: string;
  orden: number;
  activo: boolean;
  horaDesde: string;
  descripcionHorario: string;
};

export const DEFAULT_TURNOS: TurnoVentaItem[] = [
  {
    id: 0,
    slug: 'MANANA',
    nombre: 'Mañana',
    orden: 1,
    activo: true,
    horaDesde: '00:00',
    descripcionHorario: 'De 00:00 a antes de 14:00',
  },
  {
    id: 0,
    slug: 'TARDE',
    nombre: 'Tarde',
    orden: 2,
    activo: true,
    horaDesde: '14:00',
    descripcionHorario: 'Desde las 14:00 hasta fin del día',
  },
];

export function parseHoraMinutos(hora: string): number {
  const [h, m] = hora.split(':').map((x) => parseInt(x, 10));
  return (h || 0) * 60 + (m || 0);
}

export function inferirTurnoSlug(time: string, turnos: TurnoVentaItem[]): string {
  const activos = [...turnos]
    .filter((t) => t.activo)
    .sort(
      (a, b) =>
        parseHoraMinutos(a.horaDesde) - parseHoraMinutos(b.horaDesde) || a.orden - b.orden
    );
  if (!activos.length) return 'MANANA';

  const mins = parseHoraMinutos(time);
  let pick = activos[0];
  for (const t of activos) {
    if (mins >= parseHoraMinutos(t.horaDesde)) pick = t;
  }
  return pick.slug;
}

export function turnoLabel(slug: string, turnos?: TurnoVentaItem[]): string {
  return turnos?.find((t) => t.slug === slug)?.nombre ?? slug;
}

export function turnosActivosOrdenados(turnos: TurnoVentaItem[]): TurnoVentaItem[] {
  return [...turnos]
    .filter((t) => t.activo)
    .sort(
      (a, b) =>
        parseHoraMinutos(a.horaDesde) - parseHoraMinutos(b.horaDesde) || a.orden - b.orden
    );
}
