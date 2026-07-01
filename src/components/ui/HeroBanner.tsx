import React from 'react';
import { MapPin, Clock, Truck, Phone } from 'lucide-react';
import { whatsappUrl } from '../../lib/utils';
import { track } from '@vercel/analytics';

export function HeroBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-brand-900 text-white shadow-2xl mb-12 isolate">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1558025215-67c2930495f4?q=80&w=1200&auto=format&fit=crop"
          alt="Mercería Background"
          className="w-full h-full object-cover opacity-20 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-900/80 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 sm:p-10 lg:p-12 flex flex-col justify-end h-full min-h-[400px]">
        
        {/* Badge */}
        <div className="mb-4">
          <span className="inline-flex items-center rounded-full bg-brand-100/10 px-3 py-1 text-sm font-medium text-brand-100 ring-1 ring-inset ring-brand-100/20 backdrop-blur-sm">
            <Truck className="w-4 h-4 mr-2" />
            Realizamos envíos a todo Paraná
          </span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-outfit tracking-tight mb-4 text-balance">
          Mercería Matilde
        </h1>
        
        <p className="text-brand-100 text-lg sm:text-xl max-w-2xl mb-8 text-balance">
          Todo lo que necesitás para tus proyectos de costura, tejido y manualidades en un solo lugar.
        </p>

        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
          {/* Address Card */}
          <div className="flex items-start p-4 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors">
            <div className="bg-brand-500/20 p-2 rounded-lg mr-4 text-brand-200">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Nuestra Dirección</h3>
              <p className="text-sm text-brand-100 mt-1">San Martín 1234<br/>Paraná, Entre Ríos</p>
            </div>
          </div>

          {/* Hours Card */}
          <div className="flex items-start p-4 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors">
            <div className="bg-brand-500/20 p-2 rounded-lg mr-4 text-brand-200">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Horarios de Atención</h3>
              <p className="text-sm text-brand-100 mt-1">Lun a Vie: 8:30 a 12:30 y 16:30 a 20:30<br/>Sábados: 9:00 a 13:00</p>
            </div>
          </div>

          {/* Contact Card */}
          <div className="flex items-start p-4 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors sm:col-span-2 lg:col-span-1">
            <div className="bg-brand-500/20 p-2 rounded-lg mr-4 text-brand-200">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Contacto</h3>
              <p className="text-sm text-brand-100 mt-1 mb-2">0343 519-0082</p>
              <a 
                href={whatsappUrl("Hola Mercería Matilde, tengo una consulta.")}
                target="_blank"
                rel="noopener noreferrer" 
                onClick={() => track('Consultar_WhatsApp', { origen: 'HeroBanner' })}
                className="inline-flex items-center text-xs font-semibold text-green-400 hover:text-green-300"
              >
                Escribinos por WhatsApp →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
