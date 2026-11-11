'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { ExternalLink, HardDrive, Palette, Plus, Save, Sliders, Trash2, Type } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { THEME_REGISTRY } from '@/lib/themes';
import {
  BankAccountItem,
  EventSectionsConfig,
  EventTheme,
  FaqItem,
  MediaProviderType,
  StoryItem,
  WeddingEvent,
} from '@/types/invitation';

interface AdminCustomizerTabProps {
  event: WeddingEvent;
  onUpdated: (ev: WeddingEvent) => void;
}

const SECTION_LABELS: Array<{ key: keyof EventSectionsConfig; label: string; desc: string }> = [
  { key: 'heroMusic', label: 'Música de fondo', desc: 'Botón reproductor flotante al abrir el sobre' },
  { key: 'countdown', label: 'Cuenta regresiva', desc: 'Contador en vivo de días, horas y minutos' },
  { key: 'storyGallery', label: 'Historia & Galería', desc: 'Línea de tiempo de la pareja y fotos' },
  { key: 'itinerary', label: 'Itinerario & Mapas', desc: 'Ceremonia, recepción, Google Maps y .ics' },
  { key: 'dressCode', label: 'Código de vestimenta', desc: 'Etiqueta, notas y paleta sugerida' },
  { key: 'giftRegistry', label: 'Mesa de regalos / Sobres', desc: 'Datos bancarios con copia rápida' },
  { key: 'wishesWall', label: 'Muro de buenos deseos', desc: 'Formulario y mensajes de invitados' },
  { key: 'photoWall', label: 'Álbum QR de fotos/videos', desc: 'Sección y enlace al cargador QR' },
  { key: 'faq', label: 'Preguntas frecuentes', desc: 'Acordeón de dudas comunes' },
];

export function AdminCustomizerTab({ event, onUpdated }: AdminCustomizerTabProps) {
  const c = event.contentConfig || {};
  const [form, setForm] = useState({
    title: event.title,
    partnerOneName: event.partnerOneName,
    partnerTwoName: event.partnerTwoName,
    eventDate: event.eventDate.slice(0, 16),
    rsvpDeadline: event.rsvpDeadline ? event.rsvpDeadline.slice(0, 16) : '',
    ceremonyTitle: event.ceremonyTitle,
    ceremonyTime: event.ceremonyTime,
    ceremonyAddress: event.ceremonyAddress,
    ceremonyMapUrl: event.ceremonyMapUrl,
    receptionTitle: event.receptionTitle,
    receptionTime: event.receptionTime,
    receptionAddress: event.receptionAddress,
    receptionMapUrl: event.receptionMapUrl,
    theme: event.theme,
    mediaProvider: (event.mediaProvider || 'HYBRID') as MediaProviderType,
    driveFolderId: event.driveFolderId || '',
    photosAlbumId: event.photosAlbumId || '',
    photoPin: event.photoPin || '',
    isPrimary: Boolean(event.isPrimary),
    coverSubtitle: event.themeConfig.coverSubtitle || '',
    musicUrl: event.themeConfig.musicUrl || '',
    coverImageUrl: event.themeConfig.coverImageUrl || '',
    moderatePhotos: Boolean(event.themeConfig.moderatePhotos),
    moderateWishes: Boolean(event.themeConfig.moderateWishes),

    // Textos parametrizables de portada y secciones
    homeBadgeText: c.homeBadgeText || '¡Nos Casamos!',
    homeDescription:
      c.homeDescription ||
      'Con mucha alegría queremos compartir contigo el día más especial de nuestras vidas. Aquí encontrarás los detalles de la ceremonia, la celebración y nuestro álbum de recuerdos.',
    homeInviteLabel: c.homeInviteLabel || 'Ver Invitación',
    homePhotosLabel: c.homePhotosLabel || 'Álbum de Fotos',
    heroBadgeText: c.heroBadgeText || 'Nos Casamos',
    openEnvelopeLabel: c.openEnvelopeLabel || 'Abrir Invitación',
    countdownTitle: c.countdownTitle || 'Faltan para el gran día',
    welcomeText: c.welcomeText || '',
    storyEyebrow: c.storyEyebrow || 'Nuestro Camino',
    storyTitle: c.storyTitle || 'Nuestra Historia',
    itineraryEyebrow: c.itineraryEyebrow || 'Cuándo y Dónde',
    itineraryTitle: c.itineraryTitle || 'Itinerario del Evento',
    dressCodeEyebrow: c.dressCodeEyebrow || 'Vestimenta',
    dressCodeTitle: c.dressCodeTitle || '',
    dressCodeNote: c.dressCodeNote || '',
    giftTitle: c.giftTitle || '',
    giftDescription: c.giftDescription || '',
    rsvpEyebrow: c.rsvpEyebrow || 'RSVP',
    rsvpTitle: c.rsvpTitle || 'Confirma tu Asistencia',
    rsvpButtonLabel: c.rsvpButtonLabel || 'Guardar Confirmación',
    photoAlbumEyebrow: c.photoAlbumEyebrow || 'Álbum Colaborativo',
    photoAlbumTitle: c.photoAlbumTitle || 'Comparte tus Fotos y Videos',
    photoAlbumSubtitle:
      c.photoAlbumSubtitle ||
      'Comparte con nosotros tus mejores fotos y videos de este día tan especial',
    wishesTitle: c.wishesTitle || 'Buenos Deseos',
    faqTitle: c.faqTitle || 'Preguntas Frecuentes',

    storyItems: (c.storyItems || []) as StoryItem[],
    bankAccounts: (c.bankAccounts || []) as BankAccountItem[],
    faqItems: (c.faqItems || []) as FaqItem[],
    sectionsConfig: { ...event.sectionsConfig },
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        partnerOneName: form.partnerOneName,
        partnerTwoName: form.partnerTwoName,
        eventDate: new Date(form.eventDate).toISOString(),
        rsvpDeadline: form.rsvpDeadline ? new Date(form.rsvpDeadline).toISOString() : null,
        ceremonyTitle: form.ceremonyTitle,
        ceremonyTime: form.ceremonyTime,
        ceremonyAddress: form.ceremonyAddress,
        ceremonyMapUrl: form.ceremonyMapUrl,
        receptionTitle: form.receptionTitle,
        receptionTime: form.receptionTime,
        receptionAddress: form.receptionAddress,
        receptionMapUrl: form.receptionMapUrl,
        theme: form.theme,
        mediaProvider: form.mediaProvider,
        driveFolderId: form.driveFolderId || null,
        photosAlbumId: form.photosAlbumId || null,
        photoPin: form.photoPin || null,
        isPrimary: form.isPrimary,
        sectionsConfig: form.sectionsConfig,
        themeConfig: {
          ...event.themeConfig,
          coverSubtitle: form.coverSubtitle,
          musicUrl: form.musicUrl,
          coverImageUrl: form.coverImageUrl,
          moderatePhotos: form.moderatePhotos,
          moderateWishes: form.moderateWishes,
        },
        contentConfig: {
          ...event.contentConfig,
          homeBadgeText: form.homeBadgeText,
          homeDescription: form.homeDescription,
          homeInviteLabel: form.homeInviteLabel,
          homePhotosLabel: form.homePhotosLabel,
          heroBadgeText: form.heroBadgeText,
          openEnvelopeLabel: form.openEnvelopeLabel,
          countdownTitle: form.countdownTitle,
          welcomeText: form.welcomeText,
          storyEyebrow: form.storyEyebrow,
          storyTitle: form.storyTitle,
          itineraryEyebrow: form.itineraryEyebrow,
          itineraryTitle: form.itineraryTitle,
          dressCodeEyebrow: form.dressCodeEyebrow,
          dressCodeTitle: form.dressCodeTitle,
          dressCodeNote: form.dressCodeNote,
          giftTitle: form.giftTitle,
          giftDescription: form.giftDescription,
          rsvpEyebrow: form.rsvpEyebrow,
          rsvpTitle: form.rsvpTitle,
          rsvpButtonLabel: form.rsvpButtonLabel,
          photoAlbumEyebrow: form.photoAlbumEyebrow,
          photoAlbumTitle: form.photoAlbumTitle,
          photoAlbumSubtitle: form.photoAlbumSubtitle,
          wishesTitle: form.wishesTitle,
          faqTitle: form.faqTitle,
          storyItems: form.storyItems,
          bankAccounts: form.bankAccounts,
          faqItems: form.faqItems,
        },
      };

      const res = await apiFetch<{ event: WeddingEvent }>(`/api/events/${event.id}`, {
        method: 'PUT',
        auth: true,
        body: JSON.stringify(payload),
      });
      onUpdated(res.event);
      toast.success('Configuración y textos guardados');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-stone-200 p-4">
        <div>
          <h3 className="font-semibold text-stone-900">Parametrización Total del Evento</h3>
          <p className="text-xs text-stone-500">
            Personaliza estilo visual, secciones, nombres, fechas, textos y destino de almacenamiento.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/e/${event.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 px-3.5 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Vista previa
          </a>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800 disabled:opacity-60"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      {/* Selector de 3 Temas */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="h-4 w-4 text-amber-700" />
          <h4 className="font-semibold text-sm text-stone-900">Estilo Visual (Tema)</h4>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {(Object.keys(THEME_REGISTRY) as EventTheme[]).map((themeKey) => {
            const t = THEME_REGISTRY[themeKey];
            const selected = form.theme === themeKey;
            return (
              <button
                key={themeKey}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, theme: themeKey }))}
                className={`text-left rounded-2xl border-2 p-4 transition ${
                  selected ? 'border-amber-600 bg-amber-50/40' : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm text-stone-900">{t.label}</span>
                  <span className={`h-4 w-4 rounded-full ${t.accentBg}`} />
                </div>
                <p className="text-xs text-stone-600">{t.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Destino de Fotos / Videos / Archivos (Google Photos vs Drive vs Híbrido) */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-amber-700" />
          <h4 className="font-semibold text-sm text-stone-900">
            Destino de Carga QR (Google Photos / Google Drive)
          </h4>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {[
            {
              id: 'GOOGLE_PHOTOS',
              title: 'Google Photos',
              desc: 'Fotos y videos directo a un álbum en tu Google Photos.',
            },
            {
              id: 'GOOGLE_DRIVE',
              title: 'Google Drive',
              desc: 'Fotos, videos y cualquier tipo de archivo en una carpeta de Drive.',
            },
            {
              id: 'HYBRID',
              title: 'Híbrido (Photos + Drive)',
              desc: 'Fotos y videos van a Google Photos; otros archivos van a Google Drive.',
            },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() =>
                setForm((p) => ({ ...p, mediaProvider: opt.id as MediaProviderType }))
              }
              className={`text-left rounded-2xl border-2 p-4 transition ${
                form.mediaProvider === opt.id
                  ? 'border-amber-600 bg-amber-50/40'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <div className="font-semibold text-sm text-stone-900">{opt.title}</div>
              <p className="text-xs text-stone-600 mt-1">{opt.desc}</p>
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-3 gap-3 pt-2">
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">
              ID Álbum Google Photos (auto)
            </label>
            <input
              type="text"
              value={form.photosAlbumId}
              onChange={(e) => setForm((p) => ({ ...p, photosAlbumId: e.target.value }))}
              placeholder="Se crea automáticamente al subir"
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">
              ID Carpeta Google Drive (Opcional)
            </label>
            <input
              type="text"
              value={form.driveFolderId}
              onChange={(e) => setForm((p) => ({ ...p, driveFolderId: e.target.value }))}
              placeholder="Ej. 1AbCdeFGhIjK..."
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">
              PIN del Álbum QR (Opcional)
            </label>
            <input
              type="text"
              value={form.photoPin}
              onChange={(e) => setForm((p) => ({ ...p, photoPin: e.target.value }))}
              placeholder="Vacío = acceso libre"
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Toggles de Secciones */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sliders className="h-4 w-4 text-amber-700" />
          <h4 className="font-semibold text-sm text-stone-900">
            Secciones Visibles en la Invitación
          </h4>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SECTION_LABELS.map((item) => {
            const enabled = Boolean(form.sectionsConfig[item.key]);
            return (
              <label
                key={item.key}
                className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition ${
                  enabled ? 'border-emerald-300 bg-emerald-50/40' : 'border-stone-200 bg-stone-50/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      sectionsConfig: { ...prev.sectionsConfig, [item.key]: e.target.checked },
                    }))
                  }
                  className="mt-1 h-4 w-4 accent-emerald-600"
                />
                <div>
                  <div className="text-sm font-medium text-stone-900">{item.label}</div>
                  <div className="text-xs text-stone-500">{item.desc}</div>
                </div>
              </label>
            );
          })}
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-stone-100">
          <label className="flex items-center gap-2.5 text-xs text-stone-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isPrimary}
              onChange={(e) => setForm((p) => ({ ...p, isPrimary: e.target.checked }))}
            />
            Mostrar este evento en la portada principal (/)
          </label>
          <label className="flex items-center gap-2.5 text-xs text-stone-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.moderatePhotos}
              onChange={(e) => setForm((p) => ({ ...p, moderatePhotos: e.target.checked }))}
            />
            Moderar fotos/videos antes de mostrarlos en el muro
          </label>
          <label className="flex items-center gap-2.5 text-xs text-stone-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.moderateWishes}
              onChange={(e) => setForm((p) => ({ ...p, moderateWishes: e.target.checked }))}
            />
            Moderar buenos deseos antes de publicarlos
          </label>
        </div>
      </div>

      {/* Datos Principales & Ubicaciones */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Nombre Novia / Pareja 1</label>
          <input
            type="text"
            value={form.partnerOneName}
            onChange={(e) => setForm((p) => ({ ...p, partnerOneName: e.target.value }))}
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Nombre Novio / Pareja 2</label>
          <input
            type="text"
            value={form.partnerTwoName}
            onChange={(e) => setForm((p) => ({ ...p, partnerTwoName: e.target.value }))}
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Fecha y Hora del Evento</label>
          <input
            type="datetime-local"
            value={form.eventDate}
            onChange={(e) => setForm((p) => ({ ...p, eventDate: e.target.value }))}
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Fecha Límite RSVP</label>
          <input
            type="datetime-local"
            value={form.rsvpDeadline}
            onChange={(e) => setForm((p) => ({ ...p, rsvpDeadline: e.target.value }))}
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Ceremonia - Título y Hora</label>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              value={form.ceremonyTitle}
              onChange={(e) => setForm((p) => ({ ...p, ceremonyTitle: e.target.value }))}
              className="col-span-2 rounded-xl border border-stone-300 px-3 py-2 text-sm"
            />
            <input
              type="text"
              value={form.ceremonyTime}
              onChange={(e) => setForm((p) => ({ ...p, ceremonyTime: e.target.value }))}
              className="rounded-xl border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Recepción - Título y Hora</label>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              value={form.receptionTitle}
              onChange={(e) => setForm((p) => ({ ...p, receptionTitle: e.target.value }))}
              className="col-span-2 rounded-xl border border-stone-300 px-3 py-2 text-sm"
            />
            <input
              type="text"
              value={form.receptionTime}
              onChange={(e) => setForm((p) => ({ ...p, receptionTime: e.target.value }))}
              className="rounded-xl border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Ceremonia - Dirección</label>
          <input
            type="text"
            value={form.ceremonyAddress}
            onChange={(e) => setForm((p) => ({ ...p, ceremonyAddress: e.target.value }))}
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Ceremonia - Google Maps URL</label>
          <input
            type="url"
            value={form.ceremonyMapUrl}
            onChange={(e) => setForm((p) => ({ ...p, ceremonyMapUrl: e.target.value }))}
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Recepción - Dirección</label>
          <input
            type="text"
            value={form.receptionAddress}
            onChange={(e) => setForm((p) => ({ ...p, receptionAddress: e.target.value }))}
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Recepción - Google Maps URL</label>
          <input
            type="url"
            value={form.receptionMapUrl}
            onChange={(e) => setForm((p) => ({ ...p, receptionMapUrl: e.target.value }))}
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">URL Foto Portada (Opcional)</label>
          <input
            type="url"
            value={form.coverImageUrl}
            onChange={(e) => setForm((p) => ({ ...p, coverImageUrl: e.target.value }))}
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">URL Audio MP3 Fondo (Opcional)</label>
          <input
            type="url"
            value={form.musicUrl}
            onChange={(e) => setForm((p) => ({ ...p, musicUrl: e.target.value }))}
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Textos y Mensajes 100% Parametrizables */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Type className="h-4 w-4 text-amber-700" />
          <h4 className="font-semibold text-sm text-stone-900">
            Textos y Mensajes de la Portada e Invitación
          </h4>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Etiqueta Portada (/)</label>
            <input
              type="text"
              value={form.homeBadgeText}
              onChange={(e) => setForm((p) => ({ ...p, homeBadgeText: e.target.value }))}
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Botón Abrir Sobre</label>
            <input
              type="text"
              value={form.openEnvelopeLabel}
              onChange={(e) => setForm((p) => ({ ...p, openEnvelopeLabel: e.target.value }))}
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-stone-600 mb-1">
              Mensaje Portada Principal (/)
            </label>
            <textarea
              rows={2}
              value={form.homeDescription}
              onChange={(e) => setForm((p) => ({ ...p, homeDescription: e.target.value }))}
              className="w-full rounded-xl border border-stone-300 p-3 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Subtítulo Hero</label>
            <input
              type="text"
              value={form.coverSubtitle}
              onChange={(e) => setForm((p) => ({ ...p, coverSubtitle: e.target.value }))}
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Título Cuenta Regresiva</label>
            <input
              type="text"
              value={form.countdownTitle}
              onChange={(e) => setForm((p) => ({ ...p, countdownTitle: e.target.value }))}
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-stone-600 mb-1">
              Texto de Bienvenida en Invitación
            </label>
            <textarea
              rows={2}
              value={form.welcomeText}
              onChange={(e) => setForm((p) => ({ ...p, welcomeText: e.target.value }))}
              className="w-full rounded-xl border border-stone-300 p-3 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Código de Vestimenta - Título</label>
            <input
              type="text"
              value={form.dressCodeTitle}
              onChange={(e) => setForm((p) => ({ ...p, dressCodeTitle: e.target.value }))}
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Código de Vestimenta - Nota</label>
            <input
              type="text"
              value={form.dressCodeNote}
              onChange={(e) => setForm((p) => ({ ...p, dressCodeNote: e.target.value }))}
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Título Regalos / Sobres</label>
            <input
              type="text"
              value={form.giftTitle}
              onChange={(e) => setForm((p) => ({ ...p, giftTitle: e.target.value }))}
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Título Sección RSVP</label>
            <input
              type="text"
              value={form.rsvpTitle}
              onChange={(e) => setForm((p) => ({ ...p, rsvpTitle: e.target.value }))}
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-stone-600 mb-1">Descripción Mesa de Regalos</label>
            <textarea
              rows={2}
              value={form.giftDescription}
              onChange={(e) => setForm((p) => ({ ...p, giftDescription: e.target.value }))}
              className="w-full rounded-xl border border-stone-300 p-3 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Título Álbum QR</label>
            <input
              type="text"
              value={form.photoAlbumTitle}
              onChange={(e) => setForm((p) => ({ ...p, photoAlbumTitle: e.target.value }))}
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Subtítulo Página /fotos</label>
            <input
              type="text"
              value={form.photoAlbumSubtitle}
              onChange={(e) => setForm((p) => ({ ...p, photoAlbumSubtitle: e.target.value }))}
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Cuentas Bancarias Editables */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm text-stone-900">Cuentas Bancarias / Regalos</h4>
          <button
            type="button"
            onClick={() =>
              setForm((p) => ({
                ...p,
                bankAccounts: [
                  ...p.bankAccounts,
                  { bank: '', accountType: 'Ahorros', accountNumber: '', holder: '' },
                ],
              }))
            }
            className="inline-flex items-center gap-1 rounded-xl border border-stone-300 px-3 py-1.5 text-xs font-medium"
          >
            <Plus className="h-3.5 w-3.5" /> Agregar Cuenta
          </button>
        </div>
        {form.bankAccounts.map((acc, idx) => (
          <div key={idx} className="grid sm:grid-cols-5 gap-2 items-center">
            <input
              type="text"
              placeholder="Banco"
              value={acc.bank}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  bankAccounts: p.bankAccounts.map((a, i) =>
                    i === idx ? { ...a, bank: e.target.value } : a
                  ),
                }))
              }
              className="rounded-xl border border-stone-300 px-3 py-2 text-xs"
            />
            <input
              type="text"
              placeholder="Tipo (Ahorros/Corriente)"
              value={acc.accountType}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  bankAccounts: p.bankAccounts.map((a, i) =>
                    i === idx ? { ...a, accountType: e.target.value } : a
                  ),
                }))
              }
              className="rounded-xl border border-stone-300 px-3 py-2 text-xs"
            />
            <input
              type="text"
              placeholder="Número de cuenta"
              value={acc.accountNumber}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  bankAccounts: p.bankAccounts.map((a, i) =>
                    i === idx ? { ...a, accountNumber: e.target.value } : a
                  ),
                }))
              }
              className="rounded-xl border border-stone-300 px-3 py-2 text-xs"
            />
            <input
              type="text"
              placeholder="Titular"
              value={acc.holder}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  bankAccounts: p.bankAccounts.map((a, i) =>
                    i === idx ? { ...a, holder: e.target.value } : a
                  ),
                }))
              }
              className="rounded-xl border border-stone-300 px-3 py-2 text-xs"
            />
            <button
              type="button"
              onClick={() =>
                setForm((p) => ({
                  ...p,
                  bankAccounts: p.bankAccounts.filter((_, i) => i !== idx),
                }))
              }
              className="inline-flex items-center justify-center rounded-xl border border-rose-200 text-rose-600 p-2"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Historia & FAQ Editables */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-stone-900">Hitos de Historia</h4>
            <button
              type="button"
              onClick={() =>
                setForm((p) => ({
                  ...p,
                  storyItems: [...p.storyItems, { year: '', title: '', description: '' }],
                }))
              }
              className="inline-flex items-center gap-1 rounded-xl border border-stone-300 px-3 py-1.5 text-xs font-medium"
            >
              <Plus className="h-3.5 w-3.5" /> Agregar Hito
            </button>
          </div>
          {form.storyItems.map((st, idx) => (
            <div key={idx} className="rounded-xl border border-stone-200 p-3 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Año"
                  value={st.year}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      storyItems: p.storyItems.map((s, i) =>
                        i === idx ? { ...s, year: e.target.value } : s
                      ),
                    }))
                  }
                  className="w-24 rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs"
                />
                <input
                  type="text"
                  placeholder="Título"
                  value={st.title}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      storyItems: p.storyItems.map((s, i) =>
                        i === idx ? { ...s, title: e.target.value } : s
                      ),
                    }))
                  }
                  className="flex-1 rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs"
                />
                <button
                  type="button"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      storyItems: p.storyItems.filter((_, i) => i !== idx),
                    }))
                  }
                  className="text-rose-600 p-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <textarea
                rows={2}
                placeholder="Descripción"
                value={st.description}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    storyItems: p.storyItems.map((s, i) =>
                      i === idx ? { ...s, description: e.target.value } : s
                    ),
                  }))
                }
                className="w-full rounded-lg border border-stone-300 p-2 text-xs"
              />
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-stone-900">Preguntas Frecuentes (FAQ)</h4>
            <button
              type="button"
              onClick={() =>
                setForm((p) => ({
                  ...p,
                  faqItems: [...p.faqItems, { question: '', answer: '' }],
                }))
              }
              className="inline-flex items-center gap-1 rounded-xl border border-stone-300 px-3 py-1.5 text-xs font-medium"
            >
              <Plus className="h-3.5 w-3.5" /> Agregar Pregunta
            </button>
          </div>
          {form.faqItems.map((fq, idx) => (
            <div key={idx} className="rounded-xl border border-stone-200 p-3 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Pregunta"
                  value={fq.question}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      faqItems: p.faqItems.map((f, i) =>
                        i === idx ? { ...f, question: e.target.value } : f
                      ),
                    }))
                  }
                  className="flex-1 rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs"
                />
                <button
                  type="button"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      faqItems: p.faqItems.filter((_, i) => i !== idx),
                    }))
                  }
                  className="text-rose-600 p-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <textarea
                rows={2}
                placeholder="Respuesta"
                value={fq.answer}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    faqItems: p.faqItems.map((f, i) =>
                      i === idx ? { ...f, answer: e.target.value } : f
                    ),
                  }))
                }
                className="w-full rounded-lg border border-stone-300 p-2 text-xs"
              />
            </div>
          ))}
        </div>
      </div>
    </form>
  );
}
