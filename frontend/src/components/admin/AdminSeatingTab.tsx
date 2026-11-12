'use client';

import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  CalendarClock,
  CheckSquare,
  Download,
  FileSpreadsheet,
  GripVertical,
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

type DragPayload =
  | { type: 'MEMBER'; memberId: string; fromTableId?: string; count: 1 }
  | { type: 'GROUP'; groupId: string; count: number }
  | { type: 'MULTI'; memberIds: string[]; count: number };

export function AdminSeatingTab({ event, onSeatingChanged }: AdminSeatingTabProps) {
  const [tables, setTables] = useState<EventTable[]>([]);
  const [summary, setSummary] = useState<SeatingSummary | null>(null);
  const [unassigned, setUnassigned] = useState<UnassignedConfirmedMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [targetTableByMember, setTargetTableByMember] = useState<Record<string, string>>({});

  // Selección múltiple y Drag & Drop
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchTableId, setBatchTableId] = useState<string>('');
  const [dragPayload, setDragPayload] = useState<DragPayload | null>(null);
  const [hoverTarget, setHoverTarget] = useState<string | null>(null);

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
      setSelectedIds((prev) =>
        prev.filter((id) => res.unassignedConfirmed.some((u) => u.id === id))
      );
      if (res.tables.length > 0) {
        setBatchTableId((prev) =>
          prev && res.tables.some((t) => t.id === prev) ? prev : res.tables[0].id
        );
      }
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

  const handleAssignMulti = async (memberIds: string[], tableId: string) => {
    if (!tableId || memberIds.length === 0) return;
    try {
      await apiFetch(`/api/events/${event.id}/tables/${tableId}/assign`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ memberIds }),
      });
      toast.success(`${memberIds.length} invitado(s) asignado(s) a la mesa`);
      setSelectedIds([]);
      await loadSeating();
      onSeatingChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo asignar la selección');
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

  const handleDropOnTable = async (tableId: string, e: React.DragEvent) => {
    e.preventDefault();
    setHoverTarget(null);

    let payload = dragPayload;
    if (!payload) {
      try {
        const raw = e.dataTransfer.getData('application/json');
        if (raw) payload = JSON.parse(raw) as DragPayload;
      } catch {
        payload = null;
      }
    }
    setDragPayload(null);
    if (!payload) return;

    if (payload.type === 'MEMBER') {
      if (payload.fromTableId === tableId) return;
      await handleAssignMember(payload.memberId, tableId);
    } else if (payload.type === 'GROUP') {
      await handleAssignGroup(payload.groupId, tableId);
    } else if (payload.type === 'MULTI') {
      await handleAssignMulti(payload.memberIds, tableId);
    }
  };

  const handleDropOnUnassigned = async (e: React.DragEvent) => {
    e.preventDefault();
    setHoverTarget(null);
    let payload = dragPayload;
    if (!payload) {
      try {
        const raw = e.dataTransfer.getData('application/json');
        if (raw) payload = JSON.parse(raw) as DragPayload;
      } catch {
        payload = null;
      }
    }
    setDragPayload(null);
    if (payload?.type === 'MEMBER' && payload.fromTableId) {
      await handleUnassign(payload.memberId);
    }
  };

  const startDrag = (payload: DragPayload, e: React.DragEvent) => {
    setDragPayload(payload);
    e.dataTransfer.setData('application/json', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'move';
  };

  const toggleSelection = (memberId: string) => {
    setSelectedIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
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
      {/* Banner de estado */}
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
                Distribución de Mesas y Puestos (Arrastrar y Soltar)
                {summary.daysUntilEvent > 0 && (
                  <span className="ml-2 text-xs font-normal text-stone-500">
                    (Faltan {summary.daysUntilEvent} días para la boda)
                  </span>
                )}
              </h3>
              <p className="text-xs text-stone-600 mt-0.5">
                Arrastra un invitado, el grupo completo, o marca varios con el checkbox y arrástralos
                juntos hacia cualquier mesa. También puedes mover invitados entre mesas.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="rounded-xl bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-700">
              Ubicados: {summary.totalAssigned} / {summary.totalConfirmed} confirmados
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
          {/* Columna Izquierda: Confirmados sin mesa (Dropzone para liberar asientos + Selección Múltiple) */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setHoverTarget('UNASSIGNED');
            }}
            onDragLeave={() => setHoverTarget(null)}
            onDrop={handleDropOnUnassigned}
            className={`bg-white rounded-2xl border-2 p-5 space-y-4 transition ${
              hoverTarget === 'UNASSIGNED' ? 'border-amber-500 bg-amber-50/40' : 'border-stone-200'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-amber-700" />
                Confirmados sin mesa ({unassigned.length})
              </h4>
              {filteredUnassigned.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setSelectedIds((prev) =>
                      prev.length === filteredUnassigned.length
                        ? []
                        : filteredUnassigned.map((u) => u.id)
                    )
                  }
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 hover:underline"
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                  {selectedIds.length === filteredUnassigned.length ? 'Deseleccionar' : 'Marcar todos'}
                </button>
              )}
            </div>

            {/* Barra de acción rápida para selección múltiple */}
            {selectedIds.length > 0 && tables.length > 0 && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
                  <span>{selectedIds.length} seleccionado(s) — arrastra o asigna:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedIds([])}
                    className="text-[11px] underline font-normal"
                  >
                    Limpiar
                  </button>
                </div>
                <div className="flex gap-2">
                  <select
                    value={batchTableId}
                    onChange={(e) => setBatchTableId(e.target.value)}
                    className="flex-1 rounded-lg border border-amber-300 bg-white px-2 py-1.5 text-xs"
                  >
                    {tables.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.members.length}/{t.capacity})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleAssignMulti(selectedIds, batchTableId)}
                    className="rounded-lg bg-amber-700 text-white px-3 py-1.5 text-xs font-semibold hover:bg-amber-800 shrink-0"
                  >
                    Mover
                  </button>
                </div>
              </div>
            )}

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
                      draggable={tables.length > 0}
                      onDragStart={(e) =>
                        startDrag({ type: 'GROUP', groupId, count: grp.members.length }, e)
                      }
                      onDragEnd={() => {
                        setDragPayload(null);
                        setHoverTarget(null);
                      }}
                      className="rounded-xl border border-stone-200 bg-stone-50/70 p-3 space-y-2.5 cursor-grab active:cursor-grabbing hover:border-amber-400 transition"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <GripVertical className="h-4 w-4 text-stone-400 shrink-0" />
                          <div className="truncate">
                            <div className="font-semibold text-xs text-stone-900 truncate">
                              {grp.groupName}
                            </div>
                            <div className="text-[11px] text-stone-500">{grp.category}</div>
                          </div>
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
                            const isChecked = selectedIds.includes(m.id);
                            return (
                              <div
                                key={m.id}
                                draggable
                                onDragStart={(e) => {
                                  e.stopPropagation();
                                  if (isChecked && selectedIds.length > 1) {
                                    startDrag(
                                      {
                                        type: 'MULTI',
                                        memberIds: selectedIds,
                                        count: selectedIds.length,
                                      },
                                      e
                                    );
                                  } else {
                                    startDrag({ type: 'MEMBER', memberId: m.id, count: 1 }, e);
                                  }
                                }}
                                onDragEnd={() => {
                                  setDragPayload(null);
                                  setHoverTarget(null);
                                }}
                                className={`flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-xs cursor-grab active:cursor-grabbing transition ${
                                  isChecked
                                    ? 'bg-amber-50 border-amber-400'
                                    : 'bg-white border-stone-200 hover:border-stone-300'
                                }`}
                              >
                                <label className="flex items-center gap-2 min-w-0 cursor-pointer flex-1">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleSelection(m.id)}
                                    className="h-3.5 w-3.5 accent-amber-700 shrink-0"
                                  />
                                  <GripVertical className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                                  <span className="truncate font-medium">
                                    {m.fullName}
                                    {isChecked && selectedIds.length > 1 && (
                                      <span className="ml-1 text-[10px] text-amber-800">
                                        (+{selectedIds.length - 1})
                                      </span>
                                    )}
                                  </span>
                                </label>
                                <div className="flex items-center gap-1 shrink-0">
                                  <select
                                    value={selectedTable}
                                    onChange={(e) =>
                                      setTargetTableByMember((prev) => ({
                                        ...prev,
                                        [m.id]: e.target.value,
                                        [groupId]: e.target.value,
                                      }))
                                    }
                                    className="rounded-lg border border-stone-300 px-1.5 py-1 text-[11px] bg-white max-w-[115px]"
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

          {/* Columna Derecha: Plano de Mesas (Dropzones) */}
          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
            {tables.length === 0 ? (
              <div className="sm:col-span-2 bg-white rounded-2xl border border-stone-200 p-8 text-center text-xs text-stone-500">
                Aún no has creado mesas. Usa el formulario superior para agregar tus mesas.
              </div>
            ) : (
              tables.map((table) => {
                const isFull = table.members.length >= table.capacity;
                const isHovered = hoverTarget === table.id;
                const incomingCount = dragPayload?.count || 0;
                const wouldFit = table.members.length + incomingCount <= table.capacity;

                return (
                  <div
                    key={table.id}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setHoverTarget(table.id);
                    }}
                    onDragLeave={() => setHoverTarget(null)}
                    onDrop={(e) => handleDropOnTable(table.id, e)}
                    className={`bg-white rounded-2xl border-2 p-5 space-y-3 shadow-xs transition ${
                      isHovered
                        ? wouldFit
                          ? 'border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-200'
                          : 'border-rose-500 bg-rose-50/30 ring-2 ring-rose-200'
                        : 'border-stone-200'
                    }`}
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

                    {/* Puestos ocupados (arrastrables entre mesas o al panel sin mesa) */}
                    <div className="space-y-1.5">
                      {table.members.map((m) => (
                        <div
                          key={m.id}
                          draggable
                          onDragStart={(e) =>
                            startDrag(
                              { type: 'MEMBER', memberId: m.id, fromTableId: table.id, count: 1 },
                              e
                            )
                          }
                          onDragEnd={() => {
                            setDragPayload(null);
                            setHoverTarget(null);
                          }}
                          className="flex items-center justify-between rounded-xl bg-stone-50 border border-stone-200 px-3 py-2 text-xs cursor-grab active:cursor-grabbing hover:border-amber-400 transition"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <GripVertical className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                            <div className="min-w-0">
                              <span className="inline-block font-semibold text-amber-800 mr-1.5">
                                #{m.seatNumber ?? '-'}
                              </span>
                              <span className="font-medium text-stone-900">{m.fullName}</span>
                              <span className="block text-[11px] text-stone-500 truncate">
                                {m.groupName} ({m.category})
                              </span>
                            </div>
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
                            {isHovered && wouldFit
                              ? 'Soltar aquí para asignar puesto'
                              : 'Puesto disponible'}
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
