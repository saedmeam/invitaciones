'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Building2, Plus, Power, Trash2, UserPlus, Users } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { OrganizationItem, OrganizationType } from '@/types/invitation';

export interface GlobalUserItem {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string | null;
  organizationName: string | null;
  assignedEventId: string | null;
  assignedEventSlug: string | null;
  createdById: string | null;
}

interface AdminOrganizationsTabProps {
  organizations: OrganizationItem[];
  allUsers: GlobalUserItem[];
  onRefresh: () => void;
}

export function AdminOrganizationsTab({
  organizations,
  allUsers,
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
      {/* Crear Nueva Empresa / Wedding Planner */}
      <form
        onSubmit={handleCreateOrg}
        className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4"
      >
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-amber-700" />
          <h3 className="font-semibold text-sm text-stone-900">
            Nueva Empresa / Wedding Planner (Multi-Tenant)
          </h3>
        </div>

        <div className="grid sm:grid-cols-5 gap-3">
          <input
            type="text"
            placeholder="Nombre Empresa / Planner"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            required
            className="sm:col-span-2 rounded-xl border border-stone-300 px-3 py-2 text-xs"
          />
          <input
            type="text"
            placeholder="Slug (ej. bodas-elite)"
            value={form.slug}
            onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
            required
            className="rounded-xl border border-stone-300 px-3 py-2 text-xs"
          />
          <select
            value={form.type}
            onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as OrganizationType }))}
            className="rounded-xl border border-stone-300 px-3 py-2 text-xs bg-white"
          >
            <option value="PLANNER">Wedding Planner / Empresa</option>
            <option value="DIRECT">Cliente Directo</option>
          </select>
          <input
            type="number"
            min={1}
            max={10000}
            value={form.maxEvents}
            onChange={(e) => setForm((p) => ({ ...p, maxEvents: Number(e.target.value) }))}
            placeholder="Cupo bodas"
            className="rounded-xl border border-stone-300 px-3 py-2 text-xs"
          />
        </div>

        <div className="grid sm:grid-cols-4 gap-3 pt-2 border-t border-stone-100">
          <input
            type="text"
            placeholder="Nombre Admin Empresa (Opcional)"
            value={form.adminName}
            onChange={(e) => setForm((p) => ({ ...p, adminName: e.target.value }))}
            className="rounded-xl border border-stone-300 px-3 py-2 text-xs"
          />
          <input
            type="email"
            placeholder="Correo acceso (ORG_ADMIN)"
            value={form.adminEmail}
            onChange={(e) => setForm((p) => ({ ...p, adminEmail: e.target.value }))}
            className="rounded-xl border border-stone-300 px-3 py-2 text-xs"
          />
          <input
            type="password"
            placeholder="Contraseña (mín. 6)"
            value={form.adminPassword}
            onChange={(e) => setForm((p) => ({ ...p, adminPassword: e.target.value }))}
            className="rounded-xl border border-stone-300 px-3 py-2 text-xs"
          />
          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-stone-900 text-white px-4 py-2 text-xs font-semibold hover:bg-stone-800 disabled:opacity-60"
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
                    className="w-16 rounded-lg border border-stone-300 px-2 py-1 text-xs text-center"
                  />
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
                        onClick={async () => {
                          await apiFetch(`/api/organizations/${org.id}`, {
                            method: 'DELETE',
                            auth: true,
                          });
                          toast.success('Empresa eliminada');
                          onRefresh();
                        }}
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
        <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-2">
          <Users className="h-4 w-4 text-amber-700" />
          <h3 className="font-semibold text-sm text-stone-900">
            Directorio Global de Usuarios ({allUsers.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Empresa / Agencia</th>
                <th className="px-4 py-3">Boda Asignada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {allUsers.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium text-stone-900">{u.name}</td>
                  <td className="px-4 py-3 text-stone-600">{u.email}</td>
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
                  <td className="px-4 py-3 text-stone-600">{u.organizationName || '—'}</td>
                  <td className="px-4 py-3 text-stone-600">{u.assignedEventSlug || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
