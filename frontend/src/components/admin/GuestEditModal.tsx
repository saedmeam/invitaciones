'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Save, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { GuestGroup } from '@/types/invitation';

interface GuestEditModalProps {
  eventId: string;
  guest: GuestGroup;
  onClose: () => void;
  onSaved: () => void;
}

interface EditableMember {
  id?: string;
  fullName: string;
  isPrimary: boolean;
  isCompanionSlot: boolean;
  attending: boolean | null;
  tableName?: string | null;
  seatNumber?: number | null;
}

export function GuestEditModal({ eventId, guest, onClose, onSaved }: GuestEditModalProps) {
  const [groupName, setGroupName] = useState(guest.groupName);
  const [category, setCategory] = useState(guest.category || 'General');
  const [phone, setPhone] = useState(guest.phone || '');
  const [email, setEmail] = useState(guest.email || '');
  const [guestMessage, setGuestMessage] = useState(guest.guestMessage || '');
  const [members, setMembers] = useState<EditableMember[]>(() =>
    guest.members.map((m) => ({
      id: m.id,
      fullName: m.fullName,
      isPrimary: m.isPrimary,
      isCompanionSlot: m.isCompanionSlot,
      attending: m.attending,
      tableName: m.tableName,
      seatNumber: m.seatNumber,
    }))
  );
  const [saving, setSaving] = useState(false);

  const handleMaxGuestsChange = (nextCountRaw: number) => {
    const nextCount = Math.max(1, Math.min(20, nextCountRaw || 1));
    setMembers((prev) => {
      if (nextCount === prev.length) return prev;
      if (nextCount < prev.length) {
        return prev.slice(0, nextCount);
      }
      const copy = [...prev];
      while (copy.length < nextCount) {
        const idx = copy.length;
        copy.push({
          fullName: idx === 0 ? groupName : `Acompañante ${nextCount > 2 ? idx : ''}`.trim(),
          isPrimary: idx === 0,
          isCompanionSlot: idx > 0,
          attending: null,
        });
      }
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch(`/api/events/${eventId}/guests/${guest.id}`, {
        method: 'PUT',
        auth: true,
        body: JSON.stringify({
          groupName: groupName.trim(),
          category: category.trim() || 'General',
          phone: phone.trim() || null,
          email: email.trim() || null,
          maxGuests: members.length,
          guestMessage: guestMessage.trim() || null,
          members: members.map((m, idx) => ({
            id: m.id,
            fullName: m.fullName.trim() || (idx === 0 ? groupName.trim() : `Acompañante ${idx}`),
            isPrimary: idx === 0,
            isCompanionSlot: idx > 0,
            attending: m.attending,
          })),
        }),
      });
      toast.success('Invitado actualizado');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar invitado');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white border border-stone-200 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
          <h3 className="font-serif text-2xl font-semibold text-stone-900">Editar Invitado</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">
                Nombre / Grupo
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Categoría</label>
              <input
                type="text"
                list="guest-categories"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
              />
              <datalist id="guest-categories">
                <option value="Familia Novia" />
                <option value="Familia Novio" />
                <option value="Amigos" />
                <option value="Trabajo" />
                <option value="VIP" />
                <option value="General" />
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">
                WhatsApp (ej. 593999999999)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">
                Cupos Asignados (1 a 20)
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={members.length}
                onChange={(e) => handleMaxGuestsChange(Number(e.target.value))}
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">
                Mensaje / Nota del Invitado
              </label>
              <input
                type="text"
                value={guestMessage}
                onChange={(e) => setGuestMessage(e.target.value)}
                placeholder="Opcional"
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-stone-700">
              Integrantes y Acompañantes ({members.length})
            </label>
            {members.map((m, idx) => (
              <div
                key={m.id || `new-${idx}`}
                className="rounded-xl border border-stone-200 bg-stone-50 p-3 flex flex-col sm:flex-row sm:items-center gap-2.5"
              >
                <div className="flex-1">
                  <input
                    type="text"
                    value={m.fullName}
                    onChange={(e) =>
                      setMembers((prev) =>
                        prev.map((item, i) =>
                          i === idx ? { ...item, fullName: e.target.value } : item
                        )
                      )
                    }
                    placeholder={idx === 0 ? 'Invitado titular' : `Acompañante ${idx}`}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs"
                  />
                  {m.tableName && (
                    <p className="text-[11px] text-amber-800 mt-1">
                      Mesa actual: {m.tableName}
                      {m.seatNumber ? ` #${m.seatNumber}` : ''} (si pasa a No asiste o Pendiente,
                      se libera el puesto)
                    </p>
                  )}
                </div>

                <select
                  value={m.attending === true ? 'YES' : m.attending === false ? 'NO' : 'PENDING'}
                  onChange={(e) => {
                    const val = e.target.value;
                    const nextAttending = val === 'YES' ? true : val === 'NO' ? false : null;
                    setMembers((prev) =>
                      prev.map((item, i) =>
                        i === idx ? { ...item, attending: nextAttending } : item
                      )
                    );
                  }}
                  className="rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-medium"
                >
                  <option value="PENDING">Pendiente</option>
                  <option value="YES">Sí asiste</option>
                  <option value="NO">No asiste</option>
                </select>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
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
              className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-5 py-2 text-xs font-semibold text-white hover:bg-stone-800 disabled:opacity-60"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
