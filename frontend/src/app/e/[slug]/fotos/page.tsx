'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, Camera, FileText, Film, Lock, UploadCloud } from 'lucide-react';
import { API_BASE_URL, apiFetch } from '@/lib/api';
import { THEME_REGISTRY } from '@/lib/themes';
import { MediaAsset, WeddingEvent } from '@/types/invitation';

export default function EventPhotoUploadPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug || '';

  const [event, setEvent] = useState<WeddingEvent | null>(null);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [uploaderName, setUploaderName] = useState('');
  const [caption, setCaption] = useState('');
  const [pin, setPin] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const loadData = useCallback(async () => {
    if (!slug) return;
    try {
      const [evRes, mediaRes] = await Promise.all([
        apiFetch<{ event: WeddingEvent }>(`/api/public/events/${slug}`),
        apiFetch<{ media: MediaAsset[] }>(`/api/public/events/${slug}/media`),
      ]);
      setEvent(evRes.event);
      setMedia(mediaRes.media);
    } catch {
      toast.error('No se pudo cargar el álbum del evento');
    }
  }, [slug]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      toast.error('Selecciona al menos una foto o video');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('uploaderName', uploaderName.trim() || 'Invitado');
      if (caption.trim()) formData.append('caption', caption.trim());
      if (pin.trim()) formData.append('pin', pin.trim());
      for (const file of selectedFiles) {
        formData.append('files', file);
      }

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE_URL}/api/public/events/${slug}/media/upload`);
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            setProgress(Math.round((ev.loaded / ev.total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            try {
              const errData = JSON.parse(xhr.responseText);
              reject(new Error(errData.error || 'Error al subir'));
            } catch {
              reject(new Error('Error al subir archivos'));
            }
          }
        };
        xhr.onerror = () => reject(new Error('Error de red al subir'));
        xhr.send(formData);
      });

      toast.success('¡Fotos/videos subidos al álbum con éxito!');
      setSelectedFiles([]);
      setCaption('');
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al subir');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  if (!event) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#faf7f2] p-6 text-stone-600">
        Cargando álbum del evento...
      </main>
    );
  }

  const theme = THEME_REGISTRY[event.theme] || THEME_REGISTRY.ROMANTIC_EDITORIAL;
  const isClassicPlan =
    event.organizationType !== 'PLANNER' && event.themeConfig?.planTier === 'CLASSIC';

  if (isClassicPlan) {
    return (
      <main className={`min-h-screen flex items-center justify-center ${theme.pageBg} ${theme.textPrimary} p-6`}>
        <div className={`max-w-md w-full rounded-3xl border ${theme.borderClass} ${theme.surfaceBg} p-8 text-center space-y-4 shadow-sm`}>
          <Camera className={`h-10 w-10 mx-auto ${theme.accentText}`} />
          <h1 className="font-serif text-2xl font-semibold">
            {event.partnerOneName} &amp; {event.partnerTwoName}
          </h1>
          <p className={`text-sm ${theme.textMuted}`}>
            El álbum colaborativo QR no está habilitado para este evento.
          </p>
          <Link
            href={`/e/${event.slug}`}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wider ${theme.buttonPrimary}`}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver a la invitación
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className={`min-h-screen ${theme.pageBg} ${theme.textPrimary} py-10 px-4`}>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link
            href={`/e/${event.slug}`}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium ${theme.buttonSecondary}`}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver a la invitación
          </Link>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${theme.badgeBg}`}>
            Álbum QR
          </span>
        </div>

        <div className={`rounded-3xl border ${theme.borderClass} ${theme.surfaceBg} p-6 sm:p-10 shadow-sm`}>
          <div className="text-center mb-6">
            <Camera className={`h-8 w-8 mx-auto mb-2 ${theme.accentText}`} />
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold">
              {event.partnerOneName} &amp; {event.partnerTwoName}
            </h1>
            <p className={`mt-2 text-sm ${theme.textMuted}`}>
              {event.contentConfig?.photoAlbumSubtitle ||
                'Comparte con nosotros tus mejores fotos y videos de este día tan especial'}
            </p>
          </div>

          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={uploaderName}
                onChange={(e) => setUploaderName(e.target.value)}
                placeholder="Tu nombre"
                required
                className={`rounded-xl border ${theme.borderClass} bg-transparent px-4 py-3 text-sm`}
              />
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Descripción o momento (opcional)"
                className={`rounded-xl border ${theme.borderClass} bg-transparent px-4 py-3 text-sm`}
              />
            </div>

            {event.requiresPhotoPin && (
              <div className="flex items-center gap-2">
                <Lock className={`h-4 w-4 ${theme.accentText}`} />
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="PIN del álbum"
                  required
                  className={`flex-1 rounded-xl border ${theme.borderClass} bg-transparent px-4 py-2.5 text-sm`}
                />
              </div>
            )}

            <label
              className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed ${theme.borderClass} ${theme.surfaceMutedBg} p-8 text-center cursor-pointer hover:opacity-90 transition`}
            >
              <UploadCloud className={`h-10 w-10 mb-2 ${theme.accentText}`} />
              <span className="font-medium text-sm">
                Toca aquí para elegir fotos o videos desde tu galería o cámara
              </span>
              <span className={`text-xs mt-1 ${theme.textMuted}`}>
                {event.mediaProvider === 'GOOGLE_PHOTOS'
                  ? 'Fotos y videos permitidos (múltiples archivos)'
                  : 'Fotos, videos y archivos permitidos (múltiples archivos)'}
              </span>
              <input
                type="file"
                multiple
                accept={event.mediaProvider === 'GOOGLE_PHOTOS' ? 'image/*,video/*' : '*/*'}
                onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
                className="hidden"
              />
            </label>

            {selectedFiles.length > 0 && (
              <div className={`rounded-2xl ${theme.surfaceMutedBg} p-4 text-xs space-y-1`}>
                <p className="font-semibold">
                  {selectedFiles.length} archivo(s) seleccionado(s):
                </p>
                {selectedFiles.map((f, i) => (
                  <p key={i} className={theme.textMuted}>
                    • {f.name} ({(f.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                ))}
              </div>
            )}

            {uploading && (
              <div className="space-y-1">
                <div className="h-2.5 w-full rounded-full bg-stone-200 overflow-hidden">
                  <div
                    className={`h-full transition-all ${theme.accentBg}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className={`text-xs text-right ${theme.textMuted}`}>Subiendo {progress}%</p>
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || selectedFiles.length === 0}
              className={`w-full rounded-full py-3.5 text-sm font-semibold transition disabled:opacity-60 ${theme.buttonPrimary}`}
            >
              {uploading ? 'Subiendo recuerdos...' : 'Subir al Álbum'}
            </button>
          </form>
        </div>

        {/* Galería en vivo */}
        <section className={`rounded-3xl border ${theme.borderClass} ${theme.surfaceBg} p-6 sm:p-8 shadow-sm`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-2xl font-semibold">Galería Compartida ({media.length})</h2>
          </div>
          {media.length === 0 ? (
            <p className={`text-sm ${theme.textMuted}`}>Aún no hay fotos ni videos en este álbum.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {media.map((item) => (
                <div key={item.id} className={`rounded-2xl border ${theme.borderClass} overflow-hidden`}>
                  {item.mediaType === 'VIDEO' ? (
                    <div className="relative">
                      <video
                        src={`${API_BASE_URL}/api/public/media/${item.id}/file`}
                        controls
                        className="h-48 w-full object-cover bg-black"
                      />
                      <span className="absolute top-2 right-2 rounded-full bg-black/70 text-white p-1.5">
                        <Film className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  ) : item.mediaType === 'OTHER' ? (
                    <a
                      href={`${API_BASE_URL}/api/public/media/${item.id}/file`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`h-48 w-full flex flex-col items-center justify-center gap-2 p-4 ${theme.surfaceMutedBg} text-center hover:opacity-90`}
                    >
                      <FileText className={`h-10 w-10 ${theme.accentText}`} />
                      <span className="text-xs font-medium break-all line-clamp-2">
                        {item.originalName}
                      </span>
                    </a>
                  ) : (
                    <img
                      src={`${API_BASE_URL}/api/public/media/${item.id}/file`}
                      alt={item.uploaderName}
                      className="h-48 w-full object-cover"
                    />
                  )}
                  <div className="p-3 text-xs">
                    <p className="font-semibold">{item.uploaderName}</p>
                    {item.caption && <p className={theme.textMuted}>{item.caption}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
