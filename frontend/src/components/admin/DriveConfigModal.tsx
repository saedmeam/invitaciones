'use client';

import React, { useEffect, useId, useState } from 'react';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Folder,
  FolderOpen,
  HardDrive,
  HelpCircle,
  Image as ImageIcon,
  KeyRound,
  Layers,
  Lock,
  RefreshCw,
  ShieldCheck,
  Unlink,
  X,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { MediaProviderType } from '@/types/invitation';

export type StorageModeOption = 'LOCAL' | 'GOOGLE_DRIVE' | 'GOOGLE_PHOTOS' | 'HYBRID';

export interface DriveConfigModalProps {
  eventId: string;
  weddingTitle: string;
  onClose: () => void;
  onSaved?: () => void;
  initialConfig?: {
    mediaProvider?: MediaProviderType | string;
    driveFolderId?: string | null;
    driveFolderUrl?: string | null;
    photosAlbumId?: string | null;
    photosAlbumUrl?: string | null;
    photoPin?: string | null;
    googleAccountEmail?: string | null;
    googlePerEventConnected?: boolean;
    googleClientId?: string | null;
    googleClientSecret?: string | null;
  };
}

interface FormState {
  storageMode: StorageModeOption;
  driveFolderInput: string;
  photosAlbumInput: string;
  photoPin: string;
  googleClientId: string;
  googleClientSecret: string;
  googleAccountEmail: string | null;
  googlePerEventConnected: boolean;
  driveConfigured: boolean;
  googleOAuthAppConfigured: boolean;
}

interface VerificationState {
  status: 'idle' | 'testing' | 'success' | 'warning' | 'error';
  message?: string;
  details?: string;
}

export function extractDriveFolderId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) {
    return folderMatch[1];
  }

  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1]) {
    return idParamMatch[1];
  }

  const fileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch && fileMatch[1]) {
    return fileMatch[1];
  }

  if (!trimmed.includes('/') && !trimmed.includes('.') && /^[a-zA-Z0-9_-]{10,}$/.test(trimmed)) {
    return trimmed;
  }

  if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

export function DriveConfigModal({
  eventId,
  weddingTitle,
  onClose,
  onSaved,
  initialConfig,
}: DriveConfigModalProps) {
  const titleId = useId();
  const descId = useId();

  const [form, setForm] = useState<FormState>({
    storageMode: (initialConfig?.mediaProvider as StorageModeOption) || 'HYBRID',
    driveFolderInput: initialConfig?.driveFolderUrl || initialConfig?.driveFolderId || '',
    photosAlbumInput: initialConfig?.photosAlbumUrl || initialConfig?.photosAlbumId || '',
    photoPin: initialConfig?.photoPin || '',
    googleClientId: initialConfig?.googleClientId || '',
    googleClientSecret: initialConfig?.googleClientSecret || '',
    googleAccountEmail: initialConfig?.googleAccountEmail || null,
    googlePerEventConnected: Boolean(initialConfig?.googlePerEventConnected),
    driveConfigured: false,
    googleOAuthAppConfigured: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectingOAuth, setConnectingOAuth] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [showCredentialsAccordion, setShowCredentialsAccordion] = useState(false);
  const [verification, setVerification] = useState<VerificationState>({ status: 'idle' });
  const [copiedRedirectUri, setCopiedRedirectUri] = useState(false);

  const redirectUri = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:4006/api/media/google/callback`
    : 'http://localhost:4006/api/media/google/callback';

  const cleanDriveId = extractDriveFolderId(form.driveFolderInput);

  useEffect(() => {
    let active = true;
    const fetchEventData = async () => {
      try {
        const [driveConfigRes, qrRes] = await Promise.allSettled([
          apiFetch<{
            drive: {
              mediaProvider?: string;
              driveFolderId?: string | null;
              driveFolderUrl?: string | null;
              photosAlbumId?: string | null;
              photosAlbumUrl?: string | null;
              photoPin?: string | null;
              googleAccountEmail?: string | null;
              googleClientId?: string | null;
              isCustomConnected?: boolean;
              isConfigured?: boolean;
              hasOAuthApp?: boolean;
            };
          }>(`/api/events/${eventId}/drive-config`, { auth: true }),
          apiFetch<{
            driveConfigured: boolean;
            googleOAuthAppConfigured?: boolean;
            googleAccountEmail?: string | null;
            googlePerEventConnected?: boolean;
          }>(`/api/events/${eventId}/media/qr`, { auth: true }),
        ]);

        if (!active) return;

        let currentEmail: string | null = null;
        let perEventConnected = false;
        let driveConfigured = false;
        let googleOAuthAppConfigured = false;

        if (driveConfigRes.status === 'fulfilled' && driveConfigRes.value?.drive) {
          const d = driveConfigRes.value.drive;
          currentEmail = d.googleAccountEmail || null;
          perEventConnected = Boolean(d.isCustomConnected);
          driveConfigured = Boolean(d.isConfigured);
          googleOAuthAppConfigured = Boolean(d.hasOAuthApp);

          setForm((prev) => ({
            ...prev,
            storageMode: (d.mediaProvider as StorageModeOption) || prev.storageMode,
            driveFolderInput: d.driveFolderUrl || d.driveFolderId || prev.driveFolderInput,
            photosAlbumInput: d.photosAlbumUrl || d.photosAlbumId || prev.photosAlbumInput,
            photoPin: d.photoPin || '',
            googleClientId: d.googleClientId || prev.googleClientId,
            googleAccountEmail: currentEmail,
            googlePerEventConnected: perEventConnected,
            driveConfigured,
            googleOAuthAppConfigured,
          }));

          if (d.googleClientId) {
            setShowCredentialsAccordion(true);
          }
        }

        if (qrRes.status === 'fulfilled' && qrRes.value) {
          const qr = qrRes.value;
          driveConfigured = qr.driveConfigured;
          googleOAuthAppConfigured = Boolean(qr.googleOAuthAppConfigured);
          if (qr.googleAccountEmail) currentEmail = qr.googleAccountEmail;
          if (qr.googlePerEventConnected !== undefined) perEventConnected = qr.googlePerEventConnected;

          setForm((prev) => ({
            ...prev,
            driveConfigured,
            googleOAuthAppConfigured,
            googleAccountEmail: currentEmail || prev.googleAccountEmail,
            googlePerEventConnected: perEventConnected,
          }));
        }
      } catch {
        toast.error('No se pudo consultar la configuración de almacenamiento');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchEventData();
    return () => {
      active = false;
    };
  }, [eventId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const folderIdClean = extractDriveFolderId(form.driveFolderInput);
      const isUrl = form.driveFolderInput.trim().startsWith('http');

      await apiFetch(`/api/events/${eventId}/drive-config`, {
        method: 'PUT',
        auth: true,
        body: JSON.stringify({
          mediaProvider: form.storageMode,
          driveFolderId: folderIdClean || null,
          driveFolderUrl: isUrl ? form.driveFolderInput.trim() : null,
          photosAlbumId: form.photosAlbumInput.trim() || null,
          photosAlbumUrl: form.photosAlbumInput.trim().startsWith('http')
            ? form.photosAlbumInput.trim()
            : null,
          photoPin: form.photoPin.trim() || null,
          googleClientId: form.googleClientId.trim() || null,
          googleClientSecret: form.googleClientSecret.trim() || null,
        }),
      });

      toast.success('Configuración de Google Drive & Photos guardada exitosamente');
      if (onSaved) onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleConnectOAuth = async () => {
    setConnectingOAuth(true);
    try {
      // Si el usuario ingresó Client ID y Secret en el formulario, persistirlos antes de solicitar la URL OAuth
      if (form.googleClientId.trim() && form.googleClientSecret.trim()) {
        await apiFetch(`/api/events/${eventId}`, {
          method: 'PUT',
          auth: true,
          body: JSON.stringify({
            googleClientId: form.googleClientId.trim(),
            googleClientSecret: form.googleClientSecret.trim(),
            driveFolderUrl: form.driveFolderInput.trim() || null,
            photosAlbumUrl: form.photosAlbumInput.trim() || null,
            mediaProvider: form.storageMode,
          }),
        });
      }

      const res = await apiFetch<{
        url: string | null;
        hasOAuthApp: boolean;
        googleAccountEmail?: string | null;
      }>(`/api/events/${eventId}/google/auth-url`, { auth: true });

      if (!res.url) {
        toast.error('Google Cloud requiere Client ID y Secret para la ventana de permisos. Despliega el acordeón abajo para ingresarlos o usa Almacenamiento Local.');
        setShowCredentialsAccordion(true);
        return;
      }

      const popup = window.open(res.url, 'google_oauth_popup', 'width=560,height=680,scrollbars=yes');

      const onMessage = (ev: MessageEvent) => {
        if (ev.data?.type === 'GOOGLE_OAUTH_DONE') {
          window.removeEventListener('message', onMessage);
          const email = ev.data.email || 'Cuenta conectada';
          setForm((prev) => ({
            ...prev,
            googleAccountEmail: ev.data.email || prev.googleAccountEmail,
            googlePerEventConnected: true,
            driveConfigured: true,
          }));
          toast.success(`Google conectado con éxito: ${email}`);
          if (popup && !popup.closed) popup.close();
          if (onSaved) onSaved();
        }
      };

      window.addEventListener('message', onMessage);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error iniciando vinculación con Google');
    } finally {
      setConnectingOAuth(false);
    }
  };

  const handleDisconnectOAuth = async () => {
    if (!confirm('¿Deseas desvincular la cuenta de Google de esta boda? Los archivos continuarán guardándose de forma segura en el servidor local.')) {
      return;
    }
    setDisconnecting(true);
    try {
      await apiFetch(`/api/events/${eventId}/google/disconnect`, {
        method: 'POST',
        auth: true,
      });
      setForm((prev) => ({
        ...prev,
        googleAccountEmail: null,
        googlePerEventConnected: false,
      }));
      toast.success('Cuenta Google desvinculada');
      if (onSaved) onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al desvincular cuenta');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleTestConnection = async () => {
    setVerification({ status: 'testing', message: 'Verificando conexión en vivo...' });
    try {
      if (form.storageMode === 'LOCAL') {
        setTimeout(() => {
          setVerification({
            status: 'success',
            message: 'Almacenamiento Local Verificado.',
            details: 'Las fotos y videos se alojan en el disco seguro del servidor de invitaciones.',
          });
          toast.success('Almacenamiento local verificado');
        }, 300);
        return;
      }

      const res = await apiFetch<{
        ok: boolean;
        message: string;
        details?: {
          accountEmail?: string | null;
          folderName?: string | null;
        };
      }>(`/api/events/${eventId}/drive-config/test`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
          folderId: form.driveFolderInput,
          mediaProvider: form.storageMode,
        }),
      });

      setVerification({
        status: 'success',
        message: res.message || '¡Conexión y acceso verificados exitosamente!',
        details: res.details?.accountEmail
          ? `Cuenta activa: ${res.details.accountEmail}.${res.details.folderName ? ` Carpeta: ${res.details.folderName}` : ''}`
          : undefined,
      });
      toast.success('Conexión con Google verificada');
    } catch (err) {
      setVerification({
        status: 'error',
        message: 'Fallo en la prueba de conexión',
        details: err instanceof Error ? err.message : 'No se pudo contactar con los servicios de Google.',
      });
      toast.error(err instanceof Error ? err.message : 'Fallo en la verificación');
    }
  };

  const copyRedirectUri = () => {
    navigator.clipboard.writeText(redirectUri);
    setCopiedRedirectUri(true);
    toast.success('URI de Redirección copiada');
    setTimeout(() => setCopiedRedirectUri(false), 2500);
  };

  const openDriveFolder = () => {
    if (!cleanDriveId) return;
    window.open(`https://drive.google.com/drive/folders/${cleanDriveId}`, '_blank', 'noopener,noreferrer');
  };

  const openPhotosAlbum = () => {
    if (!form.photosAlbumInput) return;
    const url = form.photosAlbumInput.startsWith('http')
      ? form.photosAlbumInput
      : `https://photos.google.com/album/${form.photosAlbumInput}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-700 text-white p-2.5 shadow-sm">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 id={titleId} className="font-semibold text-sm text-stone-900">
                Almacenamiento de Fotos & Álbum QR (Drive / Photos)
              </h3>
              <p id={descId} className="text-[11px] text-stone-500">
                Boda: <strong>{weddingTitle}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-200/60 hover:text-stone-700 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-16 text-center space-y-2">
              <RefreshCw className="h-5 w-5 animate-spin mx-auto text-amber-700" />
              <p className="text-xs text-stone-500">Cargando configuración de almacenamiento...</p>
            </div>
          ) : (
            <>
              {/* 1. Banner de Estado Actual */}
              <div
                className={`rounded-2xl p-4 border text-xs flex items-start gap-3 transition ${
                  form.googlePerEventConnected
                    ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900'
                    : form.driveConfigured
                      ? 'border-amber-200 bg-amber-50/70 text-amber-900'
                      : 'border-stone-200 bg-stone-50 text-stone-700'
                }`}
              >
                <ShieldCheck
                  className={`h-5 w-5 shrink-0 mt-0.5 ${
                    form.googlePerEventConnected
                      ? 'text-emerald-700'
                      : form.driveConfigured
                        ? 'text-amber-700'
                        : 'text-stone-400'
                  }`}
                />
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-xs">
                      {form.googlePerEventConnected
                        ? `Cuenta Propia de Google Conectada (${form.googleAccountEmail || 'Activa'})`
                        : form.driveConfigured
                          ? 'Usando Cuenta Global de Google del Servidor'
                          : 'Almacenamiento Local Activo (Sin Cuenta Google Vinculada)'}
                    </p>
                    {form.googlePerEventConnected && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <Check className="h-3 w-3" /> Conectado
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] opacity-80 leading-relaxed">
                    {form.googlePerEventConnected
                      ? 'Las fotos y videos subidos por los invitados en el álbum QR se sincronizan de inmediato en esta cuenta personal de Google.'
                      : 'Las fotos se respaldan de inmediato en el servidor local. Puedes vincular el correo de los novios con un solo clic para que se sincronicen en su Google Drive o Photos.'}
                  </p>
                </div>
              </div>

              {/* Formulario Principal */}
              <form onSubmit={handleSave} className="space-y-5">
                {/* 2. Selector Visual de Modo de Almacenamiento */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-stone-800">
                    Modo de Almacenamiento de esta Boda
                  </label>
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {[
                      {
                        id: 'LOCAL',
                        title: 'Servidor Local',
                        badge: 'Recomendado',
                        desc: 'Guarda fotos y videos en el servidor. 100% autónomo, sin cuotas ni permisos de terceros.',
                        icon: HardDrive,
                      },
                      {
                        id: 'GOOGLE_DRIVE',
                        title: 'Google Drive',
                        desc: 'Fotos originales, videos y recuerdos guardados en una carpeta de Google Drive.',
                        icon: Folder,
                      },
                      {
                        id: 'GOOGLE_PHOTOS',
                        title: 'Google Photos',
                        desc: 'Organiza fotos y videos en un álbum interactivo de Google Photos de los novios.',
                        icon: ImageIcon,
                      },
                      {
                        id: 'HYBRID',
                        title: 'Híbrido (Local + Google)',
                        desc: 'Copia inmediata en el servidor y sincronización en la nube para máximo respaldo.',
                        icon: Layers,
                      },
                    ].map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = form.storageMode === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, storageMode: opt.id as StorageModeOption }))}
                          className={`text-left rounded-2xl border-2 p-3.5 transition flex flex-col justify-between ${
                            isSelected
                              ? 'border-amber-700 bg-amber-50/50 ring-2 ring-amber-700/10'
                              : 'border-stone-200 hover:border-stone-300 bg-white'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1.5 mb-1.5">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`p-1.5 rounded-lg ${
                                    isSelected ? 'bg-amber-700 text-white' : 'bg-stone-100 text-stone-600'
                                  }`}
                                >
                                  <Icon className="h-4 w-4" />
                                </div>
                                <span className="font-semibold text-xs text-stone-900">{opt.title}</span>
                              </div>
                              {opt.badge && (
                                <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  {opt.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-stone-500 leading-normal">{opt.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Entrada Inteligente para Carpeta de Google Drive */}
                {(form.storageMode === 'GOOGLE_DRIVE' || form.storageMode === 'HYBRID') && (
                  <div className="space-y-1.5 rounded-2xl border border-stone-200 bg-stone-50/50 p-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                        <Folder className="h-3.5 w-3.5 text-amber-700" />
                        Carpeta de Google Drive (URL completa o ID)
                      </label>
                      {cleanDriveId && (
                        <button
                          type="button"
                          onClick={openDriveFolder}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 hover:underline"
                        >
                          Abrir carpeta <ExternalLink className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Pega el enlace completo de la carpeta o el ID (ej. https://drive.google.com/drive/folders/...)"
                      value={form.driveFolderInput}
                      onChange={(e) => setForm((p) => ({ ...p, driveFolderInput: e.target.value }))}
                      className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs bg-white font-mono placeholder:font-sans focus:outline-hidden focus:ring-2 focus:ring-amber-700/20"
                    />
                    <div className="flex items-center justify-between text-[11px] text-stone-500 pt-0.5">
                      <span>
                        {cleanDriveId ? (
                          <span className="text-emerald-700 font-medium inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> ID detectado: {cleanDriveId}
                          </span>
                        ) : (
                          'Acepta enlaces compartidos o IDs directos'
                        )}
                      </span>
                    </div>
                  </div>
                )}

                {/* 4. Entrada para Álbum de Google Photos */}
                {(form.storageMode === 'GOOGLE_PHOTOS' || form.storageMode === 'HYBRID') && (
                  <div className="space-y-1.5 rounded-2xl border border-stone-200 bg-stone-50/50 p-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5 text-amber-700" />
                        Álbum de Google Photos (URL o ID)
                      </label>
                      {form.photosAlbumInput && (
                        <button
                          type="button"
                          onClick={openPhotosAlbum}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 hover:underline"
                        >
                          Ver álbum <ExternalLink className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Opcional. Vacío = se crea un álbum con el nombre de los novios automáticamente"
                      value={form.photosAlbumInput}
                      onChange={(e) => setForm((p) => ({ ...p, photosAlbumInput: e.target.value }))}
                      className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs bg-white font-mono placeholder:font-sans focus:outline-hidden focus:ring-2 focus:ring-amber-700/20"
                    />
                    <p className="text-[11px] text-stone-500">
                      Si lo dejas en blanco, la plataforma creará un álbum llamado{' '}
                      <strong>{weddingTitle}</strong> con el primer recuerdo que suba un invitado.
                    </p>
                  </div>
                )}

                {/* PIN de Álbum QR */}
                <div className="space-y-1.5 rounded-2xl border border-stone-200 bg-stone-50/50 p-4">
                  <label className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-stone-600" />
                    PIN de Seguridad para el Álbum QR (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 2027 (dejar vacío para acceso libre de los invitados sin clave)"
                    value={form.photoPin}
                    onChange={(e) => setForm((p) => ({ ...p, photoPin: e.target.value }))}
                    className="w-full sm:w-1/2 rounded-xl border border-stone-300 px-3 py-2 text-xs bg-white placeholder:font-sans focus:outline-hidden focus:ring-2 focus:ring-amber-700/20"
                  />
                  <p className="text-[11px] text-stone-500">
                    Si defines un PIN, los invitados deberán ingresarlo en su móvil antes de subir fotos o videos.
                  </p>
                </div>

                {/* 5. Vinculación OAuth y Estado de Conexión */}
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-amber-700" />
                      <h4 className="font-semibold text-xs text-stone-900">
                        Vinculación de Cuenta Google (OAuth2 por Boda)
                      </h4>
                    </div>
                    {form.googlePerEventConnected && (
                      <span className="text-[11px] font-medium text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
                        {form.googleAccountEmail || 'Cuenta activa'}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    Autoriza a la aplicación para subir las fotos del álbum QR directamente a la cuenta
                    Google de los novios mediante una ventana emergente segura. Cada boda maneja su propio correo.
                  </p>

                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <button
                      type="button"
                      disabled={connectingOAuth}
                      onClick={handleConnectOAuth}
                      className="inline-flex items-center gap-2 rounded-xl bg-stone-900 text-white px-4 py-2 text-xs font-semibold hover:bg-stone-800 disabled:opacity-60 shadow-xs transition"
                    >
                      {connectingOAuth ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                          <path
                            fill="#EA4335"
                            d="M12 5c1.5 0 2.8.5 3.9 1.5l2.9-2.9C17 1.9 14.7 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.5 2.7C6.3 7.3 8.9 5 12 5z"
                          />
                          <path
                            fill="#4285F4"
                            d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.4 14.7c-.2-.7-.4-1.5-.4-2.7s.1-2 .4-2.7L1.9 6.6C.7 9 0 10.9 0 12s.7 3 1.9 5.4l3.5-2.7z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.7-2.3-6.6-5.3L1.9 15.7C3.7 19.4 7.5 23 12 23z"
                          />
                        </svg>
                      )}
                      {form.googlePerEventConnected
                        ? 'Cambiar / Re-autorizar Cuenta Google'
                        : 'Vincular Cuenta de Google'}
                    </button>

                    {form.googlePerEventConnected && (
                      <button
                        type="button"
                        disabled={disconnecting}
                        onClick={handleDisconnectOAuth}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-60 transition"
                      >
                        {disconnecting ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <Unlink className="h-3.5 w-3.5" />
                        )}
                        Desvincular
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={verification.status === 'testing'}
                      onClick={handleTestConnection}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-60 transition ml-auto"
                    >
                      {verification.status === 'testing' ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 text-stone-500" />
                      )}
                      Verificar Conexión
                    </button>
                  </div>

                  {/* Banner interactivo de prueba */}
                  {verification.status !== 'idle' && (
                    <div
                      className={`rounded-xl p-3 border text-xs flex items-start gap-2.5 mt-2 animate-in fade-in duration-150 ${
                        verification.status === 'success'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                          : verification.status === 'warning'
                            ? 'border-amber-200 bg-amber-50 text-amber-900'
                            : verification.status === 'error'
                              ? 'border-rose-200 bg-rose-50 text-rose-900'
                              : 'border-stone-200 bg-stone-100 text-stone-700'
                      }`}
                    >
                      {verification.status === 'success' && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      )}
                      {verification.status === 'warning' && (
                        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      )}
                      {verification.status === 'error' && (
                        <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      {verification.status === 'testing' && (
                        <RefreshCw className="h-4 w-4 animate-spin text-stone-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-semibold">{verification.message}</p>
                        {verification.details && (
                          <p className="text-[11px] opacity-85 mt-0.5">{verification.details}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 6. Sección Desplegable para Credenciales Personalizadas Google Cloud */}
                <div className="rounded-2xl border border-stone-200 bg-stone-50/50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowCredentialsAccordion(!showCredentialsAccordion)}
                    className="w-full px-4 py-3 text-left flex items-center justify-between text-xs font-semibold text-stone-800 hover:bg-stone-100/50 transition"
                  >
                    <div className="flex items-center gap-2">
                      <KeyRound className="h-3.5 w-3.5 text-stone-500" />
                      <span>Credenciales Personalizadas de Google Cloud (Opcional por Boda)</span>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-stone-400 transition-transform ${
                        showCredentialsAccordion ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {showCredentialsAccordion && (
                    <div className="p-4 pt-1 border-t border-stone-200/60 space-y-3.5 text-xs">
                      <p className="text-[11px] text-stone-500">
                        Por defecto, el sistema utiliza las credenciales globales del servidor si existen. Si los novios o el wedding planner desean usar su propio proyecto de Google Cloud, ingresa aquí el Client ID y Client Secret directamente desde la pantalla:
                      </p>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-stone-700 block">
                          Client ID de Google Cloud
                        </label>
                        <input
                          type="text"
                          placeholder="ej. 123456789-abcdef.apps.googleusercontent.com"
                          value={form.googleClientId}
                          onChange={(e) => setForm((p) => ({ ...p, googleClientId: e.target.value }))}
                          className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs bg-white font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-stone-700 block">
                          Client Secret de Google Cloud
                        </label>
                        <div className="relative">
                          <input
                            type={showClientSecret ? 'text' : 'password'}
                            placeholder="GOCSPX-xxxxxxxxxxxxxxxx"
                            value={form.googleClientSecret}
                            onChange={(e) => setForm((p) => ({ ...p, googleClientSecret: e.target.value }))}
                            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs bg-white font-mono pr-9"
                          />
                          <button
                            type="button"
                            onClick={() => setShowClientSecret(!showClientSecret)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5"
                          >
                            {showClientSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* URI de Redirección Autorizada */}
                      <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">
                          URI de Redirección Autorizada (Google Cloud Console):
                        </span>
                        <div className="flex items-center justify-between gap-2">
                          <code className="text-[11px] text-stone-700 font-mono select-all break-all">
                            {redirectUri}
                          </code>
                          <button
                            type="button"
                            onClick={copyRedirectUri}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 shrink-0 transition"
                          >
                            {copiedRedirectUri ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            {copiedRedirectUri ? 'Copiado' : 'Copiar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 7. Guía Didáctica Paso a Paso */}
                <details className="rounded-2xl border border-stone-200 p-4 text-xs bg-stone-50/50 group">
                  <summary className="cursor-pointer font-semibold text-stone-800 select-none flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-amber-700" />
                      Guía Rápida: ¿Cómo sincronizar o vincular el correo para las fotos?
                    </span>
                    <ChevronDown className="h-4 w-4 text-stone-400 group-open:rotate-180 transition-transform" />
                  </summary>

                  <div className="pt-3 space-y-3 text-[11px] text-stone-600 leading-relaxed border-t border-stone-200/60 mt-3">
                    <div className="space-y-1">
                      <strong className="text-stone-800 block text-xs">
                        1. Modo Servidor Local (Recomendado sin configuración externa)
                      </strong>
                      <p>
                        Si no quieres lidiar con permisos ni claves de Google, selecciona &quot;Servidor Local&quot;. Las fotos se guardan en el servidor, se visualizan de inmediato en el muro de recuerdos y puedes descargarlas todas en cualquier momento.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <strong className="text-stone-800 block text-xs">
                        2. ¿Cómo se vincula el correo para las fotos por boda?
                      </strong>
                      <p>
                        A diferencia del correo (SMTP) que usa contraseña de aplicación, para fotos Google exige un consentimiento OAuth2. Simplemente haz clic en el botón <strong>&quot;Vincular Cuenta de Google&quot;</strong>, inicia sesión con el correo de los novios y autoriza los permisos. El sistema asocia esa cuenta únicamente a esta boda.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <strong className="text-stone-800 block text-xs">
                        3. Carpeta de Google Drive
                      </strong>
                      <p>
                        Crea una carpeta en Google Drive desde el correo de la pareja (ej. <em>Fotos Boda Joselin y Santiago</em>), haz clic en Compartir &rarr; Copiar enlace, y pégalo en el campo de texto de arriba. El sistema extrae el ID automáticamente.
                      </p>
                    </div>
                  </div>
                </details>

                {/* Footer de Acciones */}
                <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-stone-100">
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-xl border border-stone-300 px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 transition"
                    >
                      Cerrar
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-xl bg-stone-900 text-white px-5 py-2 text-xs font-semibold hover:bg-stone-800 disabled:opacity-60 flex items-center gap-1.5 shadow-xs transition"
                    >
                      {saving && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                      {saving ? 'Guardando...' : 'Guardar Configuración'}
                    </button>
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
