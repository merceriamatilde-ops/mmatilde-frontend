import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { RefreshCw } from 'lucide-react';
import { api } from '../../api/client';
import { toast } from 'sonner';
import { Spinner } from '../ui/Spinner';

export function SyncButton({ onSyncComplete }: { onSyncComplete: () => void }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [keywords, setKeywords] = useState('');
  const [categorias, setCategorias] = useState<any[]>([]);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  useEffect(() => {
    api.getAllCategorias().then(res => {
      setCategorias(res);
      setLoadingCats(false);
    }).catch(console.error);
  }, []);

  const handleToggleCat = (slug: string) => {
    setSelectedCats(prev => prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]);
  };

  const handleSync = async () => {
    const terms = keywords.split(',').map(t => t.trim()).filter(t => t.length > 0);
    const combinedTerms = [...terms, ...selectedCats];

    if (combinedTerms.length === 0) {
      toast.error('Ingresá al menos una palabra clave o seleccioná una categoría');
      return;
    }

    setIsSyncing(true);
    toast.info('Sincronización iniciada... Puede demorar unos minutos.');
    
    try {
      const res = await api.executeSync(combinedTerms);
      
      if (res.success) {
        toast.success(`Sincronización completada. Se importaron/actualizaron ${res.count} productos.`);
        setKeywords('');
        setSelectedCats([]);
        onSyncComplete();
      } else {
        toast.error('Ocurrió un error en la sincronización.');
      }
    } catch (error) {
      toast.error('Error de red durante la sincronización.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end space-x-4 max-w-xl">
        <div className="flex-1 space-y-2">
          <label htmlFor="keywords" className="text-sm font-medium leading-none text-stone-700">
            Palabras Clave libres (opcional)
          </label>
          <Input
            id="keywords"
            placeholder="Ej: lanas, agujas"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            disabled={isSyncing}
          />
        </div>
        <Button onClick={handleSync} disabled={isSyncing || (keywords.trim().length === 0 && selectedCats.length === 0)} className="w-[180px]">
          {isSyncing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sincronizar
            </>
          )}
        </Button>
      </div>

      <div className="space-y-3 border-t border-stone-200 pt-4">
        <label className="text-sm font-medium text-stone-700">O seleccioná Categorías para sincronizar completas:</label>
        {loadingCats ? (
          <Spinner size={24} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {categorias.map(c => (
              <label key={c.id} className="flex items-center space-x-2 text-sm text-stone-600 cursor-pointer hover:text-stone-900 bg-stone-50 p-2 rounded-md border border-stone-100 hover:border-amber-200 hover:bg-amber-50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={selectedCats.includes(c.slug)} 
                  onChange={() => handleToggleCat(c.slug)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                  disabled={isSyncing}
                />
                <span>{c.nombre}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
