'use client';

import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  BarChart3,
  Building2,
  Camera,
  Check,
  Copy,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  KeyRound,
  LayoutGrid,
  LogOut,
  Menu,
  MessageCircle,
  Palette,
  Pencil,
  Plus,
  QrCode,
  Send,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { API_BASE_URL, apiFetch, getStoredToken, setStoredToken } from '@/lib/api';
import { exportEventSummaryPdf, exportWishesPdf } from '@/lib/pdfExport';
import { AdminCustomizerTab } from '@/components/admin/AdminCustomizerTab';
import { AdminDispatchTab } from '@/components/admin/AdminDispatchTab';
import { DriveConfigModal } from '@/components/admin/DriveConfigModal';
import {
  AdminOrganizationsTab,
  GlobalUserItem,
} from '@/components/admin/AdminOrganizationsTab';
import { AdminSeatingTab } from '@/components/admin/AdminSeatingTab';
import { ForcePasswordChangeModal } from '@/components/admin/ForcePasswordChangeModal';
import { GuestEditModal } from '@/components/admin/GuestEditModal';
import { EditableUser, UserEditModal } from '@/components/admin/UserEditModal';
import {
  AdminUserInfo,
  GuestGroup,
  MediaAsset,
  OrganizationItem,
  RsvpStats,
  WeddingEvent,
  WishMessage,
} from '@/types/invitation';

type AdminTab =
  | 'STATS'
  | 'GUESTS'
  | 'TABLES'
  | 'DISPATCH'
  | 'CUSTOMIZE'
  | 'MEDIA'
  | 'ORGANIZATIONS';

export default function AdminDashboardPage() {
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AdminUserInfo | null>(null);
  const [email, setEmail] = useState('admin@invitaciones.local');
  const [password, setPassword] = useState('admin123');
  const [loggingIn, setLoggingIn] = useState(false);

  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [allUsers, setAllUsers] = useState<GlobalUserItem[]>([]);
  const [orgFilterId, setOrgFilterId] = useState<string>('');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<AdminTab>('STATS');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [guests, setGuests] = useState<GuestGroup[]>([]);
  const [stats, setStats] = useState<RsvpStats | null>(null);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [wishes, setWishes] = useState<WishMessage[]>([]);
  const [qrInfo, setQrInfo] = useState<{
    uploadUrl: string;
    qrDataUrl: string;
    driveConfigured: boolean;
    googleOAuthAppConfigured?: boolean;
    googleAccountEmail?: string | null;
    googlePerEventConnected?: boolean;
  } | null>(null);

  const [showDriveModal, setShowDriveModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingGuest, setEditingGuest] = useState<GuestGroup | null>(null);

  // Nuevo grupo invitado
  const [newGuest, setNewGuest] = useState({
    groupName: '',
    category: 'Amigos',
    email: '',
    phone: '',
    maxGuests: 2,
    companionName: '',
  });

  // Nuevo evento (Multi-evento SaaS - Solo SUPERADMIN)
  const [showNewEventForm, setShowNewEventForm] = useState(false);
  const [newEventForm, setNewEventForm] = useState({
    slug: '',
    title: 'Nuestra Boda',
    partnerOneName: '',
    partnerTwoName: '',
    eventDate: '2027-09-15T16:00',
    organizationId: '',
  });

  // Gestión de usuario de la pareja (SUPERADMIN u ORG_ADMIN)
  const [showCouplePanel, setShowCouplePanel] = useState(false);
  const [coupleUsers, setCoupleUsers] = useState<
    Array<{ id: string; email: string; name: string }>
  >([]);
  const [coupleForm, setCoupleForm] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingCoupleUser, setEditingCoupleUser] = useState<EditableUser | null>(null);

  const visibleEvents = orgFilterId
    ? events.filter((e) => e.organizationId === orgFilterId)
    : events;
  const selectedEvent =
    visibleEvents.find((e) => e.id === selectedEventId) || visibleEvents[0] || null;
  const isSuperAdmin = currentUser?.role === 'SUPERADMIN';
  const isOrgAdmin = currentUser?.role === 'ORG_ADMIN';
  const canManageEvents = isSuperAdmin || isOrgAdmin;

  const loadSessionAndEvents = useCallback(async () => {
    try {
      const [meRes, evRes] = await Promise.all([
        apiFetch<{ user: AdminUserInfo }>('/api/auth/me', { auth: true }),
        apiFetch<{ events: WeddingEvent[] }>('/api/events', { auth: true }),
      ]);
      setCurrentUser(meRes.user);
      setEvents(evRes.events);
      if (evRes.events.length > 0) {
        const storedId = typeof window !== 'undefined' ? localStorage.getItem('invitaciones_selected_event_id') : null;
        const primaryEvent = evRes.events.find((e) => e.isPrimary);
        setSelectedEventId((prev) => {
          if (prev && evRes.events.some((e) => e.id === prev)) return prev;
          if (storedId && evRes.events.some((e) => e.id === storedId)) return storedId;
          if (primaryEvent) return primaryEvent.id;
          return evRes.events[0].id;
        });
      }
      if (meRes.user.role === 'SUPERADMIN') {
        const [orgRes, usersRes] = await Promise.all([
          apiFetch<{ organizations: OrganizationItem[] }>('/api/organizations', { auth: true }),
          apiFetch<{ users: GlobalUserItem[] }>('/api/users', { auth: true }),
        ]);
        setOrganizations(orgRes.organizations);
        setAllUsers(usersRes.users);
      }
    } catch {
      setStoredToken(null);
      setToken(null);
      setCurrentUser(null);
    }
  }, []);

  const loadEventDetails = useCallback(
    async (eventId: string, role?: string) => {
      if (!eventId) return;
      try {
        const [gRes, sRes, mRes, wRes, qRes] = await Promise.all([
          apiFetch<{ guests: GuestGroup[] }>(`/api/events/${eventId}/guests`, { auth: true }),
          apiFetch<{ stats: RsvpStats }>(`/api/events/${eventId}/stats`, { auth: true }),
          apiFetch<{ media: MediaAsset[] }>(`/api/events/${eventId}/media`, { auth: true }),
          apiFetch<{ wishes: WishMessage[] }>(`/api/events/${eventId}/wishes`, { auth: true }),
          apiFetch<{ uploadUrl: string; qrDataUrl: string; driveConfigured: boolean }>(
            `/api/events/${eventId}/media/qr`,
            { auth: true }
          ),
        ]);
        setGuests(gRes.guests);
        setStats(sRes.stats);
        setMedia(mRes.media);
        setWishes(wRes.wishes);
        setQrInfo(qRes);

        if (role === 'SUPERADMIN' || role === 'ORG_ADMIN') {
          const cuRes = await apiFetch<{ users: Array<{ id: string; email: string; name: string }> }>(
            `/api/events/${eventId}/couple-users`,
            { auth: true }
          );
          setCoupleUsers(cuRes.users);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error cargando detalles del evento');
      }
    },
    []
  );

  useEffect(() => {
    const existing = getStoredToken();
    if (existing) {
      setToken(existing);
      loadSessionAndEvents();
    }
  }, [loadSessionAndEvents]);

  useEffect(() => {
    if (token && selectedEventId && currentUser) {
      loadEventDetails(selectedEventId, currentUser.role);
    }
  }, [token, selectedEventId, currentUser, loadEventDetails]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    try {
      const res = await apiFetch<{ token: string; user: AdminUserInfo }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setStoredToken(res.token);
      setToken(res.token);
      setCurrentUser(res.user);
      await loadSessionAndEvents();
      toast.success(`Bienvenido, ${res.user.name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Credenciales inválidas');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setStoredToken(null);
    setToken(null);
    setCurrentUser(null);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch<{ event: WeddingEvent }>('/api/events', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
          ...newEventForm,
          organizationId: newEventForm.organizationId || undefined,
          eventDate: new Date(newEventForm.eventDate).toISOString(),
        }),
      });
      setEvents((prev) => [res.event, ...prev]);
      setSelectedEventId(res.event.id);
      setShowNewEventForm(false);
      toast.success('Nuevo evento creado');
      await loadSessionAndEvents();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error creando evento');
    }
  };

  const handleSaveCoupleUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    try {
      await apiFetch(`/api/events/${selectedEvent.id}/couple-users`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify(coupleForm),
      });
      setCoupleForm({ name: '', email: '', password: '' });
      toast.success('Usuario de la pareja guardado');
      await loadEventDetails(selectedEvent.id, currentUser?.role);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error guardando usuario de pareja');
    }
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    try {
      const memberNames =
        newGuest.maxGuests >= 2 && newGuest.companionName.trim()
          ? [newGuest.groupName, newGuest.companionName]
          : undefined;
      await apiFetch(`/api/events/${selectedEvent.id}/guests`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
          groupName: newGuest.groupName,
          category: newGuest.category,
          email: newGuest.email || null,
          phone: newGuest.phone || null,
          maxGuests: Number(newGuest.maxGuests),
          memberNames,
        }),
      });
      setNewGuest({
        groupName: '',
        category: 'Amigos',
        email: '',
        phone: '',
        maxGuests: 2,
        companionName: '',
      });
      toast.success('Invitado agregado');
      await loadEventDetails(selectedEvent.id, currentUser?.role);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error agregando invitado');
    }
  };

  const handleDeleteGuest = async (groupId: string) => {
    if (!selectedEvent) return;
    try {
      await apiFetch(`/api/events/${selectedEvent.id}/guests/${groupId}`, {
        method: 'DELETE',
        auth: true,
      });
      toast.success('Invitado eliminado');
      await loadEventDetails(selectedEvent.id, currentUser?.role);
    } catch {
      toast.error('Error al eliminar invitado');
    }
  };

  const handleImportExcel = async (file: File) => {
    if (!selectedEvent) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await apiFetch<{ imported: number; totalRows: number }>(
        `/api/events/${selectedEvent.id}/guests/import`,
        { method: 'POST', auth: true, body: fd }
      );
      toast.success(`Importados ${res.imported} de ${res.totalRows} invitados`);
      await loadEventDetails(selectedEvent.id, currentUser?.role);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error importando Excel');
    }
  };

  const handleExport = async (format: 'EXCEL' | 'PDF') => {
    if (!selectedEvent) return;
    try {
      const blob = await apiFetch<Blob>(
        `/api/events/${selectedEvent.id}/guests/export?format=${format}`,
        { auth: true }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invitados-${selectedEvent.slug}.${format === 'EXCEL' ? 'xlsx' : 'pdf'}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Error exportando reporte');
    }
  };

  const handleGoogleDriveConnect = async () => {
    if (!selectedEvent) return;
    try {
      const res = await apiFetch<{ url: string | null; hasOAuthApp: boolean }>(
        `/api/events/${selectedEvent.id}/google/auth-url`,
        { auth: true }
      );
      if (!res.url) {
        toast.error('Configura GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en backend/.env');
        return;
      }
      window.open(res.url, 'google_oauth', 'width=540,height=680');
      const onMessage = (ev: MessageEvent) => {
        if (ev.data?.type === 'GOOGLE_OAUTH_DONE') {
          window.removeEventListener('message', onMessage);
          toast.success(
            ev.data.email
              ? `Cuenta Google vinculada a esta boda: ${ev.data.email}`
              : 'Cuenta Google vinculada a esta boda'
          );
          loadEventDetails(selectedEvent.id, currentUser?.role);
        }
      };
      window.addEventListener('message', onMessage);
    } catch {
      toast.error('No se pudo obtener la URL de Google OAuth');
    }
  };

  const handleGoogleDriveDisconnect = async () => {
    if (!selectedEvent) return;
    try {
      await apiFetch(`/api/events/${selectedEvent.id}/google/disconnect`, {
        method: 'POST',
        auth: true,
      });
      toast.success('Cuenta Google desvinculada de esta boda');
      loadEventDetails(selectedEvent.id, currentUser?.role);
    } catch {
      toast.error('No se pudo desvincular la cuenta Google');
    }
  };

  if (!token) {
    return (
      <main className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm rounded-3xl bg-white border border-stone-200 p-8 shadow-sm space-y-4"
        >
          <h1 className="font-serif text-3xl font-semibold text-stone-900">Panel de Gestión</h1>
          <p className="text-xs text-stone-500">
            Inicia sesión como administrador o con tu cuenta propia de pareja.
          </p>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loggingIn}
            className="w-full rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white hover:bg-stone-800"
          >
            {loggingIn ? 'Ingresando...' : 'Ingresar'}
          </button>
          <div className="pt-2 border-t border-stone-100 text-[11px] text-stone-500 space-y-1">
            <p>Demo SuperAdmin: admin@invitaciones.local / admin123</p>
            <p>Demo Wedding Planner: planner@invitaciones.local / planner123</p>
            <p>Demo Pareja: pareja@invitaciones.local / pareja123</p>
          </div>
        </form>
      </main>
    );
  }

  const filteredGuests = guests.filter((g) => {
    const matchesStatus = statusFilter === 'ALL' || g.rsvpStatus === statusFilter;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      g.groupName.toLowerCase().includes(q) ||
      (g.phone || '').includes(q) ||
      (g.email || '').toLowerCase().includes(q) ||
      g.members.some((m) => m.fullName.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  const navTabs = [
    ...(isSuperAdmin
      ? [
          {
            id: 'ORGANIZATIONS' as AdminTab,
            label: 'Empresas & Accesos',
            icon: Building2,
          },
        ]
      : []),
    { id: 'STATS' as AdminTab, label: 'Estadísticas & Resumen', icon: BarChart3 },
    { id: 'GUESTS' as AdminTab, label: 'Invitados & RSVP', icon: Users },
    { id: 'TABLES' as AdminTab, label: 'Mesas & Salón', icon: LayoutGrid },
    { id: 'DISPATCH' as AdminTab, label: 'WhatsApp & Gmail', icon: Send },
    { id: 'CUSTOMIZE' as AdminTab, label: 'Diseño & Secciones', icon: Palette },
    { id: 'MEDIA' as AdminTab, label: 'Álbum Digital & Deseos', icon: Camera },
  ];

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full justify-between gap-4">
      <div className="space-y-4">
        {/* Identidad / Branding */}
        <div className="flex items-center gap-2.5 pb-3 border-b border-stone-200/80">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-900 text-[#b08d57] shadow-xs font-serif font-bold text-base">
            {isSuperAdmin ? 'SA' : isOrgAdmin ? 'WP' : '♡'}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-serif text-base font-semibold tracking-tight text-stone-900 truncate">
              {isSuperAdmin
                ? 'Gestor Multi-Empresa'
                : isOrgAdmin
                  ? currentUser?.organizationName || 'Agencia Wedding Planner'
                  : 'Mi Boda'}
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded-md font-semibold border ${
                  isSuperAdmin
                    ? 'bg-purple-50 text-purple-800 border-purple-200'
                    : isOrgAdmin
                      ? 'bg-amber-50 text-amber-900 border-amber-200'
                      : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                }`}
              >
                {isSuperAdmin ? 'SuperAdmin' : isOrgAdmin ? 'Wedding Planner' : 'Pareja'}
              </span>
              {isOrgAdmin && currentUser?.organizationQuota && (
                <span className="text-[10px] text-stone-500 font-mono">
                  {currentUser.organizationQuota.eventsCount}/{currentUser.organizationQuota.maxEvents}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Selector de Evento Activo y Empresa */}
        {canManageEvents && (
          <div className="space-y-2 rounded-2xl bg-stone-50 border border-stone-200/90 p-2.5">
            {isSuperAdmin && organizations.length > 0 && (
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 block">
                  Empresa / Filtro:
                </label>
                <select
                  value={orgFilterId}
                  onChange={(e) => setOrgFilterId(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-stone-900"
                >
                  <option value="">Todas las empresas ({events.length})</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.eventsCount})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                  Boda Activa:
                </label>
                {selectedEvent && (
                  <a
                    href={`/e/${selectedEvent.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-amber-800 hover:text-amber-950 font-medium"
                    title="Ver invitación pública en vivo"
                  >
                    <span>Ver</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <select
                value={selectedEvent?.id || ''}
                onChange={(e) => {
                  const newId = e.target.value;
                  setSelectedEventId(newId);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('invitaciones_selected_event_id', newId);
                  }
                }}
                className="w-full rounded-xl border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-900 focus:ring-1 focus:ring-stone-900 truncate"
              >
                {visibleEvents.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.partnerOneName} &amp; {ev.partnerTwoName}
                    {isSuperAdmin && ev.organizationName ? ` — [${ev.organizationName}]` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Acciones Rápidas */}
            <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-stone-200/60">
              <button
                type="button"
                onClick={() => {
                  setShowNewEventForm((v) => !v);
                  setMobileSidebarOpen(false);
                }}
                className="inline-flex items-center justify-center gap-1 rounded-xl bg-stone-900 hover:bg-stone-800 text-white py-1.5 text-[11px] font-medium shadow-xs transition"
              >
                <Plus className="h-3 w-3 text-[#b08d57]" />
                <span>Nueva Boda</span>
              </button>
              {selectedEvent && (
                <button
                  type="button"
                  onClick={() => {
                    setShowCouplePanel((v) => !v);
                    setMobileSidebarOpen(false);
                  }}
                  className="inline-flex items-center justify-center gap-1 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 py-1.5 text-[11px] font-medium transition"
                  title="Gestionar accesos exclusivos de la pareja"
                >
                  <KeyRound className="h-3 w-3 text-amber-700" />
                  <span>Pareja ({coupleUsers.length})</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Menú de Navegación Vertical (Sin scroll horizontal) */}
        <div className="space-y-1">
          <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-2">
            Módulos del Sistema
          </p>
          <nav className="space-y-1">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                    active
                      ? 'bg-stone-900 text-white font-semibold shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-[#b08d57]' : 'text-stone-400'}`} />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Pie del Menú Lateral: Usuario & Salir */}
      <div className="pt-3 border-t border-stone-200/80 space-y-2">
        {currentUser && (
          <button
            type="button"
            onClick={() => setShowProfileModal(true)}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200/80 text-left transition"
            title="Editar mis datos y credenciales"
          >
            <div className="min-w-0 flex-1 pr-2">
              <p className="text-xs font-semibold text-stone-900 truncate">{currentUser.name}</p>
              <p className="text-[10px] text-stone-500 truncate">{currentUser.email}</p>
            </div>
            <Pencil className="h-3.5 w-3.5 text-amber-700 shrink-0" />
          </button>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 py-2 text-xs font-medium text-stone-700 hover:text-stone-900 transition"
        >
          <LogOut className="h-3.5 w-3.5 text-stone-500" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col md:flex-row text-stone-900">
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex flex-col w-72 shrink-0 bg-white border-r border-stone-200/90 h-screen sticky top-0 overflow-y-auto no-scrollbar z-30 p-4 justify-between shadow-xs">
        {renderSidebarContent()}
      </aside>

      {/* SIDEBAR MOBILE DRAWER */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="relative flex flex-col w-72 max-w-[85vw] bg-white h-full p-4 justify-between shadow-2xl z-10 overflow-y-auto no-scrollbar">
            <div className="flex justify-end pb-2">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* ÁREA PRINCIPAL DE CONTENIDO */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Barra Superior Móvil y Contexto Desktop */}
        <header className="bg-white border-b border-stone-200/80 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition"
              title="Abrir menú lateral"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  {selectedEvent
                    ? `${selectedEvent.partnerOneName} & ${selectedEvent.partnerTwoName}`
                    : 'Invitaciones'}
                </span>
                <span className="text-stone-300">/</span>
                <span className="text-xs font-semibold text-stone-800">
                  {navTabs.find((t) => t.id === activeTab)?.label}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedEvent && (
              <a
                href={`/e/${selectedEvent.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-700 transition"
              >
                <ExternalLink className="h-3.5 w-3.5 text-[#b08d57]" />
                <span className="hidden sm:inline">Ver Invitación</span>
              </a>
            )}
          </div>
        </header>

        {/* Paneles Flotantes Contextuales */}
        {canManageEvents && showNewEventForm && (
          <div className="p-4 sm:p-6 bg-white border-b border-stone-200/90 shadow-sm animate-in fade-in duration-200">
            <div className="max-w-5xl mx-auto space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg font-semibold text-stone-900">Crear Nueva Boda</h3>
                <button
                  type="button"
                  onClick={() => setShowNewEventForm(false)}
                  className="text-stone-400 hover:text-stone-700 text-xs"
                >
                  Cerrar [✕]
                </button>
              </div>
              <form onSubmit={handleCreateEvent} className="grid sm:grid-cols-6 gap-3">
                {isSuperAdmin && (
                  <select
                    value={newEventForm.organizationId}
                    onChange={(e) =>
                      setNewEventForm((p) => ({ ...p, organizationId: e.target.value }))
                    }
                    className="rounded-xl border border-stone-300 px-3 py-2 text-xs bg-white"
                  >
                    <option value="">Empresa / Cliente Directo (Default)</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name} ({org.eventsCount}/{org.maxEvents})
                      </option>
                    ))}
                  </select>
                )}
                <input
                  type="text"
                  placeholder="Slug (ej. maria-y-juan-2027)"
                  value={newEventForm.slug}
                  onChange={(e) => setNewEventForm((p) => ({ ...p, slug: e.target.value }))}
                  required
                  className="rounded-xl border border-stone-300 px-3 py-2 text-xs"
                />
                <input
                  type="text"
                  placeholder="Pareja 1"
                  value={newEventForm.partnerOneName}
                  onChange={(e) => setNewEventForm((p) => ({ ...p, partnerOneName: e.target.value }))}
                  required
                  className="rounded-xl border border-stone-300 px-3 py-2 text-xs"
                />
                <input
                  type="text"
                  placeholder="Pareja 2"
                  value={newEventForm.partnerTwoName}
                  onChange={(e) => setNewEventForm((p) => ({ ...p, partnerTwoName: e.target.value }))}
                  required
                  className="rounded-xl border border-stone-300 px-3 py-2 text-xs"
                />
                <input
                  type="datetime-local"
                  value={newEventForm.eventDate}
                  onChange={(e) => setNewEventForm((p) => ({ ...p, eventDate: e.target.value }))}
                  required
                  className="rounded-xl border border-stone-300 px-3 py-2 text-xs"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-stone-900 text-white text-xs font-semibold px-4 py-2 hover:bg-stone-800 transition"
                >
                  Crear Evento
                </button>
              </form>
            </div>
          </div>
        )}

        {canManageEvents && showCouplePanel && selectedEvent && (
          <div className="p-4 sm:p-6 bg-amber-50/60 border-b border-amber-200/80 shadow-xs animate-in fade-in duration-200">
            <div className="max-w-5xl mx-auto space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-base font-semibold text-stone-900">
                    Accesos Exclusivos de Pareja — {selectedEvent.partnerOneName} &amp; {selectedEvent.partnerTwoName}
                  </h3>
                  <p className="text-xs text-stone-600">
                    Cuentas exclusivas con rol Pareja (COUPLE) para ver RSVP, mesas y fotos de su boda.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCouplePanel(false)}
                  className="text-stone-400 hover:text-stone-700 text-xs"
                >
                  Cerrar [✕]
                </button>
              </div>

              <form onSubmit={handleSaveCoupleUser} className="grid sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Nombre de la pareja"
                  value={coupleForm.name}
                  onChange={(e) => setCoupleForm((p) => ({ ...p, name: e.target.value }))}
                  required
                  className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs"
                />
                <input
                  type="email"
                  placeholder="Correo de acceso"
                  value={coupleForm.email}
                  onChange={(e) => setCoupleForm((p) => ({ ...p, email: e.target.value }))}
                  required
                  className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs"
                />
                <input
                  type="password"
                  placeholder="Contraseña (mín. 6 caracteres)"
                  value={coupleForm.password}
                  onChange={(e) => setCoupleForm((p) => ({ ...p, password: e.target.value }))}
                  required
                  minLength={6}
                  className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-amber-700 text-white text-xs font-semibold px-4 py-2 hover:bg-amber-800 transition"
                >
                  Guardar Acceso Pareja
                </button>
              </form>

              {coupleUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {coupleUsers.map((cu) => (
                    <div
                      key={cu.id}
                      className="inline-flex items-center gap-2 rounded-xl bg-white border border-stone-200 px-3 py-1.5 text-xs shadow-xs"
                    >
                      <span className="font-semibold text-stone-800">{cu.name}</span>
                      <span className="text-stone-500">({cu.email})</span>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingCoupleUser({
                            id: cu.id,
                            name: cu.name,
                            email: cu.email,
                            role: 'COUPLE',
                            organizationId: selectedEvent.organizationId ?? null,
                            assignedEventId: selectedEvent.id,
                          })
                        }
                        className="text-amber-700 hover:underline font-medium"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await apiFetch(
                            `/api/events/${selectedEvent.id}/couple-users/${cu.id}`,
                            { method: 'DELETE', auth: true }
                          );
                          loadEventDetails(selectedEvent.id, currentUser?.role);
                        }}
                        className="text-rose-600 hover:underline"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {activeTab === 'ORGANIZATIONS' && isSuperAdmin ? (
          <AdminOrganizationsTab
            organizations={organizations}
            events={events}
            allUsers={allUsers}
            currentUserId={currentUser?.id || ''}
            onRefresh={loadSessionAndEvents}
          />
        ) : !selectedEvent ? (
          <p className="text-sm text-stone-500">
            No hay eventos creados todavía. Usa el botón &ldquo;+ Nuevo Evento&rdquo; para crear el primero.
          </p>
        ) : (
          <>
            {/* TAB 1: ESTADÍSTICAS */}
            {activeTab === 'STATS' && stats && (
              <div className="space-y-6">
                {selectedEvent && (
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-stone-200 p-4">
                    <div>
                      <h3 className="font-semibold text-sm text-stone-900">Resumen del Evento en PDF</h3>
                      <p className="text-xs text-stone-500">
                        Itinerario, confirmaciones, lista de invitados y buenos deseos en un documento listo para imprimir o compartir.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            exportEventSummaryPdf(selectedEvent, stats, guests, wishes);
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : 'No se pudo generar el PDF');
                          }
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-stone-800"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Descargar Resumen (PDF)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            exportWishesPdf(selectedEvent, wishes);
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : 'No se pudo generar el PDF');
                          }
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 px-3.5 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-50"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Libro de Deseos (PDF)
                      </button>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  {[
                    { label: 'Cupos Totales', value: stats.totalAllocatedSlots, color: 'text-stone-900' },
                    { label: 'Confirmados (Sí)', value: stats.confirmedGuests, color: 'text-emerald-600' },
                    { label: 'Rechazados (No)', value: stats.declinedGuests, color: 'text-rose-600' },
                    { label: 'Pendientes', value: stats.pendingGuests, color: 'text-amber-600' },
                    {
                      label: 'Tasa de Respuesta',
                      value: `${stats.responseRatePercent}%`,
                      color: 'text-indigo-600',
                    },
                  ].map((kpi) => (
                    <div key={kpi.label} className="bg-white rounded-2xl border border-stone-200 p-5">
                      <p className="text-xs text-stone-500">{kpi.label}</p>
                      <p className={`text-3xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
                    <h3 className="font-semibold text-sm">Desglose por Categoría</h3>
                    {stats.byCategory.map((cat) => {
                      const pct =
                        cat.allocated > 0 ? Math.round((cat.confirmed / cat.allocated) * 100) : 0;
                      return (
                        <div key={cat.category} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium">{cat.category}</span>
                            <span className="text-stone-500">
                              {cat.confirmed} sí / {cat.declined} no / {cat.pending} pend. (de {cat.allocated})
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-3">
                    <h3 className="font-semibold text-sm">Estado de Invitaciones por Grupo ({stats.totalGroups})</h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded-xl bg-emerald-50 p-3">
                        <span className="text-emerald-700 font-semibold block">Confirmados Totales</span>
                        <span className="text-xl font-bold text-emerald-900">{stats.groupsConfirmed}</span>
                      </div>
                      <div className="rounded-xl bg-sky-50 p-3">
                        <span className="text-sky-700 font-semibold block">Confirmados Parciales</span>
                        <span className="text-xl font-bold text-sky-900">{stats.groupsPartial}</span>
                      </div>
                      <div className="rounded-xl bg-rose-50 p-3">
                        <span className="text-rose-700 font-semibold block">No Asisten</span>
                        <span className="text-xl font-bold text-rose-900">{stats.groupsDeclined}</span>
                      </div>
                      <div className="rounded-xl bg-amber-50 p-3">
                        <span className="text-amber-700 font-semibold block">Vistos / Pendientes</span>
                        <span className="text-xl font-bold text-amber-900">
                          {stats.groupsViewed} / {stats.groupsPending}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: INVITADOS */}
            {activeTab === 'GUESTS' && (
              <div className="space-y-6">
                <form
                  onSubmit={handleAddGuest}
                  className="bg-white rounded-2xl border border-stone-200 p-5 grid sm:grid-cols-6 gap-3 items-end"
                >
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-stone-600 mb-1">Nombre / Grupo</label>
                    <input
                      type="text"
                      value={newGuest.groupName}
                      onChange={(e) => setNewGuest((p) => ({ ...p, groupName: e.target.value }))}
                      placeholder="Ej. Juan Pérez y Acompañante"
                      required
                      className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-600 mb-1">Cupos</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={newGuest.maxGuests}
                      onChange={(e) =>
                        setNewGuest((p) => ({ ...p, maxGuests: Number(e.target.value) }))
                      }
                      className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-600 mb-1">WhatsApp (593...)</label>
                    <input
                      type="text"
                      value={newGuest.phone}
                      onChange={(e) => setNewGuest((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="593999999999"
                      className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-600 mb-1">Correo</label>
                    <input
                      type="email"
                      value={newGuest.email}
                      onChange={(e) => setNewGuest((p) => ({ ...p, email: e.target.value }))}
                      placeholder="correo@gmail.com"
                      className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-xl bg-stone-900 text-white px-4 py-2 text-xs font-semibold hover:bg-stone-800"
                  >
                    + Agregar
                  </button>
                </form>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por nombre, acompañante o teléfono..."
                      className="rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs w-64"
                    />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs"
                    >
                      <option value="ALL">Todos</option>
                      <option value="CONFIRMED">Confirmados</option>
                      <option value="PARTIAL">Parciales</option>
                      <option value="DECLINED">Rechazados</option>
                      <option value="VIEWED">Vistos</option>
                      <option value="PENDING">Pendientes</option>
                    </select>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-medium cursor-pointer hover:bg-stone-50">
                      <Upload className="h-3.5 w-3.5" />
                      Importar Excel
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleImportExcel(f);
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => handleExport('EXCEL')}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-medium hover:bg-stone-50"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-700" />
                      Excel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExport('PDF')}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-medium hover:bg-stone-50"
                    >
                      <Download className="h-3.5 w-3.5 text-rose-700" />
                      PDF
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-stone-200 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 text-stone-600">
                      <tr>
                        <th className="px-4 py-3">Grupo / Invitado</th>
                        <th className="px-4 py-3">Estado</th>
                        <th className="px-4 py-3">Integrantes, Acompañantes &amp; Mesa</th>
                        <th className="px-4 py-3">Contacto</th>
                        <th className="px-4 py-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredGuests.map((g) => {
                        const inviteLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/i/${g.token}`;
                        return (
                          <tr key={g.id}>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-stone-900">{g.groupName}</div>
                              <div className="text-stone-500">
                                {g.category} • {g.maxGuests} cupo(s)
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="rounded-full bg-stone-100 px-2.5 py-1 font-semibold">
                                {g.rsvpStatus}
                              </span>
                              {g.guestMessage && (
                                <p className="text-[11px] text-stone-500 mt-1 italic">
                                  &ldquo;{g.guestMessage}&rdquo;
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3 space-y-1">
                              {g.members.map((m) => (
                                <div key={m.id} className="flex items-center gap-1.5">
                                  <span
                                    className={`h-2 w-2 rounded-full ${
                                      m.attending === true
                                        ? 'bg-emerald-500'
                                        : m.attending === false
                                          ? 'bg-rose-500'
                                          : 'bg-amber-400'
                                    }`}
                                  />
                                  <span>{m.fullName}</span>
                                  {m.tableName && (
                                    <span className="rounded-md bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] text-amber-800">
                                      {m.tableName}
                                      {m.seatNumber ? ` #${m.seatNumber}` : ''}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </td>
                            <td className="px-4 py-3 text-stone-600">
                              <div>{g.phone || '—'}</div>
                              <div>{g.email || '—'}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  title="Copiar enlace único"
                                  onClick={() => {
                                    navigator.clipboard.writeText(inviteLink);
                                    toast.success('Enlace único copiado');
                                  }}
                                  className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                                <a
                                  href={`/i/${g.token}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Abrir invitación"
                                  className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                                {g.phone && (
                                  <a
                                    href={`https://wa.me/${g.phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(
                                      `Hola ${g.groupName}, te compartimos tu invitación de matrimonio: ${inviteLink}`
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Enviar manual por wa.me"
                                    className="p-1.5 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                  >
                                    <MessageCircle className="h-3.5 w-3.5" />
                                  </a>
                                )}
                                <button
                                  type="button"
                                  title="Editar invitado"
                                  onClick={() => setEditingGuest(g)}
                                  className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  title="Eliminar"
                                  onClick={() => handleDeleteGuest(g.id)}
                                  className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: MESAS Y PUESTOS */}
            {activeTab === 'TABLES' && (
              <AdminSeatingTab
                event={selectedEvent}
                onSeatingChanged={() => loadEventDetails(selectedEvent.id, currentUser?.role)}
              />
            )}

            {/* TAB 4: WHATSAPP QR & GMAIL */}
            {activeTab === 'DISPATCH' && (
              <AdminDispatchTab event={selectedEvent} guests={guests} />
            )}

            {/* TAB 5: DISEÑO & SECCIONES */}
            {activeTab === 'CUSTOMIZE' && (
              <AdminCustomizerTab
                key={selectedEvent.id}
                event={selectedEvent}
                onUpdated={(updated) => {
                  setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
                }}
              />
            )}

            {/* TAB 6: ÁLBUM QR DRIVE & DESEOS */}
            {activeTab === 'MEDIA' && (
              <div className="space-y-6">
                {qrInfo && (
                  <div className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <QrCode className="h-5 w-5 text-amber-700" />
                        <h3 className="font-semibold">Código QR para Carga de Fotos y Videos</h3>
                      </div>
                      <p className="text-xs text-stone-600 max-w-lg">
                        Imprime este QR para las mesas o proyéctalo en pantalla. Destino configurado:{' '}
                        <strong>{selectedEvent.mediaProvider}</strong> (configurable en Diseño &amp; Secciones).
                      </p>
                      <p className="text-xs font-mono text-stone-500">{qrInfo.uploadUrl}</p>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <a
                          href={qrInfo.qrDataUrl}
                          download={`qr-fotos-${selectedEvent.slug}.png`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Descargar QR PNG
                        </a>
                        <button
                          type="button"
                          onClick={() => setShowDriveModal(true)}
                          className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 px-3.5 py-2 text-xs font-semibold text-stone-800 shadow-xs transition"
                        >
                          <FolderOpen className="h-3.5 w-3.5 text-amber-700" />
                          <span>Configurar Google Drive & Photos</span>
                          <span className="inline-flex items-center gap-1">
                            {qrInfo.googlePerEventConnected ? (
                              <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 border border-emerald-200">
                                Conectado
                              </span>
                            ) : (
                              <span className="rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold px-2 py-0.5 border border-amber-200">
                                Local
                              </span>
                            )}
                            <span className="rounded-full bg-stone-100 text-stone-600 text-[10px] font-medium px-2 py-0.5 border border-stone-200">
                              {selectedEvent.mediaProvider}
                            </span>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={handleGoogleDriveConnect}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold border ${
                            qrInfo.googlePerEventConnected
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                              : qrInfo.driveConfigured
                                ? 'border-emerald-200 bg-emerald-50/70 text-emerald-800'
                                : 'border-amber-300 bg-amber-50 text-amber-800'
                          }`}
                        >
                          <Check className="h-3.5 w-3.5" />
                          {qrInfo.googlePerEventConnected
                            ? `Conectado: ${qrInfo.googleAccountEmail || 'Cuenta de esta boda'} (Cambiar)`
                            : qrInfo.driveConfigured
                              ? 'Cuenta Global Activa — Vincular Correo Propio de esta Boda'
                              : 'Vincular Cuenta Google'}
                        </button>
                        {qrInfo.googlePerEventConnected && (
                          <button
                            type="button"
                            onClick={handleGoogleDriveDisconnect}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100"
                          >
                            Desvincular
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 max-w-xl pt-1">
                        Cada boda puede vincular su propia cuenta de Gmail / Google Photos / Drive o usar el almacenamiento local del servidor. Todo es 100% parametrizable desde la pantalla.
                      </p>
                    </div>
                    <img
                      src={qrInfo.qrDataUrl}
                      alt="QR Fotos"
                      className="w-44 h-44 rounded-2xl border border-stone-200 p-2 bg-white"
                    />
                  </div>
                )}

                <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
                  <h3 className="font-semibold text-sm">Archivos Subidos ({media.length})</h3>
                  {media.length === 0 ? (
                    <p className="text-xs text-stone-500">Aún no se han subido fotos o videos.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {media.map((m) => (
                        <div key={m.id} className="rounded-xl border border-stone-200 overflow-hidden">
                          {m.mediaType === 'VIDEO' ? (
                            <video
                              src={`${API_BASE_URL}/api/public/media/${m.id}/file`}
                              controls
                              className="h-36 w-full object-cover bg-black"
                            />
                          ) : m.mediaType === 'OTHER' ? (
                            <a
                              href={`${API_BASE_URL}/api/public/media/${m.id}/file`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-36 w-full flex flex-col items-center justify-center gap-1.5 bg-stone-50 p-3 text-center"
                            >
                              <FileText className="h-8 w-8 text-amber-700" />
                              <span className="text-[11px] font-medium truncate max-w-full">
                                {m.originalName}
                              </span>
                            </a>
                          ) : (
                            <img
                              src={`${API_BASE_URL}/api/public/media/${m.id}/file`}
                              alt={m.uploaderName}
                              className="h-36 w-full object-cover"
                            />
                          )}
                          <div className="p-2.5 text-xs space-y-1">
                            <p className="font-semibold truncate">{m.uploaderName}</p>
                            <p className="text-[11px] text-stone-500">
                              {m.storageMode} • {m.status}
                            </p>
                            <div className="flex gap-1 pt-1">
                              {m.status !== 'APPROVED' && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await apiFetch(
                                      `/api/events/${selectedEvent.id}/media/${m.id}`,
                                      {
                                        method: 'PATCH',
                                        auth: true,
                                        body: JSON.stringify({ status: 'APPROVED' }),
                                      }
                                    );
                                    loadEventDetails(selectedEvent.id, currentUser?.role);
                                  }}
                                  className="flex-1 rounded-lg bg-emerald-600 text-white py-1 text-[11px]"
                                >
                                  Aprobar
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={async () => {
                                  await apiFetch(
                                    `/api/events/${selectedEvent.id}/media/${m.id}`,
                                    { method: 'DELETE', auth: true }
                                  );
                                  loadEventDetails(selectedEvent.id, currentUser?.role);
                                }}
                                className="rounded-lg bg-rose-100 text-rose-700 px-2 py-1 text-[11px]"
                              >
                                Borrar
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-sm">Muro de Buenos Deseos ({wishes.length})</h3>
                    {selectedEvent && (
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            exportWishesPdf(selectedEvent, wishes);
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : 'No se pudo generar el PDF');
                          }
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-800"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Descargar Deseos (PDF)
                      </button>
                    )}
                  </div>
                  {wishes.map((w) => (
                    <div
                      key={w.id}
                      className="flex items-center justify-between gap-4 rounded-xl bg-stone-50 p-3 text-xs"
                    >
                      <div>
                        <span className="font-semibold">{w.authorName}: </span>
                        <span className="text-stone-700">{w.message}</span>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          await apiFetch(`/api/events/${selectedEvent.id}/wishes/${w.id}`, {
                            method: 'DELETE',
                            auth: true,
                          });
                          loadEventDetails(selectedEvent.id, currentUser?.role);
                        }}
                        className="text-rose-600 hover:underline shrink-0"
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
      </div>

      {editingGuest && selectedEvent && (
        <GuestEditModal
          eventId={selectedEvent.id}
          guest={editingGuest}
          onClose={() => setEditingGuest(null)}
          onSaved={() => loadEventDetails(selectedEvent.id, currentUser?.role)}
        />
      )}

      {showProfileModal && currentUser && (
        <UserEditModal
          mode="self"
          user={{
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            role: currentUser.role,
            organizationId: currentUser.organizationId ?? null,
            assignedEventId: currentUser.assignedEventId ?? null,
          }}
          actorRole={currentUser.role}
          onClose={() => setShowProfileModal(false)}
          onSaved={(updated) => {
            if (updated) {
              setCurrentUser((prev) =>
                prev
                  ? {
                      ...prev,
                      name: updated.name,
                      email: updated.email,
                    }
                  : prev
              );
            }
            loadSessionAndEvents();
          }}
        />
      )}

      {editingCoupleUser && selectedEvent && (
        <UserEditModal
          mode="admin"
          user={editingCoupleUser}
          actorRole={currentUser?.role}
          organizations={organizations}
          events={visibleEvents}
          onClose={() => setEditingCoupleUser(null)}
          onSaved={() => {
            loadEventDetails(selectedEvent.id, currentUser?.role);
            if (isSuperAdmin) {
              loadSessionAndEvents();
            }
          }}
        />
      )}

      {currentUser?.mustChangePassword && (
        <ForcePasswordChangeModal
          userName={currentUser.name}
          userEmail={currentUser.email}
          onPasswordChanged={() => {
            setCurrentUser((prev) =>
              prev
                ? {
                    ...prev,
                    mustChangePassword: false,
                  }
                : prev
            );
            loadSessionAndEvents();
          }}
        />
      )}

      {showDriveModal && selectedEvent && (
        <DriveConfigModal
          eventId={selectedEvent.id}
          weddingTitle={selectedEvent.title}
          initialConfig={{
            mediaProvider: selectedEvent.mediaProvider,
            driveFolderId: selectedEvent.driveFolderId,
            driveFolderUrl: selectedEvent.driveFolderUrl,
            photosAlbumId: selectedEvent.photosAlbumId,
            photosAlbumUrl: selectedEvent.photosAlbumUrl,
            googleAccountEmail: qrInfo?.googleAccountEmail,
            googlePerEventConnected: qrInfo?.googlePerEventConnected,
          }}
          onClose={() => setShowDriveModal(false)}
          onSaved={() => {
            loadEventDetails(selectedEvent.id, currentUser?.role);
          }}
        />
      )}
    </div>
  );
}
