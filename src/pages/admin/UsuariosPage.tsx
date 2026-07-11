import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { KeyRound, Pencil, Plus, Trash2, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Spinner } from '../../components/ui/Spinner';
import { Switch } from '../../components/ui/Switch';

type Usuario = {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  activo: boolean;
  createdAt: string;
};

const SUPERADMIN_EMAIL = 'admin@mmatilde.com';

const isSuperAdmin = (email: string) => email.toLowerCase() === SUPERADMIN_EMAIL;

const isSameUser = (target: Usuario, current?: { id?: string; email?: string }) => {
  if (!current) return false;
  if (current.id && target.id === current.id) return true;
  if (current.email && target.email.toLowerCase() === current.email.toLowerCase()) return true;
  return false;
};

const canDeleteUsuario = (target: Usuario, current?: { id?: string; email?: string }) =>
  !isSuperAdmin(target.email) && !isSameUser(target, current);

const emptyCreate = {
  email: '',
  nombre: '',
  password: '',
  rol: 'VIEWER',
};

function apiMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) {
    try {
      const parsed = JSON.parse(err.message);
      if (parsed?.message) return parsed.message as string;
    } catch {
      if (err.message.length < 200) return err.message;
    }
  }
  return fallback;
}

export function UsuariosPage() {
  const { user: currentUser } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [editForm, setEditForm] = useState({ email: '', nombre: '', rol: 'VIEWER', activo: true });
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<Usuario | null>(null);

  if (currentUser?.rol !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  const load = async () => {
    try {
      const data = await api.getUsuarios();
      setUsuarios(data);
    } catch {
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.email.trim() || !createForm.nombre.trim() || !createForm.password) return;

    setSaving(true);
    try {
      await api.createUsuario({
        email: createForm.email.trim(),
        nombre: createForm.nombre.trim(),
        password: createForm.password,
        rol: createForm.rol,
      });
      toast.success('Usuario creado');
      setCreateForm(emptyCreate);
      await load();
    } catch (err) {
      toast.error(apiMessage(err, 'Error al crear usuario'));
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (u: Usuario) => {
    setEditing(u);
    setEditForm({
      email: u.email,
      nombre: u.nombre,
      rol: u.rol,
      activo: u.activo,
    });
    setNewPassword('');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;

    setSaving(true);
    try {
      await api.updateUsuario(editing.id, {
        email: editForm.email.trim(),
        nombre: editForm.nombre.trim(),
        rol: editForm.rol,
        activo: editForm.activo,
      });
      toast.success('Usuario actualizado');
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(apiMessage(err, 'Error al actualizar'));
    } finally {
      setSaving(false);
    }
  };

  const handlePassword = async () => {
    if (!editing || newPassword.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setSaving(true);
    try {
      await api.setUsuarioPassword(editing.id, newPassword);
      toast.success('Contraseña actualizada');
      setNewPassword('');
    } catch (err) {
      toast.error(apiMessage(err, 'Error al cambiar contraseña'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: Usuario) => {
    setSaving(true);
    try {
      await api.deleteUsuario(u.id);
      toast.success('Usuario eliminado');
      if (editing?.id === u.id) setEditing(null);
      await load();
    } catch (err) {
      toast.error(apiMessage(err, 'Error al eliminar'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Spinner size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConfirmModal
        open={Boolean(usuarioAEliminar)}
        title="Eliminar usuario"
        description={
          usuarioAEliminar
            ? `Se va a eliminar "${usuarioAEliminar.nombre}" (${usuarioAEliminar.email}). Su carrito de ventas también se borrará.`
            : undefined
        }
        confirmLabel="Eliminar"
        onClose={() => setUsuarioAEliminar(null)}
        onConfirm={() => {
          if (!usuarioAEliminar) return;
          void handleDelete(usuarioAEliminar).finally(() => setUsuarioAEliminar(null));
        }}
      />

      <div>
        <h1 className="font-outfit text-3xl font-bold tracking-tight text-stone-900">Usuarios</h1>
        <p className="mt-1 text-stone-500">
          Gestioná las cuentas del backoffice. Cada usuario tiene su propio carrito de ventas.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm lg:col-span-1"
        >
          <div className="mb-4 flex items-center gap-2">
            <Plus size={18} className="text-brand-600" />
            <h2 className="font-semibold text-stone-900">Nuevo usuario</h2>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Email</label>
              <Input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Nombre</label>
              <Input
                value={createForm.nombre}
                onChange={(e) => setCreateForm({ ...createForm, nombre: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Contraseña</label>
              <Input
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                minLength={8}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Rol</label>
              <Select
                value={createForm.rol}
                onChange={(e) => setCreateForm({ ...createForm, rol: e.target.value })}
              >
                <option value="VIEWER">Viewer</option>
                <option value="ADMIN">Admin</option>
              </Select>
            </div>
            <Button type="submit" disabled={saving} className="w-full">
              Crear usuario
            </Button>
          </div>
        </form>

        <div className="lg:col-span-2 space-y-4">
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-stone-200">
              <thead className="bg-stone-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Rol</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-stone-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {usuarios.map((u) => (
                  <tr key={u.id} className="hover:bg-stone-50/80">
                    <td className="px-4 py-3 text-sm font-medium text-stone-900">
                      {u.nombre}
                      {isSuperAdmin(u.email) && (
                        <span className="ml-2 text-xs font-medium text-amber-700">superadmin</span>
                      )}
                      {currentUser && isSameUser(u, currentUser) && (
                        <span className="ml-2 text-xs text-stone-400">(vos)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-stone-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.rol === 'ADMIN'
                            ? 'bg-brand-100 text-brand-800'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {u.rol}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(u)}
                          className="rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        {canDeleteUsuario(u, currentUser ?? undefined) && (
                          <button
                            type="button"
                            onClick={() => setUsuarioAEliminar(u)}
                            className="rounded-md p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {usuarios.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-stone-500">
                      <Users className="mx-auto mb-2 h-8 w-8 text-stone-300" />
                      No hay usuarios
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {editing && (
            <form
              onSubmit={handleUpdate}
              className="rounded-xl border border-brand-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-stone-900">Editar: {editing.nombre}</h2>
                <button type="button" onClick={() => setEditing(null)}>
                  <X size={18} className="text-stone-400" />
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-600">Email</label>
                  <Input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    disabled={isSuperAdmin(editing.email)}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-600">Nombre</label>
                  <Input
                    value={editForm.nombre}
                    onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-600">Rol</label>
                  <Select
                    value={editForm.rol}
                    onChange={(e) => setEditForm({ ...editForm, rol: e.target.value })}
                    disabled={isSuperAdmin(editing.email)}
                  >
                    <option value="VIEWER">Viewer</option>
                    <option value="ADMIN">Admin</option>
                  </Select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-3 text-sm text-stone-700">
                    <Switch
                      checked={editForm.activo}
                      onCheckedChange={(v) => setEditForm({ ...editForm, activo: v })}
                      disabled={isSameUser(editing, currentUser ?? undefined) || isSuperAdmin(editing.email)}
                    />
                    Activo
                    {isSuperAdmin(editing.email) && (
                      <span className="text-xs text-stone-400">Superadmin siempre activo</span>
                    )}
                    {currentUser && isSameUser(editing, currentUser) && !isSuperAdmin(editing.email) && (
                      <span className="text-xs text-stone-400">No podés desactivarte</span>
                    )}
                  </label>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="submit" disabled={saving}>
                  Guardar cambios
                </Button>
              </div>

              <div className="mt-6 border-t border-stone-100 pt-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-stone-700">
                  <KeyRound size={16} />
                  Nueva contraseña
                </div>
                <div className="flex flex-wrap gap-2">
                  <Input
                    type="password"
                    className="max-w-xs"
                    placeholder="Mínimo 8 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={8}
                  />
                  <Button type="button" variant="secondary" disabled={saving} onClick={handlePassword}>
                    Cambiar contraseña
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
