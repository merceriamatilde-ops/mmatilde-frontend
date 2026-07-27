import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';

export function HomeIntro() {
  const [config, setConfig] = useState<Record<string, string>>({});

  useEffect(() => {
    api.getConfiguracion().then(setConfig).catch(console.error);
  }, []);

  const direccion = config.direccion || 'Av. Francisco Ramírez 1883, Paraná, Entre Ríos';
  const brand = config.nombre_negocio || 'Matilde Mercería';

  return (
    <>
      <section className="bg-brand-800 text-white">
        <div className="container mx-auto max-w-5xl px-4 py-6 text-center md:py-10">
          {/* H1 solo para SEO/a11y: el logo ya muestra la marca */}
          <h1 className="sr-only">{brand} — Mercería en Paraná</h1>
          <img
            src="/logo-merceria.svg"
            alt=""
            className="mx-auto mb-4 h-24 w-auto brightness-0 invert md:mb-5 md:h-32"
            aria-hidden
          />
          <p className="mx-auto max-w-xl text-base text-brand-100 md:text-lg">
            Mercería en Paraná, Entre Ríos. Hilos, lanas, agujas y todo para costura, tejidos y
            manualidades.
          </p>
        </div>
      </section>

      <div className="border-b border-brand-100 bg-brand-50">
        <div className="container mx-auto max-w-5xl px-4 py-3.5 text-center text-sm text-stone-700">
          <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:justify-center md:gap-x-6 md:gap-y-1">
            <span>{direccion}</span>
            <span className="hidden text-brand-300 md:inline" aria-hidden>
              ·
            </span>
            <span>Envíos a toda la ciudad de Paraná</span>
          </div>
        </div>
      </div>
    </>
  );
}
