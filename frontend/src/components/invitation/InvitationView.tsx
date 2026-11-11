'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  Gift,
  Heart,
  HelpCircle,
  MailOpen,
  MapPin,
  MessageSquareHeart,
  Music,
  Pause,
  Play,
  Sparkles,
  Users,
  XCircle,
} from 'lucide-react';
import { API_BASE_URL, apiFetch } from '@/lib/api';
import { THEME_REGISTRY } from '@/lib/themes';
import { GuestGroup, MediaAsset, WeddingEvent, WishMessage } from '@/types/invitation';

const RSVP_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente por confirmar',
  VIEWED: 'Pendiente por confirmar',
  CONFIRMED: 'Asistencia confirmada',
  PARTIAL: 'Confirmación parcial',
  DECLINED: 'No asistirá',
};

interface InvitationViewProps {
  initialEvent: WeddingEvent;
  initialGroup?: GuestGroup | null;
  token?: string;
}

export function InvitationView({ initialEvent, initialGroup, token }: InvitationViewProps) {
  const [event] = useState<WeddingEvent>(initialEvent);
  const [group, setGroup] = useState<GuestGroup | null>(initialGroup || null);
  const [envelopeOpen, setEnvelopeOpen] = useState(false);
  const [playingMusic, setPlayingMusic] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  const [memberForm, setMemberForm] = useState<
    Array<{ id: string; fullName: string; isCompanionSlot: boolean; attending: boolean }>
  >(() =>
    (initialGroup?.members || []).map((m) => ({
      id: m.id,
      fullName: m.fullName,
      isCompanionSlot: m.isCompanionSlot,
      attending: m.attending === false ? false : true,
    }))
  );
  const [guestMessage, setGuestMessage] = useState(initialGroup?.guestMessage || '');
  const [submittingRsvp, setSubmittingRsvp] = useState(false);

  const [wishes, setWishes] = useState<WishMessage[]>([]);
  const [wishAuthor, setWishAuthor] = useState(initialGroup?.groupName || '');
  const [wishText, setWishText] = useState('');
  const [sendingWish, setSendingWish] = useState(false);

  const [mediaItems, setMediaItems] = useState<MediaAsset[]>([]);

  const theme = THEME_REGISTRY[event.theme] || THEME_REGISTRY.ROMANTIC_EDITORIAL;
  const sections = event.sectionsConfig;
  const content = event.contentConfig;

  useEffect(() => {
    const target = new Date(event.eventDate).getTime();
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [event.eventDate]);

  useEffect(() => {
    if (sections.wishesWall) {
      apiFetch<{ wishes: WishMessage[] }>(`/api/public/events/${event.slug}/wishes`)
        .then((res) => setWishes(res.wishes))
        .catch(() => {});
    }
    if (sections.photoWall) {
      apiFetch<{ media: MediaAsset[] }>(`/api/public/events/${event.slug}/media`)
        .then((res) => setMediaItems(res.media.slice(0, 8)))
        .catch(() => {});
    }
  }, [event.slug, sections.wishesWall, sections.photoWall]);

  const handleOpenEnvelope = () => {
    setEnvelopeOpen(true);
    if (sections.heroMusic && event.themeConfig.musicUrl && audioRef.current) {
      audioRef.current
        .play()
        .then(() => setPlayingMusic(true))
        .catch(() => {});
    }
  };

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (playingMusic) {
      audioRef.current.pause();
      setPlayingMusic(false);
    } else {
      audioRef.current
        .play()
        .then(() => setPlayingMusic(true))
        .catch(() => toast.error('No se pudo reproducir el audio configurado'));
    }
  };

  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copiado al portapapeles');
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  const handleSubmitRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmittingRsvp(true);
    try {
      const res = await apiFetch<{ group: GuestGroup }>(`/api/public/invitations/${token}/rsvp`, {
        method: 'POST',
        body: JSON.stringify({
          members: memberForm.map((m) => ({
            id: m.id,
            fullName: m.fullName,
            attending: m.attending,
          })),
          guestMessage,
        }),
      });
      setGroup(res.group);
      toast.success('¡Confirmación registrada con éxito!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al confirmar asistencia');
    } finally {
      setSubmittingRsvp(false);
    }
  };

  const handleSendWish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishAuthor.trim() || !wishText.trim()) return;
    setSendingWish(true);
    try {
      const res = await apiFetch<{ wish: WishMessage }>(`/api/public/events/${event.slug}/wishes`, {
        method: 'POST',
        body: JSON.stringify({ authorName: wishAuthor, message: wishText }),
      });
      if (res.wish.isApproved) {
        setWishes((prev) => [res.wish, ...prev]);
        toast.success('¡Gracias por tus buenos deseos!');
      } else {
        toast.success('Mensaje enviado para aprobación de los novios');
      }
      setWishText('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo enviar el mensaje');
    } finally {
      setSendingWish(false);
    }
  };

  const formattedDate = new Date(event.eventDate).toLocaleDateString('es-EC', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className={`min-h-screen ${theme.pageBg} ${theme.textPrimary} transition-colors duration-300`}>
      {event.themeConfig.musicUrl && (
        <audio ref={audioRef} src={event.themeConfig.musicUrl} loop preload="none" />
      )}

      {/* Overlay de apertura tipo sobre */}
      {!envelopeOpen && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-6 ${theme.envelopeBg}`}
        >
          <div
            className={`max-w-lg w-full rounded-3xl border ${theme.borderClass} ${theme.surfaceBg} p-8 md:p-12 text-center shadow-2xl`}
          >
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-current/15 animate-float-slow">
              <MailOpen className={`h-7 w-7 ${theme.accentText}`} />
            </div>
            <p className={`text-xs uppercase tracking-[0.3em] ${theme.accentText} mb-3`}>
              {event.title}
            </p>
            <h1 className="font-serif text-4xl md:text-5xl font-semibold leading-tight mb-3">
              {event.partnerOneName}
              <span className={`block text-2xl my-1 italic ${theme.accentText}`}>&amp;</span>
              {event.partnerTwoName}
            </h1>
            {group && (
              <div className={`mt-5 rounded-2xl ${theme.surfaceMutedBg} p-4 text-sm`}>
                <p className={theme.textMuted}>Invitación especial para</p>
                <p className="font-semibold text-base mt-0.5">{group.groupName}</p>
                <p className={`text-xs mt-1 ${theme.accentText}`}>
                  {group.maxGuests} {group.maxGuests === 1 ? 'lugar reservado' : 'lugares reservados'}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={handleOpenEnvelope}
              className={`mt-7 inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold shadow-md transition ${theme.buttonPrimary}`}
            >
              <Sparkles className="h-4 w-4" />
              {content.openEnvelopeLabel || 'Abrir Invitación'}
            </button>
          </div>
        </div>
      )}

      {/* Control flotante de música */}
      {envelopeOpen && sections.heroMusic && event.themeConfig.musicUrl && (
        <button
          type="button"
          onClick={toggleMusic}
          aria-label="Controlar música"
          className={`fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-medium shadow-lg border ${theme.borderClass} ${theme.surfaceBg}`}
        >
          {playingMusic ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          <Music className="h-3.5 w-3.5" />
          <span>{playingMusic ? 'Pausar' : 'Música'}</span>
        </button>
      )}

      {/* Hero Portada */}
      <header className="relative px-4 pt-16 pb-14 text-center max-w-4xl mx-auto">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1 text-xs uppercase tracking-[0.25em] ${theme.badgeBg}`}
        >
          <Heart className="h-3.5 w-3.5" />
          {content.heroBadgeText || 'Nos Casamos'}
        </span>
        <h1 className="font-serif text-4xl sm:text-6xl font-semibold mt-6 leading-tight">
          {event.partnerOneName}
          <span className={`block text-3xl sm:text-4xl italic my-2 ${theme.accentText}`}>&amp;</span>
          {event.partnerTwoName}
        </h1>
        <p className={`mt-5 text-base sm:text-lg capitalize ${theme.textMuted}`}>{formattedDate}</p>
        {event.themeConfig.coverSubtitle && (
          <p className={`mt-2 text-sm sm:text-base max-w-xl mx-auto ${theme.textMuted}`}>
            {event.themeConfig.coverSubtitle}
          </p>
        )}
        {content.welcomeText && (
          <p className={`mt-6 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed ${theme.textMuted}`}>
            {content.welcomeText}
          </p>
        )}

        {event.themeConfig.coverImageUrl && (
          <div className={`mt-8 overflow-hidden rounded-3xl border ${theme.borderClass} shadow-lg`}>
            <img
              src={event.themeConfig.coverImageUrl}
              alt="Foto principal"
              className="w-full max-h-[460px] object-cover"
            />
          </div>
        )}
      </header>

      <main className="max-w-4xl mx-auto px-4 pb-24 space-y-12">
        {/* Cuenta Regresiva */}
        {sections.countdown && (
          <section
            className={`rounded-3xl border ${theme.borderClass} ${theme.surfaceBg} p-6 sm:p-8 text-center shadow-sm`}
          >
            <p className={`text-xs uppercase tracking-[0.25em] ${theme.accentText} mb-5`}>
              {content.countdownTitle || 'Faltan para el gran día'}
            </p>
            <div className="grid grid-cols-4 gap-3 sm:gap-6 max-w-xl mx-auto">
              {[
                { label: 'Días', value: countdown.days },
                { label: 'Horas', value: countdown.hours },
                { label: 'Minutos', value: countdown.minutes },
                { label: 'Segundos', value: countdown.seconds },
              ].map((item) => (
                <div key={item.label} className={`rounded-2xl ${theme.surfaceMutedBg} py-4 px-2`}>
                  <div className="font-serif text-3xl sm:text-4xl font-semibold">
                    {String(item.value).padStart(2, '0')}
                  </div>
                  <div className={`text-[11px] uppercase tracking-wider mt-1 ${theme.textMuted}`}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Historia & Galería */}
        {sections.storyGallery && (
          <section
            className={`rounded-3xl border ${theme.borderClass} ${theme.surfaceBg} p-6 sm:p-10 shadow-sm`}
          >
            <div className="text-center mb-8">
              <p className={`text-xs uppercase tracking-[0.25em] ${theme.accentText}`}>
                {content.storyEyebrow || 'Nuestro Camino'}
              </p>
              <h2 className="font-serif text-3xl font-semibold mt-1">
                {content.storyTitle || 'Nuestra Historia'}
              </h2>
            </div>

            {content.storyItems && content.storyItems.length > 0 && (
              <div className="grid md:grid-cols-3 gap-5">
                {content.storyItems.map((story, idx) => (
                  <div key={idx} className={`rounded-2xl ${theme.surfaceMutedBg} p-5`}>
                    <span className={`text-xs font-bold uppercase tracking-widest ${theme.accentText}`}>
                      {story.year}
                    </span>
                    <h3 className="font-serif text-xl font-semibold mt-1 mb-2">{story.title}</h3>
                    <p className={`text-sm leading-relaxed ${theme.textMuted}`}>
                      {story.description}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {content.galleryUrls && content.galleryUrls.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
                {content.galleryUrls.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`Recuerdo ${idx + 1}`}
                    className="h-44 w-full object-cover rounded-2xl"
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Itinerario: Ceremonia & Recepción */}
        {sections.itinerary && (
          <section className="space-y-5">
            <div className="text-center">
              <p className={`text-xs uppercase tracking-[0.25em] ${theme.accentText}`}>
                {content.itineraryEyebrow || 'Cuándo y Dónde'}
              </p>
              <h2 className="font-serif text-3xl font-semibold mt-1">
                {content.itineraryTitle || 'Itinerario del Evento'}
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  title: event.ceremonyTitle,
                  time: event.ceremonyTime,
                  address: event.ceremonyAddress,
                  mapUrl: event.ceremonyMapUrl,
                },
                {
                  title: event.receptionTitle,
                  time: event.receptionTime,
                  address: event.receptionAddress,
                  mapUrl: event.receptionMapUrl,
                },
              ].map((place, idx) => (
                <div
                  key={idx}
                  className={`rounded-3xl border ${theme.borderClass} ${theme.surfaceBg} p-6 sm:p-8 flex flex-col justify-between shadow-sm`}
                >
                  <div>
                    <h3 className="font-serif text-2xl font-semibold mb-3">{place.title}</h3>
                    <div className={`flex items-center gap-2 text-sm mb-2 ${theme.textMuted}`}>
                      <Clock className={`h-4 w-4 ${theme.accentText}`} />
                      <span>{place.time} hrs</span>
                    </div>
                    <div className={`flex items-start gap-2 text-sm ${theme.textMuted}`}>
                      <MapPin className={`h-4 w-4 mt-0.5 shrink-0 ${theme.accentText}`} />
                      <span>{place.address || 'Ubicación disponible en el mapa'}</span>
                    </div>
                  </div>
                  {place.mapUrl && (
                    <a
                      href={place.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`mt-6 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition ${theme.buttonPrimary}`}
                    >
                      <MapPin className="h-4 w-4" />
                      Ver en Google Maps
                    </a>
                  )}
                </div>
              ))}
            </div>

            <div className="text-center pt-2">
              <a
                href={`${API_BASE_URL}/api/public/events/${event.slug}/calendar.ics`}
                className={`inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium transition ${theme.buttonSecondary}`}
              >
                <Calendar className="h-4 w-4" />
                Agregar al Calendario (.ics)
              </a>
            </div>
          </section>
        )}

        {/* Código de Vestimenta */}
        {sections.dressCode && (
          <section
            className={`rounded-3xl border ${theme.borderClass} ${theme.surfaceBg} p-6 sm:p-8 text-center shadow-sm`}
          >
            <p className={`text-xs uppercase tracking-[0.25em] ${theme.accentText}`}>
              {content.dressCodeEyebrow || 'Vestimenta'}
            </p>
            <h2 className="font-serif text-3xl font-semibold mt-1">
              {content.dressCodeTitle || 'Etiqueta Formal'}
            </h2>
            {content.dressCodeNote && (
              <p className={`mt-3 text-sm max-w-xl mx-auto ${theme.textMuted}`}>
                {content.dressCodeNote}
              </p>
            )}
            {content.dressCodePalette && content.dressCodePalette.length > 0 && (
              <div className="flex items-center justify-center gap-3 mt-5">
                {content.dressCodePalette.map((hex, i) => (
                  <span
                    key={i}
                    title={hex}
                    className={`h-8 w-8 rounded-full border ${theme.borderClass} shadow-sm`}
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Mesa de Regalos / Lluvia de Sobres */}
        {sections.giftRegistry && (
          <section
            className={`rounded-3xl border ${theme.borderClass} ${theme.surfaceBg} p-6 sm:p-8 shadow-sm`}
          >
            <div className="text-center mb-6">
              <Gift className={`h-7 w-7 mx-auto mb-2 ${theme.accentText}`} />
              <h2 className="font-serif text-3xl font-semibold">
                {content.giftTitle || 'Mesa de Regalos'}
              </h2>
              {content.giftDescription && (
                <p className={`mt-2 text-sm max-w-xl mx-auto ${theme.textMuted}`}>
                  {content.giftDescription}
                </p>
              )}
            </div>

            {content.bankAccounts && content.bankAccounts.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-4">
                {content.bankAccounts.map((acc, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl ${theme.surfaceMutedBg} p-5 flex flex-col justify-between gap-3`}
                  >
                    <div className="text-sm space-y-1">
                      <p className="font-semibold">{acc.bank}</p>
                      <p className={theme.textMuted}>
                        {acc.accountType} — {acc.accountNumber}
                      </p>
                      <p className={`text-xs ${theme.textMuted}`}>Titular: {acc.holder}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText(acc.accountNumber)}
                      className={`inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition ${theme.buttonSecondary}`}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copiar Cuenta
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Confirmación de Asistencia (RSVP) por Grupo / Acompañante */}
        <section
          id="rsvp"
          className={`rounded-3xl border-2 ${theme.accentBorder} ${theme.surfaceBg} p-6 sm:p-10 shadow-md`}
        >
          <div className="text-center mb-6">
            <Users className={`h-7 w-7 mx-auto mb-2 ${theme.accentText}`} />
            <p className={`text-xs uppercase tracking-[0.25em] ${theme.accentText}`}>
              {content.rsvpEyebrow || 'RSVP'}
            </p>
            <h2 className="font-serif text-3xl font-semibold mt-1">
              {content.rsvpTitle || 'Confirma tu Asistencia'}
            </h2>
          </div>

          {!group ? (
            <div className={`rounded-2xl ${theme.surfaceMutedBg} p-6 text-center text-sm ${theme.textMuted}`}>
              Para confirmar tu asistencia, abre el enlace personalizado que recibiste por WhatsApp o correo electrónico.
            </div>
          ) : (
            <form onSubmit={handleSubmitRsvp} className="space-y-5">
              <div className={`rounded-2xl ${theme.surfaceMutedBg} p-4 flex flex-wrap items-center justify-between gap-2`}>
                <div>
                  <p className="font-semibold">{group.groupName}</p>
                  <p className={`text-xs ${theme.textMuted}`}>
                    {group.maxGuests}{' '}
                    {group.maxGuests === 1 ? 'cupo asignado' : 'cupos asignados'}
                  </p>
                  {group.members.some((m) => m.tableName) && (
                    <p className={`text-xs font-medium mt-1 ${theme.accentText}`}>
                      Ubicación asignada:{' '}
                      {group.members
                        .filter((m) => m.tableName)
                        .map(
                          (m) =>
                            `${m.fullName} → ${m.tableName}${m.seatNumber ? ` (Puesto #${m.seatNumber})` : ''}`
                        )
                        .join(' | ')}
                    </p>
                  )}
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${theme.badgeBg}`}>
                  {RSVP_STATUS_LABELS[group.rsvpStatus] || group.rsvpStatus}
                </span>
              </div>

              <div className="space-y-3">
                {memberForm.map((member, idx) => (
                  <div
                    key={member.id}
                    className={`rounded-2xl border ${theme.borderClass} p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between`}
                  >
                    <div className="flex-1">
                      <label className={`block text-xs mb-1 ${theme.textMuted}`}>
                        {member.isCompanionSlot
                          ? `Nombre del acompañante (Cupo ${idx + 1})`
                          : `Invitado titular (Cupo ${idx + 1})`}
                      </label>
                      <input
                        type="text"
                        value={member.fullName}
                        onChange={(e) =>
                          setMemberForm((prev) =>
                            prev.map((m, i) =>
                              i === idx ? { ...m, fullName: e.target.value } : m
                            )
                          )
                        }
                        placeholder="Nombre completo"
                        className={`w-full rounded-xl border ${theme.borderClass} bg-transparent px-3 py-2 text-sm outline-none focus:ring-2`}
                      />
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setMemberForm((prev) =>
                            prev.map((m, i) => (i === idx ? { ...m, attending: true } : m))
                          )
                        }
                        className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition ${
                          member.attending
                            ? 'bg-emerald-600 text-white'
                            : `${theme.surfaceMutedBg} ${theme.textMuted}`
                        }`}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Sí asiste
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setMemberForm((prev) =>
                            prev.map((m, i) => (i === idx ? { ...m, attending: false } : m))
                          )
                        }
                        className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition ${
                          !member.attending
                            ? 'bg-rose-600 text-white'
                            : `${theme.surfaceMutedBg} ${theme.textMuted}`
                        }`}
                      >
                        <XCircle className="h-4 w-4" />
                        No asiste
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className={`block text-xs mb-1.5 ${theme.textMuted}`}>
                  Mensaje adicional para los novios (opcional)
                </label>
                <textarea
                  rows={3}
                  value={guestMessage}
                  onChange={(e) => setGuestMessage(e.target.value)}
                  placeholder="Déjanos un mensaje o nota especial..."
                  className={`w-full rounded-2xl border ${theme.borderClass} bg-transparent p-3 text-sm outline-none`}
                />
              </div>

              <button
                type="submit"
                disabled={submittingRsvp}
                className={`w-full rounded-full py-3.5 text-sm font-semibold shadow-md transition disabled:opacity-60 ${theme.buttonPrimary}`}
              >
                {submittingRsvp
                  ? 'Guardando confirmación...'
                  : content.rsvpButtonLabel || 'Guardar Confirmación'}
              </button>
            </form>
          )}
        </section>

        {/* Álbum QR de Fotos & Videos */}
        {sections.photoWall && (
          <section
            className={`rounded-3xl border ${theme.borderClass} ${theme.surfaceBg} p-6 sm:p-8 shadow-sm`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <p className={`text-xs uppercase tracking-[0.25em] ${theme.accentText}`}>
                  {content.photoAlbumEyebrow || 'Álbum Colaborativo'}
                </p>
                <h2 className="font-serif text-3xl font-semibold mt-1">
                  {content.photoAlbumTitle || 'Comparte tus Fotos y Videos'}
                </h2>
              </div>
              <Link
                href={`/e/${event.slug}/fotos`}
                className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition ${theme.buttonPrimary}`}
              >
                <Camera className="h-4 w-4" />
                Subir Fotos / Videos
              </Link>
            </div>

            {mediaItems.length === 0 ? (
              <p className={`text-sm ${theme.textMuted}`}>
                Sé el primero en compartir recuerdos de este día escaneando el QR o entrando al álbum.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {mediaItems.map((item) => (
                  <div key={item.id} className="overflow-hidden rounded-2xl border border-current/10">
                    {item.mediaType === 'VIDEO' ? (
                      <video
                        src={`${API_BASE_URL}/api/public/media/${item.id}/file`}
                        controls
                        className="h-40 w-full object-cover"
                      />
                    ) : (
                      <img
                        src={`${API_BASE_URL}/api/public/media/${item.id}/file`}
                        alt={item.uploaderName}
                        className="h-40 w-full object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Muro de Buenos Deseos */}
        {sections.wishesWall && (
          <section
            className={`rounded-3xl border ${theme.borderClass} ${theme.surfaceBg} p-6 sm:p-8 shadow-sm`}
          >
            <div className="text-center mb-6">
              <MessageSquareHeart className={`h-7 w-7 mx-auto mb-2 ${theme.accentText}`} />
              <h2 className="font-serif text-3xl font-semibold">
                {content.wishesTitle || 'Buenos Deseos'}
              </h2>
            </div>

            <form onSubmit={handleSendWish} className="grid sm:grid-cols-3 gap-3 mb-6">
              <input
                type="text"
                value={wishAuthor}
                onChange={(e) => setWishAuthor(e.target.value)}
                placeholder="Tu nombre"
                required
                className={`rounded-xl border ${theme.borderClass} bg-transparent px-3.5 py-2.5 text-sm`}
              />
              <input
                type="text"
                value={wishText}
                onChange={(e) => setWishText(e.target.value)}
                placeholder="Escribe un deseo para los novios..."
                required
                className={`sm:col-span-2 rounded-xl border ${theme.borderClass} bg-transparent px-3.5 py-2.5 text-sm`}
              />
              <button
                type="submit"
                disabled={sendingWish}
                className={`sm:col-span-3 rounded-full py-2.5 text-sm font-semibold transition ${theme.buttonPrimary}`}
              >
                {sendingWish ? 'Enviando...' : 'Publicar Buen Deseo'}
              </button>
            </form>

            <div className="grid sm:grid-cols-2 gap-4">
              {wishes.map((w) => (
                <div key={w.id} className={`rounded-2xl ${theme.surfaceMutedBg} p-4`}>
                  <p className="text-sm italic">&ldquo;{w.message}&rdquo;</p>
                  <p className={`text-xs font-semibold mt-2 ${theme.accentText}`}>— {w.authorName}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Preguntas Frecuentes */}
        {sections.faq && content.faqItems && content.faqItems.length > 0 && (
          <section
            className={`rounded-3xl border ${theme.borderClass} ${theme.surfaceBg} p-6 sm:p-8 shadow-sm`}
          >
            <div className="text-center mb-6">
              <HelpCircle className={`h-7 w-7 mx-auto mb-2 ${theme.accentText}`} />
              <h2 className="font-serif text-3xl font-semibold">
                {content.faqTitle || 'Preguntas Frecuentes'}
              </h2>
            </div>
            <div className="space-y-3">
              {content.faqItems.map((item, idx) => {
                const isOpen = openFaqIdx === idx;
                return (
                  <div key={idx} className={`rounded-2xl border ${theme.borderClass}`}>
                    <button
                      type="button"
                      onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-4 text-left font-medium text-sm"
                    >
                      <span>{item.question}</span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {isOpen && (
                      <div className={`px-4 pb-4 text-sm ${theme.textMuted}`}>{item.answer}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <footer className={`border-t ${theme.borderClass} py-8 text-center text-xs ${theme.textMuted}`}>
        <div className="flex items-center justify-center gap-2">
          <Check className="h-3.5 w-3.5" />
          <span>
            {event.partnerOneName} &amp; {event.partnerTwoName}
          </span>
        </div>
      </footer>
    </div>
  );
}
