import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import ReactGA from 'react-ga4';
import { api } from '../../api/client';
import { WhatsAppIcon } from '../ui/WhatsAppIcon';

export function HomeIntro() {
  const [config, setConfig] = useState<Record<string, string>>({});

  useEffect(() => {
    api.getConfiguracion().then(setConfig).catch(console.error);
  }, []);

  const whatsappPhone = config.whatsapp || '+5493435190082';
  const waLink = `https://wa.me/${whatsappPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hola Matilde, quiero hacer una consulta.')}`;
  const telefono = config.telefono || '0343 519-0082';
  const direccion = config.direccion || 'Av. Francisco Ramírez 1883, Paraná, Entre Ríos';

  return (
    <>
      {/* Hero de color fijo — impacto al entrar, sin gradientes */}
      <section className="bg-brand-800 text-white">
        <div className="container mx-auto max-w-5xl px-4 py-8 text-center md:py-14">
          <img
            src="/logo-merceria.svg"
            alt={config.nombre_negocio || 'Matilde Mercería'}
            className="mx-auto mb-6 h-24 w-auto brightness-0 invert md:h-32"
          />
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-200">
            {config.nombre_negocio || 'Matilde Mercería'} · Paraná, Entre Ríos
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl font-outfit text-[clamp(2.1rem,6vw,3.6rem)] font-bold leading-[1.05] tracking-tight">
            Todo para tejer, coser y crear
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-brand-100 md:text-lg">
            {config.slogan ||
              'Lanas, hilos, botones y todo para tus proyectos. Mirá el catálogo online y consultanos por WhatsApp.'}
          </p>

          <div className="mt-9 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:justify-center">
            <Link
              to="/categorias"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-800 shadow-sm transition-colors hover:bg-brand-50"
            >
              Ver catálogo
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/buscar"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              <Search className="h-4 w-4" />
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
            <span className="hidden text-brand-200 md:inline" aria-hidden>
              ·
            </span>
            <a
              href={`tel:${telefono.replace(/\s/g, '')}`}
              className="font-semibold text-brand-800 transition-colors hover:text-brand-900"
            >
              <span className="mr-1" aria-hidden>
                📱
              </span>
              {telefono.replace(/\s/g, '')}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
