'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { KeyRound, ShieldAlert } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface ForcePasswordChangeModalProps {
  userName: string;
  userEmail: string;
  onPasswordChanged: (updatedUser: {
    id: string;
    name: string;
    email: string;
    role: string;
    mustChangePassword?: boolean;
  }) => void;
}

export function ForcePasswordChangeModal({
  userName,
  userEmail,
  onPasswordChanged,
}: ForcePasswordChangeModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Ingresa la contraseña actual recibida');
      return;
    }
    if (newPassword.trim().length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas nuevas no coinciden');
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch<{
        token?: string;
        user: {
          id: string;
          name: string;
          email: string;
          role: string;
          mustChangePassword?: boolean;
        };
      }>('/api/auth/me', {
        method: 'PUT',
        auth: true,
        body: JSON.stringify({
          currentPassword,
          newPassword: newPassword.trim(),
        }),
      });

      if (res.token && typeof window !== 'undefined') {
        localStorage.setItem('admin_token', res.token);
      }
      toast.success('¡Contraseña actualizada con éxito! Ya puedes usar tu panel.');
      onPasswordChanged(res.user);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error cambiando contraseña');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-amber-500/10 px-6 py-5 border-b border-amber-200/60 flex items-center gap-3">
          <div className="rounded-xl bg-amber-600 p-2 text-white shadow-xs">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-amber-950">
              Cambio de Contraseña Requerido
            </h3>
            <p className="text-[11px] text-amber-800">
              Por tu seguridad debes establecer tu contraseña personal antes de continuar.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="rounded-xl bg-stone-50 p-3 border border-stone-200 text-xs text-stone-600">
            <p>
              Usuario: <strong>{userName}</strong> ({userEmail})
            </p>
          </div>

          <label className="block space-y-1">
            <span className="text-xs font-medium text-stone-700">Contraseña temporal recibida</span>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Ingresa la clave recibida"
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-medium text-stone-700">Nueva contraseña (mínimo 6)</span>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-medium text-stone-700">Confirmar nueva contraseña</span>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-stone-900 text-white py-2.5 text-xs font-semibold hover:bg-stone-800 disabled:opacity-60 flex items-center justify-center gap-1.5 shadow-xs"
          >
            <KeyRound className="h-3.5 w-3.5" />
            {saving ? 'Actualizando contraseña...' : 'Guardar y Continuar'}
          </button>
        </form>
      </div>
    </div>
  );
}
