'use client';

import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { Mail, MessageCircle, Power, QrCode, Send } from 'lucide-react';
import { API_BASE_URL, apiFetch } from '@/lib/api';
import { DispatchLog, GuestGroup, WeddingEvent, WhatsAppState } from '@/types/invitation';

interface AdminDispatchTabProps {
  event: WeddingEvent;
  guests: GuestGroup[];
}

export function AdminDispatchTab({ event, guests }: AdminDispatchTabProps) {
  const [waState, setWaState] = useState<WhatsAppState>({
    status: 'DISCONNECTED',
    qrDataUrl: null,
    connectedPhone: null,
    lastError: null,
  });
  const [logs, setLogs] = useState<DispatchLog[]>([]);
  const [channel, setChannel] = useState<'WHATSAPP' | 'EMAIL'>('WHATSAPP');
  const [onlyPending, setOnlyPending] = useState(true);
  const [subject, setSubject] = useState(
    `Invitación de Boda: ${event.partnerOneName} & ${event.partnerTwoName}`
  );
  const [message, setMessage] = useState(
    'Hola {nombre}, con mucha alegría te invitamos al matrimonio de {novios} el {fecha}. Hemos reservado {cupos} cupo(s) para ustedes. Confirma tu asistencia aquí: {link}'
  );
  const [sending, setSending] = useState(false);

  const loadLogs = useCallback(async () => {
    try {
      const res = await apiFetch<{ logs: DispatchLog[] }>(`/api/events/${event.id}/dispatch/logs`, {
        auth: true,
      });
      setLogs(res.logs);
    } catch {
      // ignore initial load error
    }
  }, [event.id]);

  useEffect(() => {
    apiFetch<WhatsAppState>('/api/whatsapp/status', { auth: true })
      .then(setWaState)
      .catch(() => {});
    loadLogs();

    const socket = io(API_BASE_URL);
    socket.on('whatsapp:state', (state: WhatsAppState) => {
      setWaState(state);
    });

    return () => {
      socket.disconnect();
    };
  }, [loadLogs]);

  const handleConnectWa = async () => {
    try {
      const res = await apiFetch<WhatsAppState>('/api/whatsapp/connect', {
        method: 'POST',
        auth: true,
      });
      setWaState(res);
      toast.success('Iniciando sesión WhatsApp, escanea el QR');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error conectando WhatsApp');
    }
  };

  const handleDisconnectWa = async () => {
    try {
      const res = await apiFetch<WhatsAppState>('/api/whatsapp/disconnect', {
        method: 'POST',
        auth: true,
      });
      setWaState(res);
      toast.success('Sesión WhatsApp desconectada');
    } catch {
      toast.error('Error al desconectar WhatsApp');
    }
  };

  const handleSendBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await apiFetch<{ totalAttempted: number; sent: number; failed: number }>(
        `/api/events/${event.id}/dispatch`,
        {
          method: 'POST',
          auth: true,
          body: JSON.stringify({
            channel,
            onlyPending,
            subject,
            customMessage: message,
          }),
        }
      );
      toast.success(
        `Proceso finalizado: ${res.sent} enviado(s), ${res.failed} fallido(s) de ${res.totalAttempted}`
      );
      await loadLogs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al enviar invitaciones');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Estado Baileys WhatsApp QR */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-emerald-600" />
            <h3 className="font-semibold text-stone-900">Conexión WhatsApp (Baileys QR)</h3>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                waState.status === 'CONNECTED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : waState.status === 'QR_READY'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-stone-100 text-stone-700'
              }`}
            >
              {waState.status}
            </span>
          </div>
          <p className="text-xs text-stone-600">
            {waState.connectedPhone
              ? `Conectado con el número: +${waState.connectedPhone}`
              : 'Conecta tu WhatsApp escaneando el QR para enviar invitaciones automáticas en cola.'}
          </p>
          {waState.lastError && <p className="text-xs text-rose-600">{waState.lastError}</p>}

          <div className="flex gap-2 pt-1">
            {waState.status !== 'CONNECTED' ? (
              <button
                type="button"
                onClick={handleConnectWa}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                <QrCode className="h-3.5 w-3.5" />
                Generar QR de WhatsApp
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDisconnectWa}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
              >
                <Power className="h-3.5 w-3.5" />
                Desconectar Sesión
              </button>
            )}
          </div>
        </div>

        {waState.qrDataUrl && (
          <div className="border border-stone-200 rounded-2xl p-3 bg-stone-50 text-center">
            <img src={waState.qrDataUrl} alt="QR WhatsApp" className="w-44 h-44 mx-auto" />
            <p className="text-[11px] text-stone-500 mt-1">Escanea desde WhatsApp &gt; Dispositivos vinculados</p>
          </div>
        )}
      </div>

      {/* Formulario de Despacho Masivo / Recordatorio */}
      <form onSubmit={handleSendBatch} className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
        <h3 className="font-semibold text-stone-900">Enviar Invitaciones y Recordatorios</h3>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setChannel('WHATSAPP')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold border ${
              channel === 'WHATSAPP'
                ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                : 'border-stone-200 text-stone-600'
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp Automático
          </button>
          <button
            type="button"
            onClick={() => setChannel('EMAIL')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold border ${
              channel === 'EMAIL'
                ? 'border-amber-600 bg-amber-50 text-amber-800'
                : 'border-stone-200 text-stone-600'
            }`}
          >
            <Mail className="h-4 w-4" />
            Correo Gmail (SMTP + .ics)
          </button>
        </div>

        {channel === 'EMAIL' && (
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Asunto del Correo</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">
            Plantilla del mensaje (variables: {'{nombre}'}, {'{cupos}'}, {'{link}'}, {'{novios}'}, {'{fecha}'})
          </label>
          <textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-xl border border-stone-300 p-3 text-sm"
          />
        </div>

        <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
          <input
            type="checkbox"
            checked={onlyPending}
            onChange={(e) => setOnlyPending(e.target.checked)}
          />
          Enviar solo a invitados en estado Pendiente o Visto ({guests.filter((g) => g.rsvpStatus === 'PENDING' || g.rsvpStatus === 'VIEWED').length} grupos)
        </label>

        <button
          type="submit"
          disabled={sending}
          className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-stone-800 disabled:opacity-60"
        >
          <Send className="h-3.5 w-3.5" />
          {sending ? 'Enviando lote...' : `Enviar por ${channel === 'WHATSAPP' ? 'WhatsApp' : 'Gmail'}`}
        </button>
      </form>

      {/* Historial de envíos */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 font-semibold text-sm text-stone-900">
          Historial de Envíos ({logs.length})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600">
              <tr>
                <th className="px-4 py-3">Grupo</th>
                <th className="px-4 py-3">Canal</th>
                <th className="px-4 py-3">Destino</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-3 font-medium text-stone-900">{l.groupName}</td>
                  <td className="px-4 py-3">{l.channel}</td>
                  <td className="px-4 py-3">{l.recipient}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 font-semibold ${
                        l.status === 'SENT'
                          ? 'bg-emerald-100 text-emerald-700'
                          : l.status === 'FAILED'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {l.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-500">{l.errorMessage || 'OK'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
