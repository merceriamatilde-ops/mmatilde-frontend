import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { api } from '../../api/client';
import { toast } from 'sonner';
import { Spinner } from '../ui/Spinner';
import { HorariosEditor } from './HorariosEditor';
import { MediosPagoSection } from './MediosPagoSection';
import { TurnosVentaSection } from './TurnosVentaSection';

export function ConfigForm() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await api.getConfiguracion();
      setConfig(data);
    } catch (error) {
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateConfiguracion(config);
      toast.success('Configuración guardada correctamente');
    } catch (error) {
      toast.error('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-8 text-center"><Spinner /></div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Información General</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre del Negocio</label>
            <Input name="nombre_negocio" value={config['nombre_negocio'] || ''} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Slogan</label>
            <Input name="slogan" value={config['slogan'] || ''} onChange={handleChange} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Contacto</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Teléfono</label>
            <Input name="telefono" value={config['telefono'] || ''} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">WhatsApp (con código país +549)</label>
            <Input name="whatsapp" value={config['whatsapp'] || ''} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input name="email" type="email" value={config['email'] || ''} onChange={handleChange} placeholder="hola@merceriamatilde.com" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Dirección</label>
            <Input name="direccion" value={config['direccion'] || ''} onChange={handleChange} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Redes Sociales</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Instagram URL</label>
            <Input name="instagram_url" value={config['instagram_url'] || ''} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Facebook URL</label>
            <Input name="facebook_url" value={config['facebook_url'] || ''} onChange={handleChange} />
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t border-stone-200 pt-6">
        <h3 className="text-lg font-medium">Google y Ubicación</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 col-span-2">
            <label className="text-sm font-medium">Google Maps URL</label>
            <Input name="google_maps_url" value={config['google_maps_url'] || ''} onChange={handleChange} placeholder="https://maps.app.goo.gl/..." />
          </div>
          <div className="space-y-2 col-span-2">
            <label className="text-sm font-medium">URL para Reseñas (Puntuanos)</label>
            <Input name="google_review_url" value={config['google_review_url'] || ''} onChange={handleChange} placeholder="https://g.page/r/..." />
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t border-stone-200 pt-6">
        <h3 className="text-lg font-medium">Turnos de venta</h3>
        <TurnosVentaSection />
      </div>

      <div className="space-y-4 border-t border-stone-200 pt-6">
        <h3 className="text-lg font-medium">Medios de pago</h3>
        <MediosPagoSection />
      </div>

      <div className="space-y-4 border-t border-stone-200 pt-6 pb-4">
        <h3 className="text-lg font-medium">Horarios de Atención</h3>
        <p className="text-sm text-stone-500">Agrupá los días que comparten el mismo horario. Podés agregar turnos mañana y tarde.</p>
        <HorariosEditor 
          value={config['horarios'] || ''} 
          onChange={(val) => setConfig(prev => ({ ...prev, horarios: val }))}
        />
      </div>

      <Button type="submit" disabled={saving}>
        {saving ? 'Guardando...' : 'Guardar Cambios'}
      </Button>
    </form>
  );
}
