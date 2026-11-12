'use client';

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Mail, RefreshCw, Send, ShieldCheck, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface EmailConfigModalProps {
  eventId: string;
  weddingTitle: string;
  onClose: () => void;
  onSaved?: () => void;
}

interface SmtpFormState {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  isCustomConfigured: boolean;
  isConfigured: boolean;
  usingGlobalFallback: boolean;
}

export function EmailConfigModal({
  eventId,
  weddingTitle,
  onClose,
  onSaved,
}: EmailConfigModalProps) {
  const [form, setForm] = useState<SmtpFormState>({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    user: '',
    pass: '',
    fromName: '',
    isCustomConfigured: false,
    isConfigured: false,
    usingGlobalFallback: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  useEffect(() => {
    let active = true;
    apiFetch<{ smtp: SmtpFormState }>(`/api/events/${eventId}/email-config`, { auth: true })
      .then((res) => {
        if (!active) return;
        setForm(res.smtp);
        setTestEmail(res.smtp.user || '');
      })
      .catch(() => {
        toast.error('No se pudo cargar la configuración de correo');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [eventId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiFetch<{ smtp: SmtpFormState }>(
        `/api/events/${eventId}/email-config`,
        {
          method: 'PUT',
          auth: true,
          body: JSON.stringify({
            host: form.host,
            port: Number(form.port),
            secure: form.secure,
            user: form.user,
            pass: form.pass,
            fromName: form.fromName,
          }),
        }
      );
      setForm((prev) => ({
        ...prev,
        ...res.smtp,
        pass: res.smtp.pass || prev.pass,
      }));
      toast.success('Configuración de correo guardada');
      if (onSaved) onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error guardando configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      toast.error('Ingresa un correo válido para la prueba');
      return;
    }
    setTesting(true);
    try {
      const res = await apiFetch<{ ok: boolean; message: string }>(
        `/api/events/${eventId}/email-config/test`,
        {
          method: 'POST',
          auth: true,
          body: JSON.stringify({ testEmail: testEmail.trim() }),
        }
      );
      toast.success(res.message || 'Correo de prueba enviado con éxito');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Error enviando correo de prueba. Revisa credenciales.'
      );
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-amber-700 text-white p-2">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-stone-900">
                Configuración de Correo (SMTP / Gmail)
              </h3>
              <p className="text-[11px] text-stone-500">
                Boda: <strong>{weddingTitle}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-stone-400 hover:bg-stone-200/60 hover:text-stone-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {loading ? (
            <div className="py-12 text-center text-xs text-stone-400">
              Cargando configuración...
            </div>
          ) : (
            <>
              {/* Estado actual */}
              <div
                className={`rounded-2xl p-4 border text-xs flex items-start gap-3 ${
                  form.isCustomConfigured
                    ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900'
                    : form.usingGlobalFallback
                      ? 'border-amber-200 bg-amber-50/70 text-amber-900'
                      : 'border-stone-200 bg-stone-50 text-stone-700'
                }`}
              >
                <ShieldCheck
                  className={`h-5 w-5 shrink-0 mt-0.5 ${
                    form.isCustomConfigured
                      ? 'text-emerald-700'
                      : form.usingGlobalFallback
                        ? 'text-amber-700'
                        : 'text-stone-400'
                  }`}
                />
                <div className="space-y-0.5">
                  <p className="font-semibold">
                    {form.isCustomConfigured
                      ? `Correo Propio Activo (${form.user})`
                      : form.usingGlobalFallback
                        ? 'Usando correo global del sistema (servidor)'
                        : 'Sin correo configurado aún'}
                  </p>
                  <p className="text-[11px] opacity-80 leading-relaxed">
                    {form.isCustomConfigured
                      ? 'Las invitaciones y recordatorios de esta boda saldrán con este remitente y nombre personalizado.'
                      : 'Puedes parametrizar aquí la cuenta de Gmail o servidor SMTP del cliente/novios para que las invitaciones salgan desde su propio correo.'}
                  </p>
                </div>
              </div>

              {/* Formulario */}
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="space-y-1">
                    <span className="text-xs font-medium text-stone-700">Nombre del Remitente</span>
                    <input
                      type="text"
                      placeholder="Ej. Joselin & Santiago"
                      value={form.fromName}
                      onChange={(e) => setForm((p) => ({ ...p, fromName: e.target.value }))}
                      className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-xs font-medium text-stone-700">
                      Correo Emisor (Gmail / SMTP) *
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="ejemplo@gmail.com"
                      value={form.user}
                      onChange={(e) => setForm((p) => ({ ...p, user: e.target.value }))}
                      className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
                    />
                  </label>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-medium text-stone-700">
                    Contraseña de Aplicación (Gmail / SMTP) *
                  </span>
                  <input
                    type="password"
                    required={!form.isCustomConfigured}
                    placeholder={form.isCustomConfigured ? '•••••••• (Dejar para conservar)' : '16 caracteres generados en Google'}
                    value={form.pass}
                    onChange={(e) => setForm((p) => ({ ...p, pass: e.target.value }))}
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs font-mono"
                  />
                  <p className="text-[11px] text-stone-500 leading-tight">
                    Para cuentas <strong>@gmail.com</strong>, genera una clave en:{' '}
                    <a
                      href="https://myaccount.google.com/apppasswords"
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-800 underline font-medium"
                    >
                      myaccount.google.com/apppasswords
                    </a>{' '}
                    (no uses tu contraseña habitual de Gmail).
                  </p>
                </div>

                {/* Parámetros avanzados del servidor */}
                <details className="rounded-xl border border-stone-200 p-3 text-xs bg-stone-50/50">
                  <summary className="cursor-pointer font-medium text-stone-700 select-none">
                    Parámetros Avanzados del Servidor (Opcional — Por defecto Gmail)
                  </summary>
                  <div className="grid sm:grid-cols-3 gap-2.5 pt-3">
                    <label className="space-y-1">
                      <span className="text-[11px] text-stone-600 block">Host SMTP</span>
                      <input
                        type="text"
                        value={form.host}
                        onChange={(e) => setForm((p) => ({ ...p, host: e.target.value }))}
                        placeholder="smtp.gmail.com"
                        className="w-full rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs bg-white"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[11px] text-stone-600 block">Puerto</span>
                      <input
                        type="number"
                        value={form.port}
                        onChange={(e) => setForm((p) => ({ ...p, port: Number(e.target.value) }))}
                        placeholder="465"
                        className="w-full rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs bg-white"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[11px] text-stone-600 block">Seguridad SSL/TLS</span>
                      <select
                        value={form.secure ? 'true' : 'false'}
                        onChange={(e) => setForm((p) => ({ ...p, secure: e.target.value === 'true' }))}
                        className="w-full rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs bg-white"
                      >
                        <option value="true">SSL / TLS (Puerto 465)</option>
                        <option value="false">STARTTLS (Puerto 587)</option>
                      </select>
                    </label>
                  </div>
                </details>

                <div className="flex justify-between items-center pt-2">
                  {form.isCustomConfigured && (
                    <button
                      type="button"
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          user: '',
                          pass: '',
                          fromName: '',
                          isCustomConfigured: false,
                        }))
                      }
                      className="text-xs text-rose-600 hover:underline"
                    >
                      Limpiar y volver a correo del sistema
                    </button>
                  )}
                  <div className="flex gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-xl border border-stone-300 px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50"
                    >
                      Cerrar
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-xl bg-stone-900 text-white px-5 py-2 text-xs font-semibold hover:bg-stone-800 disabled:opacity-60 flex items-center gap-1.5"
                    >
                      {saving && <RefreshCw className="h-3 w-3 animate-spin" />}
                      {saving ? 'Guardando...' : 'Guardar Configuración'}
                    </button>
                  </div>
                </div>
              </form>

              {/* Prueba de envío en vivo */}
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4 text-amber-700" />
                  <h4 className="font-semibold text-xs text-stone-900">
                    Probar Conexión y Envío de Correo
                  </h4>
                </div>
                <p className="text-[11px] text-stone-500">
                  Envía un correo de prueba con el formato de la invitación para confirmar que tu
                  servidor o cuenta de Gmail funciona correctamente antes del envío masivo.
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="tucorreo@ejemplo.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="flex-1 rounded-xl border border-stone-300 px-3 py-2 text-xs bg-white"
                  />
                  <button
                    type="button"
                    disabled={testing}
                    onClick={handleSendTest}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-700 text-white px-4 py-2 text-xs font-semibold hover:bg-amber-800 disabled:opacity-60 shrink-0"
                  >
                    {testing ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    {testing ? 'Enviando...' : 'Enviar Prueba'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
