import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import ReactGA from 'react-ga4';
import { api } from '../../api/client';
import { WhatsAppIcon } from '../ui/WhatsAppIcon';
import type { CategoriaCardData } from './types';

type HomeIntroProps = {
  categorias?: CategoriaCardData[];
};

function horarioResumen(horariosJson?: string): string {
  if (!horariosJson) return 'Consultanos horarios por WhatsApp';

  try {
    const grupos = JSON.parse(horariosJson);
    if (!Array.isArray(grupos) || grupos.length === 0) return 'Consultanos horarios por WhatsApp';

    return grupos
      .slice(0, 2)
      .map((g: { dias?: string[]; turnos?: { apertura: string; cierre: string }[] }) => {
        const dias = g.dias ?? [];
        let diasStr = dias.join(', ');
        if (dias.length >= 5 && dias.includes('Lunes') && dias.includes('Viernes')) {
          diasStr = 'Lun a Vie';
        } else if (dias.length === 1) {
          diasStr = dias[0];
        }
        const turnos = (g.turnos ?? []).map((t) => `${t.apertura} a ${t.cierre}`).join(' y ');
        return turnos ? `${diasStr} ${turnos}` : diasStr;
      })
      .filter(Boolean)
      .join(' · ');
  } catch {
    return 'Consultanos horarios por WhatsApp';
  }
}

export function HomeIntro({ categorias = [] }: HomeIntroProps) {
  const [config, setConfig] = useState<Record<string, string>>({});

  useEffect(() => {
    api.getConfiguracion().then(setConfig).catch(console.error);
  }, []);

  const whatsappPhone = config.whatsapp || '+5493435190082';
  const waLink = `https://wa.me/${whatsappPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hola Matilde, quiero hacer una consulta.')}`;
  const telefono = config.telefono || '0343 519-0082';
  const direccion = config.direccion || 'Paraná, Entre Ríos';
  const quickCats = categorias.slice(0, 6);

  return (
    <section className="relative overflow-hidden border-b border-stone-200 bg-gradient-to-b from-brand-50/50 via-stone-50 to-white">
      {/* Detalle decorativo sutil */}
      <div
        className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-brand-100/40 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-brand-200/25 blur-3xl"
        aria-hidden
      />

      <div className="container relative mx-auto max-w-7xl px-4 py-10 md:py-14">
        {/* Mensaje principal */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-wide text-brand-700">
            {config.nombre_negocio || 'Matilde Mercería'} · Paraná, Entre Ríos
          </p>
          <h1 className="mt-2 font-outfit text-[clamp(1.85rem,5vw,2.75rem)] font-bold leading-[1.15] tracking-tight text-brand-900">
            Todo para tejer, coser y crear
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-stone-600 md:text-lg">
            {config.slogan ||
              'Lanas, hilos, botones y todo para tus proyectos. Mirá el catálogo online y consultanos por WhatsApp.'}
          </p>

          {/* CTAs principales */}
          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:justify-center">
            <Link
              to="/categorias"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-800 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-900"
            >
              Ver catálogo
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/buscar"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-800 transition-colors hover:border-brand-300 hover:bg-brand-50/50"
            >
              <Search className="h-4 w-4 text-brand-700" />
              Buscar productos
            </Link>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => ReactGA.event({ category: 'WhatsApp', action: 'Consultar_Hero' })}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1da851]"
            >
              <WhatsAppIcon size={16} />
              Escribinos
            </a>
          </div>
        </div>

        {/* Acceso rápido a categorías reales */}
        {quickCats.length > 0 && (
          <div className="mx-auto mt-10 max-w-3xl">
            <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-stone-500">
              Empezá por acá
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {quickCats.map((cat) => {
                const icon = cat.icono || cat.icon || '📦';
                return (
                  <Link
                    key={cat.slug}
                    to={`/categorias/${cat.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-2 text-sm font-medium text-stone-700 shadow-sm transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
                  >
                    <span className="text-base leading-none">{icon}</span>
                    {cat.nombre}
                  </Link>
                );
              })}
              {categorias.length > quickCats.length && (
                <Link
                  to="/categorias"
                  className="inline-flex items-center gap-1 rounded-full border border-dashed border-stone-300 px-3.5 py-2 text-sm font-medium text-stone-500 transition-colors hover:border-brand-400 hover:text-brand-700"
                >
                  Ver todas
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Info práctica — una sola línea clara, no bloques pesados */}
        <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-stone-200/80 bg-white/70 px-4 py-3.5 text-center text-sm text-stone-600 backdrop-blur-sm md:px-6">
          <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:justify-center md:gap-x-6 md:gap-y-1">
            <span>
              <span className="mr-1" aria-hidden>
                📍
              </span>
              {direccion}
            </span>
            <span className="hidden text-stone-300 md:inline" aria-hidden>
              ·
            </span>
            <span>
              <span className="mr-1" aria-hidden>
                🕐
              </span>
              {horarioResumen(config.horarios)}
            </span>
            <span className="hidden text-stone-300 md:inline" aria-hidden>
              ·
            </span>
            <a
              href={`tel:${telefono.replace(/\s/g, '')}`}
              className="font-medium text-brand-800 transition-colors hover:text-brand-900"
            >
              <span className="mr-1" aria-hidden>
                📱
              </span>
              {telefono}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
