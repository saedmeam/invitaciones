'use client';

import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Building2, Pencil, Plus, Power, Search, Trash2, UserPlus, Users } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { OrganizationItem, OrganizationType, WeddingEvent } from '@/types/invitation';
import { ConfirmModal } from './ConfirmModal';
import { EditableUser, UserEditModal } from './UserEditModal';

export interface GlobalUserItem {
  id: string;
  email: string;
  name: string;
  role: string;
  mustChangePassword?: boolean;
  organizationId: string | null;
  organizationName: string | null;
  organizationType?: string | null;
  organizationMaxEvents?: number | null;
  assignedEventId: string | null;
  assignedEventSlug: string | null;
  assignedEventTitle?: string | null;
  createdById: string | null;
  createdByName?: string | null;
  createdByEmail?: string | null;
  createdByRole?: string | null;
}

interface AdminOrganizationsTabProps {
  organizations: OrganizationItem[];
  events: WeddingEvent[];
  allUsers: GlobalUserItem[];
  currentUserId: string;
  onRefresh: () => void;
}

export function AdminOrganizationsTab({
  organizations,
  events,
  allUsers,
  currentUserId,
  onRefresh,
}: AdminOrganizationsTabProps) {
  const [form, setForm] = useState({
    name: '',
    slug: '',
    type: 'PLANNER' as OrganizationType,
    contactEmail: '',
    maxEvents: 10,
    adminName: '',
    adminEmail: '',
    adminPassword: '',
  });
  const [creating, setCreating] = useState(false);

  const [newAdminByOrg, setNewAdminByOrg] = useState<
    Record<string, { name: string; email: string; password: string }>
  >({});
  const [editingUser, setEditingUser] = useState<EditableUser | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [deletingUser, setDeletingUser] = useState<GlobalUserItem | null>(null);
  const [deletingOrg, setDeletingOrg] = useState<OrganizationItem | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [orgFilter, setOrgFilter] = useState('ALL');

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return allUsers.filter((u) => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
      if (orgFilter === 'NONE' && u.organizationId) return false;
      if (orgFilter !== 'ALL' && orgFilter !== 'NONE' && u.organizationId !== orgFilter) {
        return false;
      }
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.organizationName || '').toLowerCase().includes(q) ||
        (u.assignedEventTitle || '').toLowerCase().includes(q) ||
        (u.createdByName || '').toLowerCase().includes(q)
      );
    });
  }, [allUsers, userSearch, roleFilter, orgFilter]);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await apiFetch('/api/organizations', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          type: form.type,
          contactEmail: form.contactEmail || null,
          maxEvents: Number(form.maxEvents),
          ...(form.adminEmail && form.adminPassword
            ? {
                adminUser: {
                  name: form.adminName || form.name,
                  email: form.adminEmail,
                  password: form.adminPassword,
                },
              }
            : {}),
        }),
      });
      setForm({
        name: '',
        slug: '',
        type: 'PLANNER',
        contactEmail: '',
        maxEvents: 10,
        adminName: '',
        adminEmail: '',
        adminPassword: '',
      });
      toast.success('Empresa / Planner creada');
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error creando empresa');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (org: OrganizationItem) => {
    try {
      await apiFetch(`/api/organizations/${org.id}`, {
        method: 'PUT',
        auth: true,
        body: JSON.stringify({ isActive: !org.isActive }),
      });
      toast.success(org.isActive ? 'Empresa suspendida' : 'Empresa activada');
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error actualizando empresa');
    }
  };

  const handleUpdateQuota = async (org: OrganizationItem, nextMax: number) => {
    try {
      await apiFetch(`/api/organizations/${org.id}`, {
        method: 'PUT',
        auth: true,
        body: JSON.stringify({ maxEvents: Math.max(1, nextMax) }),
      });
      toast.success('Cupo de bodas actualizado');
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error actualizando cupo');
    }
  };

  const handleAddOrgAdmin = async (orgId: string) => {
    const draft = newAdminByOrg[orgId];
    if (!draft?.email || !draft?.password || !draft?.name) {
      toast.error('Completa nombre, correo y contraseña del administrador');
      return;
    }
    try {
      await apiFetch(`/api/organizations/${orgId}/admins`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify(draft),
      });
      setNewAdminByOrg((prev) => ({ ...prev, [orgId]: { name: '', email: '', password: '' } }));
      toast.success('Administrador de empresa guardado');
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error guardando administrador');
    }
  };

  return (
    <div className="space-y-6">
      {/* Guía rápida del flujo Multi-Tenant */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-5 py-3.5 text-xs text-amber-950 flex flex-wrap items-center gap-x-6 gap-y-1.5">
        <span>
          <strong>1. Empresa / Paquete:</strong> Crea aquí el Wedding Planner o Cliente Directo y su
          cupo máximo de bodas.
        </span>
        <span>
          <strong>2. Boda Asignada:</strong> Crea cada boda desde el botón{' '}
          <strong>&ldquo;+ Nueva Boda&rdquo;</strong> en la cabecera superior.
        </span>
        <span>
          <strong>3. Usuarios:</strong> Crea o edita cuentas <code>ORG_ADMIN</code> (Planners) y{' '}
          <code>COUPLE</code> (Parejas) desde el botón <strong>&ldquo;+ Crear Usuario&rdquo;</strong>.
        </span>
      </div>

      {/* Crear Nueva Empresa / Wedding Planner */}
      <form
        onSubmit={handleCreateOrg}
        className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4"
      >
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-amber-700" />
          <h3 className="font-semibold text-sm text-stone-900">
            Nueva Empresa / Paquete (Wedding Planner o Cliente Directo)
          </h3>
        </div>

        <div className="grid sm:grid-cols-5 gap-3">
          <label className="sm:col-span-2 space-y-1">
            <span className="block text-[11px] font-medium text-stone-600">
              Nombre de la Empresa / Planner
            </span>
            <input
              type="text"
              placeholder="Ej. Bodas Élite"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
            />
          </label>
          <label className="space-y-1">
            <span className="block text-[11px] font-medium text-stone-600">Slug identificador</span>
            <input
              type="text"
              placeholder="ej. bodas-elite"
              value={form.slug}
              onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
              required
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
            />
          </label>
          <label className="space-y-1">
            <span className="block text-[11px] font-medium text-stone-600">Tipo de Paquete</span>
            <select
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as OrganizationType }))}
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs bg-white"
            >
              <option value="PLANNER">Wedding Planner / Empresa</option>
              <option value="DIRECT">Cliente Directo</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="block text-[11px] font-medium text-stone-600">
              Cupo máximo de bodas
            </span>
            <input
              type="number"
              min={1}
              max={10000}
              value={form.maxEvents}
              onChange={(e) => setForm((p) => ({ ...p, maxEvents: Number(e.target.value) }))}
              placeholder="10"
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
            />
          </label>
        </div>

        {/* Tramos rápidos de Suscripción Mensual por Bodas Activas (Todas las funciones Premium incluidas) */}
        <div className="rounded-xl bg-amber-50/60 border border-amber-200/70 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] text-amber-950">
            <strong>Planes Planners (100% Funciones Premium • Vigencia 6 meses/boda):</strong> Selecciona el tramo de bodas activas simultáneas:
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { label: '≤ 2 Bodas ($59/mes o $55 c/u)', max: 2 },
              { label: '≤ 5 Bodas ($99/mes o $45 c/u)', max: 5 },
              { label: '≤ 10 Bodas ($159/mes o $39 c/u)', max: 10 },
              { label: '≤ 20 Bodas ($229/mes o $35 c/u)', max: 20 },
              { label: 'Ilimitadas ($299/mes)', max: 9999 },
            ].map((tier) => (
              <button
                key={tier.max}
                type="button"
                onClick={() => setForm((p) => ({ ...p, type: 'PLANNER', maxEvents: tier.max }))}
                className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-all border ${
                  form.maxEvents === tier.max
                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                    : 'bg-white text-stone-700 border-stone-300 hover:border-amber-600'
                }`}
              >
                {tier.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-4 gap-3 pt-2 border-t border-stone-100 items-end">
          <label className="space-y-1">
            <span className="block text-[11px] font-medium text-stone-600">
              Nombre Admin Inicial (Opcional)
            </span>
            <input
              type="text"
              placeholder="Nombre del planner"
              value={form.adminName}
              onChange={(e) => setForm((p) => ({ ...p, adminName: e.target.value }))}
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
            />
          </label>
          <label className="space-y-1">
            <span className="block text-[11px] font-medium text-stone-600">
              Correo acceso (ORG_ADMIN)
            </span>
            <input
              type="email"
              placeholder="planner@empresa.com"
              value={form.adminEmail}
              onChange={(e) => setForm((p) => ({ ...p, adminEmail: e.target.value }))}
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
            />
          </label>
          <label className="space-y-1">
            <span className="block text-[11px] font-medium text-stone-600">
              Contraseña (mín. 6)
            </span>
            <input
              type="password"
              placeholder="••••••"
              value={form.adminPassword}
              onChange={(e) => setForm((p) => ({ ...p, adminPassword: e.target.value }))}
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
            />
          </label>
          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-stone-900 text-white px-4 py-2 text-xs font-semibold hover:bg-stone-800 disabled:opacity-60 h-[34px]"
          >
            <Plus className="h-3.5 w-3.5" />
            {creating ? 'Creando...' : 'Crear Empresa'}
          </button>
        </div>
      </form>

      {/* Listado de Empresas y Wedding Planners */}
      <div className="grid md:grid-cols-2 gap-5">
        {organizations.map((org) => {
          const draft = newAdminByOrg[org.id] || { name: '', email: '', password: '' };
          return (
            <div
              key={org.id}
              className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4 shadow-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm text-stone-900">{org.name}</h4>
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold">
                      {org.type}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        org.isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {org.isActive ? 'Activa' : 'Suspendida'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Slug: {org.slug} • Bodas creadas: <strong>{org.eventsCount}</strong> /{' '}
                    <strong>{org.maxEvents}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <label className="flex items-center gap-1 text-[11px] text-stone-500">
                    <span>Cupo:</span>
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      defaultValue={org.maxEvents}
                      onBlur={(e) => {
                        const val = Number(e.target.value);
                        if (val && val !== org.maxEvents) {
                          handleUpdateQuota(org, val);
                        }
                      }}
                      title="Cupo máximo de bodas"
                      className="w-16 rounded-lg border border-stone-300 px-2 py-1 text-xs text-center text-stone-900"
                    />
                  </label>
                  {org.slug !== 'plataforma-directa' && (
                    <>
                      <button
                        type="button"
                        title={org.isActive ? 'Suspender empresa' : 'Activar empresa'}
                        onClick={() => handleToggleActive(org)}
                        className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50"
                      >
                        <Power className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Eliminar empresa"
                        onClick={() => setDeletingOrg(org)}
                        className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Usuarios ORG_ADMIN */}
              <div className="space-y-2 border-t border-stone-100 pt-3">
                <p className="text-[11px] font-semibold text-stone-600">
                  Administradores / Planners ({org.admins.length})
                </p>
                {org.admins.map((adm) => (
                  <div
                    key={adm.id}
                    className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-1.5 text-xs"
                  >
                    <span>
                      <strong>{adm.name}</strong> ({adm.email})
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingUser({
                            id: adm.id,
                            name: adm.name,
                            email: adm.email,
                            role: 'ORG_ADMIN',
                            organizationId: org.id,
                            assignedEventId: null,
                          })
                        }
                        className="text-amber-700 hover:underline text-[11px] font-medium"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await apiFetch(`/api/organizations/${org.id}/admins/${adm.id}`, {
                            method: 'DELETE',
                            auth: true,
                          });
                          onRefresh();
                        }}
                        className="text-rose-600 hover:underline text-[11px]"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ))}

                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <input
                    type="text"
                    placeholder="Nombre"
                    value={draft.name}
                    onChange={(e) =>
                      setNewAdminByOrg((prev) => ({
                        ...prev,
                        [org.id]: { ...draft, name: e.target.value },
                      }))
                    }
                    className="rounded-lg border border-stone-300 px-2 py-1 text-[11px]"
                  />
                  <input
                    type="email"
                    placeholder="Correo"
                    value={draft.email}
                    onChange={(e) =>
                      setNewAdminByOrg((prev) => ({
                        ...prev,
                        [org.id]: { ...draft, email: e.target.value },
                      }))
                    }
                    className="rounded-lg border border-stone-300 px-2 py-1 text-[11px]"
                  />
                  <div className="flex gap-1">
                    <input
                      type="password"
                      placeholder="Clave"
                      value={draft.password}
                      onChange={(e) =>
                        setNewAdminByOrg((prev) => ({
                          ...prev,
                          [org.id]: { ...draft, password: e.target.value },
                        }))
                      }
                      className="w-full rounded-lg border border-stone-300 px-2 py-1 text-[11px]"
                    />
                    <button
                      type="button"
                      title="Agregar Admin"
                      onClick={() => handleAddOrgAdmin(org.id)}
                      className="rounded-lg bg-amber-700 text-white px-2 py-1 hover:bg-amber-800 shrink-0"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Directorio Global de Todos los Usuarios (Solo SUPERADMIN) */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-amber-700" />
            <h3 className="font-semibold text-sm text-stone-900">
              Directorio Global de Usuarios ({filteredUsers.length} de {allUsers.length})
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCreatingUser(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 text-white px-3 py-1.5 text-xs font-semibold hover:bg-stone-800"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Crear Usuario
            </button>
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Buscar nombre, correo, empresa..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-stone-300 text-xs w-56"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-xl border border-stone-300 px-3 py-1.5 text-xs bg-white"
            >
              <option value="ALL">Todos los roles</option>
              <option value="SUPERADMIN">SUPERADMIN</option>
              <option value="ORG_ADMIN">ORG_ADMIN (Planners)</option>
              <option value="COUPLE">COUPLE (Parejas)</option>
            </select>
            <select
              value={orgFilter}
              onChange={(e) => setOrgFilter(e.target.value)}
              className="rounded-xl border border-stone-300 px-3 py-1.5 text-xs bg-white"
            >
              <option value="ALL">Todas las empresas / paquetes</option>
              <option value="NONE">Sin empresa asignada</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.type})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600">
              <tr>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Empresa / Paquete</th>
                <th className="px-4 py-3">Creado por</th>
                <th className="px-4 py-3">Boda Asignada</th>
                <th className="px-4 py-3 text-center">Cambiar Clave</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-stone-50/70">
                  <td className="px-4 py-3">
                    <div className="font-medium text-stone-900">{u.name}</div>
                    <div className="text-[11px] text-stone-500">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 font-semibold text-[11px] ${
                        u.role === 'SUPERADMIN'
                          ? 'bg-stone-900 text-white'
                          : u.role === 'ORG_ADMIN'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.organizationName ? (
                      <div>
                        <span className="font-medium text-stone-800">{u.organizationName}</span>
                        {u.organizationType && (
                          <span className="ml-1.5 rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-600">
                            {u.organizationType === 'PLANNER' ? 'Paquete Planner' : 'Cliente Directo'}
                            {u.organizationMaxEvents ? ` · ${u.organizationMaxEvents} bodas` : ''}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[11px] text-rose-700 font-medium">
                        Sin empresa asignada
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {u.createdByName ? (
                      <div>
                        <span className="font-medium text-stone-800">{u.createdByName}</span>
                        {u.createdByRole && (
                          <span className="ml-1 text-[10px] text-stone-400">
                            ({u.createdByRole})
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-stone-400">Sistema / Seed</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {u.assignedEventTitle || u.assignedEventSlug ? (
                      <div>
                        <div className="font-medium text-stone-800">
                          {u.assignedEventTitle || u.assignedEventSlug}
                        </div>
                        {u.assignedEventSlug && (
                          <div className="text-[11px] text-stone-400">{u.assignedEventSlug}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-stone-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <label className="inline-flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(u.mustChangePassword)}
                        onChange={async (e) => {
                          const nextVal = e.target.checked;
                          try {
                            await apiFetch(`/api/users/${u.id}`, {
                              method: 'PUT',
                              auth: true,
                              body: JSON.stringify({ mustChangePassword: nextVal }),
                            });
                            toast.success(
                              nextVal
                                ? 'Se exigirá cambio de clave al iniciar sesión'
                                : 'Se desmarcó la exigencia de cambio de clave'
                            );
                            onRefresh();
                          } catch (err) {
                            toast.error(
                              err instanceof Error ? err.message : 'Error actualizando estado'
                            );
                          }
                        }}
                        className="rounded border-stone-300 text-amber-700 focus:ring-amber-600"
                        title={
                          u.mustChangePassword
                            ? 'Pendiente de cambio de clave'
                            : 'Marcar para exigir cambio de clave en el próximo login'
                        }
                      />
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          u.mustChangePassword
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-stone-100 text-stone-500'
                        }`}
                      >
                        {u.mustChangePassword ? 'Pendiente' : 'Al día'}
                      </span>
                    </label>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        title="Editar usuario y contraseña"
                        onClick={() =>
                          setEditingUser({
                            id: u.id,
                            name: u.name,
                            email: u.email,
                            role: u.role,
                            mustChangePassword: Boolean(u.mustChangePassword),
                            organizationId: u.organizationId,
                            assignedEventId: u.assignedEventId,
                          })
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1 text-[11px] font-medium text-stone-700 hover:bg-stone-100"
                      >
                        <Pencil className="h-3 w-3" />
                        Editar
                      </button>
                      {u.id !== currentUserId && (
                        <button
                          type="button"
                          title="Eliminar usuario"
                          onClick={() => setDeletingUser(u)}
                          className="inline-flex items-center justify-center rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-stone-400">
                    No se encontraron usuarios con esos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {creatingUser && (
        <UserEditModal
          mode="create"
          actorRole="SUPERADMIN"
          organizations={organizations}
          events={events}
          onClose={() => setCreatingUser(false)}
          onSaved={() => onRefresh()}
        />
      )}

      {editingUser && (
        <UserEditModal
          mode="admin"
          user={editingUser}
          actorRole="SUPERADMIN"
          organizations={organizations}
          events={events}
          onClose={() => setEditingUser(null)}
          onSaved={() => onRefresh()}
        />
      )}

      {deletingOrg && (
        <ConfirmModal
          title="Eliminar empresa / paquete"
          message={`¿Estás seguro de eliminar "${deletingOrg.name}"? Se eliminarán sus bodas asociadas y sus usuarios quedarán sin empresa asignada.`}
          confirmLabel="Eliminar empresa"
          loading={deletingLoading}
          onCancel={() => setDeletingOrg(null)}
          onConfirm={async () => {
            setDeletingLoading(true);
            try {
              await apiFetch(`/api/organizations/${deletingOrg.id}`, {
                method: 'DELETE',
                auth: true,
              });
              toast.success('Empresa eliminada');
              setDeletingOrg(null);
              onRefresh();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : 'Error eliminando empresa');
            } finally {
              setDeletingLoading(false);
            }
          }}
        />
      )}

      {deletingUser && (
        <ConfirmModal
          title="Eliminar usuario"
          message={`¿Estás seguro de eliminar al usuario "${deletingUser.name}" (${deletingUser.email})? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar usuario"
          loading={deletingLoading}
          onCancel={() => setDeletingUser(null)}
          onConfirm={async () => {
            setDeletingLoading(true);
            try {
              await apiFetch(`/api/users/${deletingUser.id}`, {
                method: 'DELETE',
                auth: true,
              });
              toast.success('Usuario eliminado');
              setDeletingUser(null);
              onRefresh();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : 'Error eliminando usuario');
            } finally {
              setDeletingLoading(false);
            }
          }}
        />
      )}
    </div>
  );
}
