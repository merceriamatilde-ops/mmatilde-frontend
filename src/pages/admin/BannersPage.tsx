import React, { useEffect, useRef, useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  GripVertical,
  Upload,
  X,
  Image as ImageIcon,
  ExternalLink,
  Eye,
  EyeOff,
  Link as LinkIcon,
} from 'lucide-react';
import { api } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { toast } from 'sonner';

type LinkTipo = 'Ninguno' | 'Categoria' | 'Coleccion' | 'Url';

interface Banner {
  id: number;
  titulo: string;
  imagenDesktopUrl: string;
  imagenMobileUrl: string | null;
  linkTipo: LinkTipo;
  linkCategoriaId: number | null;
  linkTagId: number | null;
  linkUrl: string | null;
  href: string | null;
  ubicacion: string;
  orden: number;
  activo: boolean;
  abreEnNuevaPestana: boolean;
  fechaDesde: string | null;
  fechaHasta: string | null;
  vigente: boolean;
}

interface FormState {
  titulo: string;
  imagenDesktopUrl: string;
  imagenMobileUrl: string;
  linkTipo: LinkTipo;
  linkCategoriaId: string;
  linkTagId: string;
  linkUrl: string;
  activo: boolean;
  abreEnNuevaPestana: boolean;
  fechaDesde: string;
  fechaHasta: string;
}

const EMPTY_FORM: FormState = {
  titulo: '',
  imagenDesktopUrl: '',
  imagenMobileUrl: '',
  linkTipo: 'Ninguno',
  linkCategoriaId: '',
  linkTagId: '',
  linkUrl: '',
  activo: true,
  abreEnNuevaPestana: false,
  fechaDesde: '',
  fechaHasta: '',
};

// timestamptz -> value de <input type="date"> (YYYY-MM-DD)
const isoToDateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : '');
// <input type="date"> -> ISO UTC. Fin de día para "hasta" así incluye el día completo.
const dateInputToIso = (v: string, endOfDay = false) =>
  v ? new Date(`${v}T${endOfDay ? '23:59:59' : '00:00:00'}Z`).toISOString() : null;

export function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categorias, setCategorias] = useState<{ id: number; nombre: string }[]>([]);
  const [tags, setTags] = useState<{ id: number; nombre: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [bs, cats, tgs] = await Promise.allSettled([
      api.getBannersAdmin(),
      api.getCategoriasAdmin(),
      api.getTags(),
    ]);
    if (bs.status === 'fulfilled') setBanners(bs.value);
    else toast.error('Error al cargar banners');
    if (cats.status === 'fulfilled')
      setCategorias((cats.value || []).map((c: any) => ({ id: c.id, nombre: c.nombre })));
    if (tgs.status === 'fulfilled')
      setTags((tgs.value || []).map((t: any) => ({ id: t.id, nombre: t.nombre })));
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (b: Banner) => {
    setEditing(b);
    setForm({
      titulo: b.titulo,
      imagenDesktopUrl: b.imagenDesktopUrl,
      imagenMobileUrl: b.imagenMobileUrl || '',
      linkTipo: b.linkTipo,
      linkCategoriaId: b.linkCategoriaId ? String(b.linkCategoriaId) : '',
      linkTagId: b.linkTagId ? String(b.linkTagId) : '',
      linkUrl: b.linkUrl || '',
      activo: b.activo,
      abreEnNuevaPestana: b.abreEnNuevaPestana,
      fechaDesde: isoToDateInput(b.fechaDesde),
      fechaHasta: isoToDateInput(b.fechaHasta),
    });
    setModalOpen(true);
  };

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'desktop' | 'mobile',
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const setUploading = target === 'desktop' ? setUploadingDesktop : setUploadingMobile;
    setUploading(true);
    try {
      const { url } = await api.uploadImage(file);
      setForm((f) => ({
        ...f,
        [target === 'desktop' ? 'imagenDesktopUrl' : 'imagenMobileUrl']: url,
      }));
      toast.success('Imagen subida');
    } catch (err: any) {
      toast.error(err.message || 'No se pudo subir la imagen');
    } finally {
      setUploading(false);
      if (target === 'desktop' && desktopInputRef.current) desktopInputRef.current.value = '';
      if (target === 'mobile' && mobileInputRef.current) mobileInputRef.current.value = '';
    }
  };

  const validate = (): string | null => {
    if (!form.titulo.trim()) return 'Poné un título de referencia.';
    if (!form.imagenDesktopUrl) return 'Falta la imagen (desktop).';
    if (form.linkTipo === 'Categoria' && !form.linkCategoriaId) return 'Elegí una categoría.';
    if (form.linkTipo === 'Coleccion' && !form.linkTagId) return 'Elegí una colección/tag.';
    if (form.linkTipo === 'Url' && !form.linkUrl.trim()) return 'Poné la URL de destino.';
    return null;
  };

  const handleSubmit = async () => {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }
    setSaving(true);
    const payload = {
      titulo: form.titulo.trim(),
      imagenDesktopUrl: form.imagenDesktopUrl,
      imagenMobileUrl: form.imagenMobileUrl || null,
      linkTipo: form.linkTipo,
      linkCategoriaId: form.linkTipo === 'Categoria' ? Number(form.linkCategoriaId) : null,
      linkTagId: form.linkTipo === 'Coleccion' ? Number(form.linkTagId) : null,
      linkUrl: form.linkTipo === 'Url' ? form.linkUrl.trim() : null,
      ubicacion: 'home',
      activo: form.activo,
      abreEnNuevaPestana: form.abreEnNuevaPestana,
      fechaDesde: dateInputToIso(form.fechaDesde),
      fechaHasta: dateInputToIso(form.fechaHasta, true),
    };
    try {
      if (editing) {
        await api.updateBanner(editing.id, payload);
        toast.success('Banner actualizado');
      } else {
        await api.createBanner(payload);
        toast.success('Banner creado');
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (b: Banner) => {
    setBanners((prev) => prev.map((x) => (x.id === b.id ? { ...x, activo: !x.activo } : x)));
    try {
      await api.toggleBanner(b.id, !b.activo);
    } catch (err: any) {
      toast.error(err.message || 'No se pudo cambiar el estado');
      loadData();
    }
  };

  const handleDelete = async (b: Banner) => {
    try {
      await api.deleteBanner(b.id);
      toast.success('Banner eliminado');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'No se pudo eliminar');
    }
  };

  const persistOrden = async (list: Banner[]) => {
    try {
      await api.reorderBanners(list.map((b) => b.id));
    } catch (err: any) {
      toast.error(err.message || 'No se pudo guardar el orden');
      loadData();
    }
  };

  const handleDropOn = (targetIndex: number) => {
    setOverIndex(null);
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      return;
    }
    setBanners((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(targetIndex, 0, moved);
      void persistOrden(next);
      return next;
    });
    setDragIndex(null);
  };

  const destinoLabel = (b: Banner) => {
    switch (b.linkTipo) {
      case 'Categoria':
        return 'Categoría';
      case 'Coleccion':
        return 'Colección';
      case 'Url':
        return 'URL';
      default:
        return 'Sin enlace';
    }
  };

  if (loading) return <div className="p-8 text-center text-stone-500">Cargando...</div>;

  return (
    <div className="space-y-6">
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Eliminar banner"
        description={deleteTarget ? `Se va a eliminar "${deleteTarget.titulo}".` : undefined}
        confirmLabel="Eliminar"
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          void handleDelete(deleteTarget).finally(() => setDeleteTarget(null));
        }}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-outfit text-2xl font-bold text-stone-900">Banners</h1>
          <p className="text-stone-500">
            Arrastrá para ordenar. Se muestran en la home los que estén activos y vigentes.
          </p>
        </div>
        <Button onClick={openCreate} className="w-full sm:w-auto">
          <Plus size={20} className="mr-2" />
          Nuevo Banner
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        {banners.length === 0 ? (
          <div className="p-8 text-center text-stone-500">
            No hay banners todavía. Creá uno para empezar.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {banners.map((b, index) => (
              <div
                key={b.id}
                onDragOver={(e) => {
                  if (dragIndex === null) return;
                  e.preventDefault();
                  setOverIndex(index);
                }}
                onDrop={() => handleDropOn(index)}
                className={`flex flex-wrap items-center gap-y-2 p-4 transition-colors ${
                  dragIndex === index ? 'opacity-40' : ''
                } ${overIndex === index && dragIndex !== index ? 'bg-brand-50' : 'hover:bg-stone-50'}`}
              >
                <span
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragEnd={() => {
                    setDragIndex(null);
                    setOverIndex(null);
                  }}
                  title="Arrastrar para reordenar"
                  className="mr-1 flex shrink-0 cursor-grab items-center text-stone-300 hover:text-stone-500 active:cursor-grabbing"
                >
                  <GripVertical size={18} />
                </span>

                <div className="mr-3 h-12 w-24 shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
                  {b.imagenDesktopUrl ? (
                    <img src={b.imagenDesktopUrl} alt={b.titulo} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-stone-300">
                      <ImageIcon size={18} />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-semibold text-stone-900">{b.titulo}</span>
                    {!b.vigente && b.activo && (
                      <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                        Fuera de vigencia
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-stone-500">
                    <LinkIcon size={12} />
                    <span>{destinoLabel(b)}</span>
                    {b.href && (
                      <>
                        <span>·</span>
                        <span className="truncate text-stone-400">{b.href}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="ml-auto flex shrink-0 items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggle(b)}
                    title={b.activo ? 'Activo (click para desactivar)' : 'Inactivo (click para activar)'}
                    className={b.activo ? 'text-green-600' : 'text-stone-400'}
                  >
                    {b.activo ? <Eye size={16} /> : <EyeOff size={16} />}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openEdit(b)}>
                    <Edit2 size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteTarget(b)}
                    className="text-red-600 hover:border-red-200 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <input
        ref={desktopInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleUpload(e, 'desktop')}
      />
      <input
        ref={mobileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleUpload(e, 'mobile')}
      />

      <Modal
        open={modalOpen}
        title={editing ? 'Editar banner' : 'Nuevo banner'}
        onClose={() => setModalOpen(false)}
        maxWidthClassName="max-w-2xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Título (referencia interna)
            </label>
            <Input
              autoFocus
              value={form.titulo}
              onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
              placeholder="Ej: Envío gratis desde $50.000"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ImagePicker
              label="Imagen desktop"
              hint="Se muestra entera (sin recorte). Ideal 16:9, ej. 1920×1080 o 2752×1536."
              url={form.imagenDesktopUrl}
              uploading={uploadingDesktop}
              onPick={() => desktopInputRef.current?.click()}
              onRemove={() => setForm((f) => ({ ...f, imagenDesktopUrl: '' }))}
              aspect="aspect-video"
            />
            <ImagePicker
              label="Imagen mobile (opcional)"
              hint="Si la dejás vacía, se usa la de desktop. También se muestra entera."
              url={form.imagenMobileUrl}
              uploading={uploadingMobile}
              onPick={() => mobileInputRef.current?.click()}
              onRemove={() => setForm((f) => ({ ...f, imagenMobileUrl: '' }))}
              aspect="aspect-video"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Al hacer click…</label>
            <Select
              value={form.linkTipo}
              onChange={(e) =>
                setForm((f) => ({ ...f, linkTipo: e.target.value as LinkTipo }))
              }
              className="admin-select"
            >
              <option value="Ninguno">No hacer nada (solo imagen)</option>
              <option value="Categoria">Ir a una categoría</option>
              <option value="Coleccion">Ir a una colección / tag</option>
              <option value="Url">Ir a una URL (ej. Google Maps)</option>
            </Select>
          </div>

          {form.linkTipo === 'Categoria' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Categoría</label>
              <Select
                value={form.linkCategoriaId}
                onChange={(e) => setForm((f) => ({ ...f, linkCategoriaId: e.target.value }))}
                className="admin-select"
                searchable
              >
                <option value="">Elegí una categoría…</option>
                {categorias.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.nombre}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {form.linkTipo === 'Coleccion' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Colección / tag</label>
              <Select
                value={form.linkTagId}
                onChange={(e) => setForm((f) => ({ ...f, linkTagId: e.target.value }))}
                className="admin-select"
                searchable
              >
                <option value="">Elegí una colección…</option>
                {tags.map((t) => (
                  <option key={t.id} value={String(t.id)}>
                    {t.nombre}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {form.linkTipo === 'Url' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">URL de destino</label>
              <Input
                value={form.linkUrl}
                onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
                placeholder="https://maps.google.com/… o /contacto"
              />
              <label className="mt-2 flex items-center gap-2 text-sm text-stone-600">
                <input
                  type="checkbox"
                  checked={form.abreEnNuevaPestana}
                  onChange={(e) => setForm((f) => ({ ...f, abreEnNuevaPestana: e.target.checked }))}
                  className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
                />
                <ExternalLink size={14} />
                Abrir en una pestaña nueva
              </label>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">
                Desde (opcional)
              </label>
              <Input
                type="date"
                value={form.fechaDesde}
                onChange={(e) => setForm((f) => ({ ...f, fechaDesde: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">
                Hasta (opcional)
              </label>
              <Input
                type="date"
                value={form.fechaHasta}
                onChange={(e) => setForm((f) => ({ ...f, fechaHasta: e.target.value }))}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))}
              className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
            />
            Activo (visible en la home)
          </label>
        </div>
      </Modal>
    </div>
  );
}

function ImagePicker({
  label,
  hint,
  url,
  uploading,
  onPick,
  onRemove,
  aspect,
}: {
  label: string;
  hint: string;
  url: string;
  uploading: boolean;
  onPick: () => void;
  onRemove: () => void;
  aspect: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-stone-700">{label}</label>
      <div
        className={`relative flex ${aspect} w-full items-center justify-center overflow-hidden rounded-xl border border-stone-200 bg-stone-50`}
      >
        {url ? (
          <>
            <img src={url} alt={label} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={onRemove}
              title="Quitar"
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-red-600 shadow-sm transition-colors hover:bg-white"
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <span className="flex flex-col items-center gap-1 text-stone-400">
            <ImageIcon size={28} />
            <span className="text-xs">Sin imagen</span>
          </span>
        )}
      </div>
      <div className="mt-2">
        <Button variant="outline" size="sm" disabled={uploading} onClick={onPick} className="w-full">
          <Upload size={14} className="mr-2" />
          {uploading ? 'Subiendo...' : 'Subir imagen'}
        </Button>
      </div>
      <p className="mt-1 text-xs text-stone-400">{hint}</p>
    </div>
  );
}
