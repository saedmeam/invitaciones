'use client';

import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  CalendarClock,
  Download,
  FileSpreadsheet,
  LayoutGrid,
  Plus,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import {
  EventTable,
  SeatingSummary,
  TableShape,
  UnassignedConfirmedMember,
  WeddingEvent,
} from '@/types/invitation';

interface AdminSeatingTabProps {
  event: WeddingEvent;
  onSeatingChanged?: () => void;
}

export function AdminSeatingTab({ event, onSeatingChanged }: AdminSeatingTabProps) {
  const [tables, setTables] = useState<EventTable[]>([]);
  const [summary, setSummary] = useState<SeatingSummary | null>(null);
  const [unassigned, setUnassigned] = useState<UnassignedConfirmedMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [targetTableByMember, setTargetTableByMember] = useState<Record<string, string>>({});

  const [newTable, setNewTable] = useState({
    name: '',
    capacity: 8,
    shape: 'ROUND' as TableShape,
    zone: 'Salón Principal',
  });

  const loadSeating = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{
        tables: EventTable[];
        summary: SeatingSummary;
        unassignedConfirmed: UnassignedConfirmedMember[];
      }>(`/api/events/${event.id}/tables`, { auth: true });
      setTables(res.tables);
      setSummary(res.summary);
      setUnassigned(res.unassignedConfirmed);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error cargando mesas');
    } finally {
      setLoading(false);
    }
  }, [event.id]);

  useEffect(() => {
    loadSeating();
  }, [loadSeating]);

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/events/${event.id}/tables`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
          name: newTable.name,
          capacity: Number(newTable.capacity),
          shape: newTable.shape,
          zone: newTable.zone,
        }),
      });
      setNewTable({ name: '', capacity: 8, shape: 'ROUND', zone: 'Salón Principal' });
      toast.success('Mesa creada');
      await loadSeating();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error creando mesa');
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    try {
      await apiFetch(`/api/events/${event.id}/tables/${tableId}`, {
        method: 'DELETE',
        auth: true,
      });
      toast.success('Mesa eliminada; los invitados quedaron sin mesa');
      await loadSeating();
      onSeatingChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error eliminando mesa');
    }
  };

  const handleAssignMember = async (memberId: string, tableId: string) => {
    if (!tableId) {
      toast.error('Selecciona primero una mesa');
      return;
    }
    try {
      await apiFetch(`/api/events/${event.id}/tables/${tableId}/assign`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ memberId }),
      });
      toast.success('Invitado asignado a la mesa');
      await loadSeating();
      onSeatingChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo asignar el puesto');
    }
  };

  const handleAssignGroup = async (groupId: string, tableId: string) => {
    if (!tableId) {
      toast.error('Selecciona primero una mesa');
      return;
    }
    try {
      await apiFetch(`/api/events/${event.id}/tables/${tableId}/assign`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ groupId }),
      });
      toast.success('Grupo completo asignado a la mesa');
      await loadSeating();
      onSeatingChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo asignar el grupo');
    }
  };

  const handleUnassign = async (memberId: string) => {
    try {
      await apiFetch(`/api/events/${event.id}/tables/unassign`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ memberId }),
      });
      toast.success('Puesto liberado');
      await loadSeating();
      onSeatingChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al liberar puesto');
    }
  };

  const handleExport = async (format: 'EXCEL' | 'PDF') => {
    try {
      const blob = await apiFetch<Blob>(
        `/api/events/${event.id}/tables/export?format=${format}`,
        { auth: true }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mesas-${event.slug}.${format === 'EXCEL' ? 'xlsx' : 'pdf'}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Error exportando distribución de mesas');
    }
  };

  const filteredUnassigned = unassigned.filter((m) => {
    const q = search.toLowerCase();
    return (
      !q ||
      m.fullName.toLowerCase().includes(q) ||
      m.groupName.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q)
    );
  });

  // Agrupar confirmados sin mesa por grupo para poder sentar familias/parejas en 1 clic
  const groupedUnassigned = filteredUnassigned.reduce<
    Record<string, { groupName: string; category: string; members: UnassignedConfirmedMember[] }>
  >((acc, item) => {
    if (!acc[item.groupId]) {
      acc[item.groupId] = {
        groupName: item.groupName,
        category: item.category,
        members: [],
      };
    }
    acc[item.groupId].members.push(item);
    return acc;
  }, {});

  const defaultTableId = tables[0]?.id || '';

  return (
    <div className="space-y-6">
      {/* Banner de estado y ventana de asignación (~7 días antes) */}
      {summary && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <CalendarClock
              className={`h-6 w-6 shrink-0 mt-0.5 ${
                summary.isSeatingWindowOpen ? 'text-amber-600' : 'text-stone-600'
              }`}
            />
            <div>
              <h3 className="font-semibold text-sm text-stone-900">
                Distribución de Mesas y Puestos
                {summary.daysUntilEvent > 0 && (
                  <span className="ml-2 text-xs font-normal text-stone-500">
                    (Faltan {summary.daysUntilEvent} días para la boda)
                  </span>
                )}
              </h3>
              <p className="text-xs text-stone-600 mt-0.5">
                {summary.unassignedConfirmed === 0 && summary.totalConfirmed > 0
                  ? 'Todos los invitados confirmados ya tienen mesa asignada.'
                  : summary.isSeatingWindowOpen
                    ? `Ventana final recomendada (<= 10 días): quedan ${summary.unassignedConfirmed} invitado(s) confirmado(s) por ubicar en mesa.`
                    : `Puedes organizar las mesas con anticipación o ~1 semana antes de la boda. Confirmados actuales: ${summary.totalConfirmed} (${summary.totalAssigned} ubicados, ${summary.unassignedConfirmed} sin mesa).`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="rounded-xl bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-700">
              Capacidad en mesas: {summary.totalAssigned} / {summary.totalTableCapacity}
            </span>
            <button
              type="button"
              onClick={() => handleExport('EXCEL')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-stone-50"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-700" />
              Excel
            </button>
            <button
              type="button"
              onClick={() => handleExport('PDF')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-stone-50"
            >
              <Download className="h-3.5 w-3.5 text-rose-700" />
              PDF
            </button>
          </div>
        </div>
      )}

      {/* Crear Mesa */}
      <form
        onSubmit={handleCreateTable}
        className="bg-white rounded-2xl border border-stone-200 p-5 grid sm:grid-cols-5 gap-3 items-end"
      >
        <div className="sm:col-span-2">
          <label className="block text-xs text-stone-600 mb-1">Nombre de la Mesa</label>
          <input
            type="text"
            value={newTable.name}
            onChange={(e) => setNewTable((p) => ({ ...p, name: e.target.value }))}
            placeholder="Ej. Mesa 3 - Amigos Universidad"
            required
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
          />
        </div>
        <div>
          <label className="block text-xs text-stone-600 mb-1">Capacidad</label>
          <input
            type="number"
            min={1}
            max={30}
            value={newTable.capacity}
            onChange={(e) => setNewTable((p) => ({ ...p, capacity: Number(e.target.value) }))}
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
          />
        </div>
        <div>
          <label className="block text-xs text-stone-600 mb-1">Forma</label>
          <select
            value={newTable.shape}
            onChange={(e) => setNewTable((p) => ({ ...p, shape: e.target.value as TableShape }))}
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs bg-white"
          >
            <option value="ROUND">Redonda</option>
            <option value="RECTANGULAR">Rectangular</option>
            <option value="HEAD">Mesa Principal</option>
          </select>
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-stone-900 text-white px-4 py-2 text-xs font-semibold hover:bg-stone-800"
        >
          <Plus className="h-3.5 w-3.5" />
          Crear Mesa
        </button>
      </form>

      {loading ? (
        <p className="text-xs text-stone-500">Cargando mapa de mesas...</p>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          {/* Columna Izquierda: Confirmados sin mesa */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-amber-700" />
                Confirmados sin mesa ({unassigned.length})
              </h4>
            </div>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar invitado o grupo..."
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
            />

            {Object.keys(groupedUnassigned).length === 0 ? (
              <div className="rounded-xl bg-stone-50 p-4 text-center text-xs text-stone-500">
                No hay invitados confirmados pendientes de ubicar en mesa.
              </div>
            ) : (
              <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
                {Object.entries(groupedUnassigned).map(([groupId, grp]) => {
                  const chosenGroupTable = targetTableByMember[groupId] || defaultTableId;
                  return (
                    <div
                      key={groupId}
                      className="rounded-xl border border-stone-200 bg-stone-50/70 p-3 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold text-xs text-stone-900">{grp.groupName}</div>
                          <div className="text-[11px] text-stone-500">{grp.category}</div>
                        </div>
                        {grp.members.length > 1 && tables.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleAssignGroup(groupId, chosenGroupTable)}
                            className="rounded-lg bg-stone-900 text-white px-2.5 py-1 text-[11px] font-medium hover:bg-stone-800 shrink-0"
                          >
                            Sentar grupo ({grp.members.length})
                          </button>
                        )}
                      </div>

                      {tables.length === 0 ? (
                        <p className="text-[11px] text-amber-700 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> Crea al menos una mesa primero
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {grp.members.map((m) => {
                            const selectedTable = targetTableByMember[m.id] || chosenGroupTable;
                            return (
                              <div
                                key={m.id}
                                className="flex items-center justify-between gap-2 bg-white rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs"
                              >
                                <span className="truncate font-medium">{m.fullName}</span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <select
                                    value={selectedTable}
                                    onChange={(e) =>
                                      setTargetTableByMember((prev) => ({
                                        ...prev,
                                        [m.id]: e.target.value,
                                        [groupId]: e.target.value,
                                      }))
                                    }
                                    className="rounded-lg border border-stone-300 px-1.5 py-1 text-[11px] bg-white max-w-[125px]"
                                  >
                                    {tables.map((t) => (
                                      <option key={t.id} value={t.id}>
                                        {t.name} ({t.members.length}/{t.capacity})
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    title="Asignar a mesa"
                                    onClick={() => handleAssignMember(m.id, selectedTable)}
                                    className="rounded-lg bg-emerald-600 text-white p-1 hover:bg-emerald-700"
                                  >
                                    <UserPlus className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Columna Derecha: Plano de Mesas */}
          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
            {tables.length === 0 ? (
              <div className="sm:col-span-2 bg-white rounded-2xl border border-stone-200 p-8 text-center text-xs text-stone-500">
                Aún no has creado mesas. Usa el formulario superior para agregar tus mesas.
              </div>
            ) : (
              tables.map((table) => {
                const isFull = table.members.length >= table.capacity;
                return (
                  <div
                    key={table.id}
                    className="bg-white rounded-2xl border border-stone-200 p-5 space-y-3 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <LayoutGrid className="h-4 w-4 text-amber-700" />
                          <h4 className="font-semibold text-sm text-stone-900">{table.name}</h4>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          {table.zone} •{' '}
                          {table.shape === 'HEAD'
                            ? 'Mesa Principal'
                            : table.shape === 'RECTANGULAR'
                              ? 'Rectangular'
                              : 'Redonda'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            isFull
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {table.members.length} / {table.capacity}
                        </span>
                        <button
                          type="button"
                          title="Eliminar mesa"
                          onClick={() => handleDeleteTable(table.id)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Puestos ocupados y libres */}
                    <div className="space-y-1.5">
                      {table.members.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between rounded-xl bg-stone-50 border border-stone-200 px-3 py-2 text-xs"
                        >
                          <div className="min-w-0">
                            <span className="inline-block font-semibold text-amber-800 mr-2">
                              #{m.seatNumber ?? '-'}
                            </span>
                            <span className="font-medium text-stone-900">{m.fullName}</span>
                            <span className="block text-[11px] text-stone-500 truncate">
                              {m.groupName} ({m.category})
                            </span>
                          </div>
                          <button
                            type="button"
                            title="Quitar de la mesa"
                            onClick={() => handleUnassign(m.id)}
                            className="p-1.5 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg shrink-0"
                          >
                            <UserMinus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}

                      {Array.from({ length: Math.max(0, table.capacity - table.members.length) }).map(
                        (_, idx) => (
                          <div
                            key={`empty-${idx}`}
                            className="rounded-xl border border-dashed border-stone-200 px-3 py-1.5 text-[11px] text-stone-400"
                          >
                            Puesto disponible
                          </div>
                        )
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
