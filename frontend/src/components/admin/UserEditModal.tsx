'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { KeyRound, UserPlus, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { OrganizationItem, WeddingEvent } from '@/types/invitation';

export interface EditableUser {
  id: string;
  name: string;
  email: string;
  role: string;
  mustChangePassword?: boolean;
  organizationId?: string | null;
  assignedEventId?: string | null;
}

interface UserEditModalProps {
  mode: 'create' | 'admin' | 'self';
  user?: EditableUser;
  actorRole?: string;
  organizations?: OrganizationItem[];
  events?: WeddingEvent[];
  onClose: () => void;
  onSaved: (updatedUser?: {
    id: string;
    name: string;
    email: string;
    role: string;
    organizationId: string | null;
    organizationName?: string | null;
    assignedEventId: string | null;
  }) => void;
}

export function UserEditModal({
  mode,
  user,
  actorRole,
  organizations = [],
  events = [],
  onClose,
  onSaved,
}: UserEditModalProps) {
  const [role, setRole] = useState<'SUPERADMIN' | 'ORG_ADMIN' | 'COUPLE'>(
    (user?.role as 'SUPERADMIN' | 'ORG_ADMIN' | 'COUPLE') || 'COUPLE'
  );
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [mustChangePassword, setMustChangePassword] = useState(
    user?.mustChangePassword !== undefined ? user.mustChangePassword : true
  );
  const [organizationId, setOrganizationId] = useState(user?.organizationId || '');
  const [assignedEventId, setAssignedEventId] = useState(user?.assignedEventId || '');
  const [saving, setSaving] = useState(false);

  const isSuperAdmin = actorRole === 'SUPERADMIN';
  const effectiveRole = mode === 'create' ? (isSuperAdmin ? role : 'COUPLE') : user?.role || 'COUPLE';
  const showOrgSelect =
    (mode === 'create' || mode === 'admin') && isSuperAdmin && effectiveRole !== 'SUPERADMIN';
  const showEventSelect = (mode === 'create' || mode === 'admin') && effectiveRole === 'COUPLE';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin && effectiveRole !== 'COUPLE') {
      toast.error('Solo tienes permisos para gestionar cuentas de pareja (COUPLE)');
      return;
    }
    if (mode === 'create' && newPassword.trim().length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (mode !== 'create' && newPassword && newPassword.trim().length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (mode === 'self' && newPassword && !currentPassword) {
      toast.error('Ingresa tu contraseña actual para cambiar la clave');
      return;
    }
    if (mode === 'create' && effectiveRole === 'ORG_ADMIN' && !organizationId) {
      toast.error('Selecciona la empresa o paquete para este administrador');
      return;
    }

    setSaving(true);
    try {
      if (mode === 'create') {
        const res = await apiFetch<{
          user: {
            id: string;
            name: string;
            email: string;
            role: string;
            organizationId: string | null;
            organizationName?: string | null;
            assignedEventId: string | null;
          };
        }>('/api/users', {
          method: 'POST',
          auth: true,
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password: newPassword.trim(),
            role: effectiveRole,
            mustChangePassword,
            ...(showOrgSelect ? { organizationId: organizationId || null } : {}),
            ...(showEventSelect ? { assignedEventId: assignedEventId || null } : {}),
          }),
        });
        toast.success('Usuario creado correctamente');
        onSaved(res.user);
      } else if (mode === 'self') {
        const res = await apiFetch<{
          token?: string;
          user: {
            id: string;
            name: string;
            email: string;
            role: string;
            organizationId: string | null;
            organizationName?: string | null;
            assignedEventId: string | null;
          };
        }>('/api/auth/me', {
          method: 'PUT',
          auth: true,
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            ...(newPassword.trim()
              ? { currentPassword, newPassword: newPassword.trim() }
              : {}),
          }),
        });
        if (res.token && typeof window !== 'undefined') {
          localStorage.setItem('admin_token', res.token);
        }
        toast.success('Tus datos han sido actualizados');
        onSaved(res.user);
      } else if (user) {
        const res = await apiFetch<{
          user: {
            id: string;
            name: string;
            email: string;
            role: string;
            organizationId: string | null;
            organizationName?: string | null;
            assignedEventId: string | null;
          };
        }>(`/api/users/${user.id}`, {
          method: 'PUT',
          auth: true,
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            ...(newPassword.trim() ? { password: newPassword.trim() } : {}),
            mustChangePassword,
            ...(showOrgSelect ? { organizationId: organizationId || null } : {}),
            ...(showEventSelect ? { assignedEventId: assignedEventId || null } : {}),
          }),
        });
        toast.success('Usuario actualizado');
        onSaved(res.user);
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar usuario');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[1px]">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            {mode === 'create' ? (
              <UserPlus className="h-4 w-4 text-amber-700" />
            ) : (
              <KeyRound className="h-4 w-4 text-amber-700" />
            )}
            <h3 className="font-semibold text-sm text-stone-900">
              {mode === 'create'
                ? 'Crear Nuevo Usuario'
                : mode === 'self'
                  ? 'Mi Perfil y Seguridad'
                  : `Editar Usuario (${user?.role})`}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {mode === 'create' && isSuperAdmin ? (
            <label className="block space-y-1">
              <span className="text-xs font-medium text-stone-700">Tipo de Usuario (Rol)</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'SUPERADMIN' | 'ORG_ADMIN' | 'COUPLE')}
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs bg-white"
              >
                <option value="COUPLE">Pareja / Novios (COUPLE)</option>
                <option value="ORG_ADMIN">Wedding Planner / Admin Empresa (ORG_ADMIN)</option>
                <option value="SUPERADMIN">Administrador Principal (SUPERADMIN)</option>
              </select>
            </label>
          ) : mode === 'create' && !isSuperAdmin ? (
            <div className="rounded-xl bg-amber-50/80 border border-amber-200/90 p-3 text-xs text-amber-900">
              <span className="font-semibold block mb-0.5">Rol: Pareja / Novios (COUPLE)</span>
              <p className="text-[11px] text-amber-800/90">
                Como Wedding Planner, tus accesos creados son exclusivos para la pareja de la boda seleccionada.
              </p>
            </div>
          ) : null}

          <label className="block space-y-1">
            <span className="text-xs font-medium text-stone-700">Nombre</span>
            <input
              type="text"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. María & Carlos o Agencia Bodas"
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-medium text-stone-700">Correo electrónico</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
            />
          </label>

          {showOrgSelect && (
            <label className="block space-y-1">
              <span className="text-xs font-medium text-stone-700">
                Empresa / Paquete {effectiveRole === 'ORG_ADMIN' ? '*' : '(Opcional)'}
              </span>
              <select
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
                required={effectiveRole === 'ORG_ADMIN'}
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs bg-white"
              >
                <option value="">Sin empresa asignada</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.type} · {org.maxEvents} bodas)
                  </option>
                ))}
              </select>
            </label>
          )}

          {showEventSelect && (
            <label className="block space-y-1">
              <span className="text-xs font-medium text-stone-700">Boda Asignada</span>
              <select
                value={assignedEventId}
                onChange={(e) => setAssignedEventId(e.target.value)}
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs bg-white"
              >
                <option value="">Sin boda asignada</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.partnerOneName} &amp; {ev.partnerTwoName} ({ev.slug})
                  </option>
                ))}
              </select>
              <span className="block text-[11px] text-stone-400">
                Las bodas se crean desde el botón &ldquo;+ Nueva Boda&rdquo; en la cabecera superior.
              </span>
            </label>
          )}

          <div className="pt-2 border-t border-stone-100 space-y-3">
            {mode === 'self' && (
              <label className="block space-y-1">
                <span className="text-xs font-medium text-stone-700">
                  Contraseña actual (solo si cambias tu clave)
                </span>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Tu contraseña actual"
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
                />
              </label>
            )}

            <label className="block space-y-1">
              <span className="text-xs font-medium text-stone-700">
                {mode === 'create'
                  ? 'Contraseña (mínimo 6 caracteres) *'
                  : 'Nueva contraseña (opcional — dejar vacío para mantener la actual)'}
              </span>
              <input
                type="password"
                required={mode === 'create'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
              />
            </label>
          </div>

          {(mode === 'create' || mode === 'admin') && (
            <label className="flex items-start gap-2.5 rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs cursor-pointer select-none">
              <input
                type="checkbox"
                checked={mustChangePassword}
                onChange={(e) => setMustChangePassword(e.target.checked)}
                className="mt-0.5 rounded border-stone-300 text-amber-700 focus:ring-amber-600"
              />
              <div className="space-y-0.5">
                <span className="font-semibold text-stone-900 block">
                  Exigir cambio de contraseña al iniciar sesión
                </span>
                <span className="text-[11px] text-stone-500 block leading-tight">
                  Al marcar esta opción, la siguiente vez que el usuario inicie sesión se le obligará a
                  cambiar su contraseña. Una vez cambiada, esta marca se quitará automáticamente.
                </span>
              </div>
            </label>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-stone-300 px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-stone-900 text-white px-4 py-2 text-xs font-semibold hover:bg-stone-800 disabled:opacity-60"
            >
              {saving ? 'Guardando...' : mode === 'create' ? 'Crear Usuario' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
