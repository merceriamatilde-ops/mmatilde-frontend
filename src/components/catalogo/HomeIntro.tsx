import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';

export function HomeIntro() {
  const [config, setConfig] = useState<Record<string, string>>({});

  useEffect(() => {
    api.getConfiguracion().then(setConfig).catch(console.error);
  }, []);

  const direccion = config.direccion || 'Av. Francisco Ramírez 1883, Paraná, Entre Ríos';

  return (
    <>
      {/* Hero de color fijo — impacto al entrar, sin gradientes */}
      <section className="bg-brand-800 text-white">
        <div className="container mx-auto max-w-5xl px-4 py-6 text-center md:py-10">
          <img
            src="/logo-merceria.svg"
            alt={config.nombre_negocio || 'Matilde Mercería'}
            className="mx-auto mb-6 h-24 w-auto brightness-0 invert md:h-32"
          />
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-200">
            {config.nombre_negocio || 'Matilde Mercería'} · Paraná, Entre Ríos
          </p>
        </div>
      </section>

      {/* Info práctica — banda de color fijo */}
      <div className="border-b border-brand-100 bg-brand-50">
        <div className="container mx-auto max-w-5xl px-4 py-3.5 text-center text-sm text-stone-700">
          <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:justify-center md:gap-x-6 md:gap-y-1">
            <span>
              <span className="mr-1" aria-hidden>
                📍
              </span>
              {direccion}
            </span>
            <span className="hidden text-brand-200 md:inline" aria-hidden>
              ·
            </span>
            <span>
              <span className="mr-1" aria-hidden>
                🚚
              </span>
              Envíos a toda la ciudad de Paraná
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
