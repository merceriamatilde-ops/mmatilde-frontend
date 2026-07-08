import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { RefreshCw } from 'lucide-react';
import { api } from '../../api/client';
import { toast } from 'sonner';
import { Spinner } from '../ui/Spinner';

type RecentSyncInfo = {
  label: string;
  title: string;
};

function normalizeRecentSyncKey(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getRecentSyncInfoForCategory(
  categoria: { slug?: string; nombre?: string },
  recentCategorySyncs: Record<string, RecentSyncInfo>
) {
  const slugKey = normalizeRecentSyncKey(categoria.slug);
  const nameKey = normalizeRecentSyncKey(categoria.nombre);
  return recentCategorySyncs[slugKey] ?? recentCategorySyncs[nameKey] ?? null;
}

export function SyncButton({
  onSyncComplete,
  recentCategorySyncs = {},
}: {
  onSyncComplete: () => void;
  recentCategorySyncs?: Record<string, RecentSyncInfo>;
}) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [keywords, setKeywords] = useState('');
  const [categorias, setCategorias] = useState<any[]>([]);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [showAllCats, setShowAllCats] = useState(false);

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

  const VISIBLE_CATS = 6;
  const visibleCategorias = showAllCats
    ? categorias
    : categorias.filter((c, idx) => idx < VISIBLE_CATS || selectedCats.includes(c.slug));
  const hiddenCount = Math.max(categorias.length - VISIBLE_CATS, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(20rem,1fr)] xl:items-end">
        <div className="space-y-1.5">
          <h4 className="text-base font-medium text-stone-900">Sincronización Manual</h4>
          <p className="text-sm text-stone-500">
            Ingresá palabras clave para buscar en Makor. El sistema buscará esos términos,
            extraerá los resultados y los guardará en tu base de datos de forma automática.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end xl:justify-end">
          <div className="flex-1 space-y-2 xl:max-w-md">
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
          <Button
            onClick={handleSync}
            disabled={isSyncing || (keywords.trim().length === 0 && selectedCats.length === 0)}
            className="w-full sm:w-[180px]"
          >
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
      </div>

      <div className="space-y-3 border-t border-stone-200 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="text-sm font-medium text-stone-700">
            O seleccioná Categorías para sincronizar completas:
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {Object.keys(recentCategorySyncs).length > 0 && (
              <span className="text-xs text-stone-500">
                <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 align-middle" />
                Punto verde = sincronizado recientemente
              </span>
            )}
            {selectedCats.length > 0 && (
              <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800">
                {selectedCats.length} seleccionada{selectedCats.length === 1 ? '' : 's'}
              </span>
            )}
          </div>
        </div>
        {loadingCats ? (
          <Spinner size={24} />
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {visibleCategorias.map(c => {
                const recentInfo = getRecentSyncInfoForCategory(c, recentCategorySyncs);
                return (
                  <label
                    key={c.id}
                    className={`flex items-center space-x-2 text-sm cursor-pointer p-2 rounded-md border transition-[background-color,color,box-shadow,border-color] ${
                      selectedCats.includes(c.slug)
                        ? 'border-stone-200 bg-brand-50 text-brand-900 ring-2 ring-brand-200'
                        : 'text-stone-600 hover:text-stone-900 bg-stone-50 border-stone-100 hover:border-brand-200 hover:bg-brand-50'
                    }`}
                    title={recentInfo?.title}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCats.includes(c.slug)}
                      onChange={() => handleToggleCat(c.slug)}
                      className="rounded text-brand-800 focus:ring-brand-600"
                      disabled={isSyncing}
                    />
                    <span className="min-w-0 flex-1 line-clamp-2">{c.nombre}</span>
                    {recentInfo && (
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500"
                        aria-label={recentInfo.label}
                        title={recentInfo.title}
                      />
                    )}
                  </label>
                );
              })}
            </div>

            {categorias.length > VISIBLE_CATS && (
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllCats((prev) => !prev)}
                  disabled={isSyncing}
                >
                  {showAllCats ? 'Ver menos' : `Ver ${hiddenCount} más`}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
