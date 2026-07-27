import React, { useEffect, useState } from 'react';
import { MapPin, Mail, Clock, Truck, Star, ExternalLink } from 'lucide-react';
import { api } from '../../api/client';
import { Helmet } from 'react-helmet-async';
import { SEO } from '../../components/SEO';
import { Spinner } from '../../components/ui/Spinner';
import { Select } from '../../components/ui/Select';
import { WhatsAppIcon } from '../../components/ui/WhatsAppIcon';
import { SITE_ORIGIN } from '../../../lib/siteMeta';
import { trackSocial, trackWhatsApp } from '../../lib/analytics';

const DIAS_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function formatDias(dias: string[]): string {
  if (!dias?.length) return '';
  if (dias.length === 1) return dias[0];
  const sorted = [...dias].sort((a, b) => DIAS_ORDER.indexOf(a) - DIAS_ORDER.indexOf(b));
  if (sorted.length === 2) return `${sorted[0]} y ${sorted[1]}`;
  let consecutive = true;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (DIAS_ORDER.indexOf(sorted[i + 1]) !== DIAS_ORDER.indexOf(sorted[i]) + 1) {
      consecutive = false;
      break;
    }
  }
  if (consecutive && sorted.length >= 3) return `De ${sorted[0]} a ${sorted[sorted.length - 1]}`;
  const last = sorted.pop();
  return `${sorted.join(', ')} y ${last}`;
}

type HorarioGrupo = { dias?: string[]; turnos?: { apertura: string; cierre: string }[] };

function parseHorarios(json?: string): { abiertos: { dias: string; turnos: string }[]; cerrados: string } | null {
  if (!json) return null;
  try {
    const grupos: HorarioGrupo[] = JSON.parse(json);
    if (!Array.isArray(grupos) || grupos.length === 0) return null;

    const abiertos = grupos.map((g) => ({
      dias: formatDias(g.dias ?? []),
      turnos: (g.turnos ?? []).map((t) => `${t.apertura} a ${t.cierre}`).join(' y '),
    }));

    const configured = new Set<string>();
    grupos.forEach((g) => g.dias?.forEach((d) => configured.add(d)));
    const closed = DIAS_ORDER.filter((d) => !configured.has(d));
    const cerrados = closed.length > 0 ? formatDias(closed) : '';

    return { abiertos, cerrados };
  } catch {
    return null;
  }
}

function mapsEmbedUrl(direccion: string): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(direccion)}&z=16&ie=UTF8&iwloc=&output=embed`;
}

const ASUNTOS = [
  { value: 'consulta', label: 'Consulta de producto' },
  { value: 'pedido', label: 'Quiero hacer un pedido' },
  { value: 'envio', label: 'Consulta por envío' },
  { value: 'otro', label: 'Otro' },
] as const;

export function ContactoPage() {
  const [config, setConfig] = useState<Record<string, string> | null>(null);
  const [nombre, setNombre] = useState('');
  const [asunto, setAsunto] = useState<string>(ASUNTOS[0].value);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    api.getConfiguracion().then(setConfig).catch(console.error);
  }, []);

  if (!config) {
    return (
      <>
        <SEO
          title="Contacto"
          description="Contactá a Matilde Mercería en Paraná. WhatsApp, email, dirección y horarios de atención."
        />
        <div className="flex h-[50vh] items-center justify-center">
          <Spinner size={40} />
        </div>
      </>
    );
  }

  const whatsappPhone = config.whatsapp || '+5493435190082';
  const direccion = config.direccion || 'Av. Francisco Ramírez 1883, Paraná, Entre Ríos';
  const email = config.email || '';
  const horarios = parseHorarios(config.horarios);
  const mapsLink = config.google_maps_url || mapsEmbedUrl(direccion);
  const reviewLink = config.google_review_url;

  const buildWaMessage = () => {
    const asuntoLabel = ASUNTOS.find((a) => a.value === asunto)?.label ?? asunto;
    const parts = ['Hola Matilde!'];
    if (nombre.trim()) parts.push(`Soy ${nombre.trim()}.`);
    parts.push(`Asunto: ${asuntoLabel}.`);
    if (mensaje.trim()) parts.push(mensaje.trim());
    return parts.join('\n');
  };

  const handleWhatsAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = buildWaMessage();
    const url = `https://wa.me/${whatsappPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
    trackWhatsApp('contacto_form');
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const localBusinessJson = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: config.nombre_negocio || 'Matilde Mercería',
    description: config.slogan || 'Mercería en Paraná, Entre Ríos',
    url: SITE_ORIGIN,
    email: email || undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: direccion,
      addressLocality: 'Paraná',
      addressRegion: 'Entre Ríos',
      addressCountry: 'AR',
    },
  };

  return (
    <div className="animate-fade-in">
      <SEO
        title="Contacto"
        description={`Contactá a ${config.nombre_negocio || 'Matilde Mercería'} en Paraná. WhatsApp, email, dirección y horarios de atención.`}
        url={`${SITE_ORIGIN}/contacto`}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(localBusinessJson)}</script>
      </Helmet>

      <section className="border-b border-stone-200 bg-brand-50 py-10">
        <div className="container mx-auto max-w-5xl px-4 text-center">
          <h1 className="font-outfit text-[clamp(1.75rem,5vw,2.5rem)] font-bold tracking-tight text-brand-900">
            Contactanos
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-stone-600">
            Estamos en Paraná. Escribinos por WhatsApp o email, o pasá por el local.
          </p>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
          {/* Columna izquierda */}
          <div className="space-y-8">
            <div className="grid gap-3 sm:grid-cols-2">
              <a
                href={`https://wa.me/${whatsappPhone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackWhatsApp('contacto_card')}
                className="flex flex-col items-center gap-2 rounded-2xl border border-stone-200 bg-white p-4 text-center transition-colors hover:border-[#25D366] hover:bg-[#25D366]/5"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-white">
                  <WhatsAppIcon size={22} />
                </span>
                <span className="text-sm font-semibold text-stone-900">WhatsApp</span>
              </a>
              {email ? (
                <a
                  href={`mailto:${email}`}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-stone-200 bg-white p-4 text-center transition-colors hover:border-brand-500 hover:bg-brand-50"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-brand-800">
                    <Mail size={20} />
                  </span>
                  <span className="break-all text-sm font-semibold text-stone-900">{email}</span>
                </a>
              ) : (
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-4 text-center">
                  <Mail size={20} className="text-stone-400" />
                  <span className="text-sm text-stone-500">Email no configurado</span>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5">
              <h2 className="font-outfit text-lg font-semibold text-stone-900">Escribinos por WhatsApp</h2>
              <p className="mt-1 text-sm text-stone-500">Completá el formulario y te abrimos el chat con el mensaje listo.</p>
              <form onSubmit={handleWhatsAppSubmit} className="mt-4 space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">Tu nombre (opcional)</label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: María"
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">Asunto</label>
                  <Select
                    value={asunto}
                    onChange={(e) => setAsunto(e.target.value)}
                    className="rounded-lg border-stone-200 focus:ring-brand-500"
                  >
                    {ASUNTOS.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">Mensaje</label>
                  <textarea
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    required
                    rows={4}
                    placeholder="Contanos qué necesitás..."
                    className="w-full resize-none rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1da851]"
                >
                  <WhatsAppIcon size={18} />
                  Enviar por WhatsApp
                </button>
              </form>
            </div>

            {(config.instagram_url || config.facebook_url) && (
              <div className="rounded-2xl border border-stone-200 bg-white p-5">
                <h2 className="font-outfit text-lg font-semibold text-stone-900">Redes sociales</h2>
                <div className="mt-3 flex flex-wrap gap-3">
                  {config.instagram_url && (
                    <a
                      href={config.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackSocial('instagram', 'contacto')}
                      className="inline-flex items-center gap-2 rounded-full border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:border-brand-500 hover:text-brand-800"
                    >
                      Instagram
                      <ExternalLink size={14} />
                    </a>
                  )}
                  {config.facebook_url && (
                    <a
                      href={config.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackSocial('facebook', 'contacto')}
                      className="inline-flex items-center gap-2 rounded-full border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:border-brand-500 hover:text-brand-800"
                    >
                      Facebook
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Columna derecha */}
          <div className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
              <div className="aspect-[4/3] w-full bg-stone-100 sm:aspect-video">
                <iframe
                  title="Ubicación Matilde Mercería"
                  src={mapsEmbedUrl(direccion)}
                  className="h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex items-start gap-2 text-sm text-stone-700">
                  <MapPin size={18} className="mt-0.5 shrink-0 text-brand-700" />
                  <span>{direccion}</span>
                </div>
                <a
                  href={mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-900"
                >
                  Cómo llegar
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-stone-200 bg-white p-5">
                <div className="flex items-center gap-2 text-brand-800">
                  <Clock size={18} />
                  <h2 className="font-outfit font-semibold text-stone-900">Horarios</h2>
                </div>
                {horarios ? (
                  <ul className="mt-3 space-y-2 text-sm text-stone-600">
                    {horarios.abiertos.map((h, i) => (
                      <li key={i}>
                        <span className="font-medium text-stone-800">{h.dias}:</span> {h.turnos}
                      </li>
                    ))}
                    {horarios.cerrados && (
                      <li>
                        <span className="font-medium text-stone-800">{horarios.cerrados}:</span> Cerrado
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-stone-500">Consultanos horarios por WhatsApp.</p>
                )}
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white p-5">
                <div className="flex items-center gap-2 text-brand-800">
                  <Truck size={18} />
                  <h2 className="font-outfit font-semibold text-stone-900">Envíos</h2>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-stone-600">
                  Hacemos envíos a toda la ciudad de Paraná. Consultanos por WhatsApp costos y zonas.
                </p>
              </div>
            </div>

            {reviewLink && (
              <a
                href={reviewLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackSocial('google_review', 'contacto')}
                className="flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100"
              >
                <Star size={18} className="fill-amber-500 text-amber-500" />
                Dejanos tu reseña en Google
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
