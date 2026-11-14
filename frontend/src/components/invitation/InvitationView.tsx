'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Calendar,
  Camera,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  Disc3,
  ExternalLink,
  Gift,
  Heart,
  HelpCircle,
  MapPin,
  MessageSquareHeart,
  Music,
  Upload,
  XCircle,
  ZoomIn,
} from 'lucide-react';
import { API_BASE_URL, apiFetch, resolveAssetUrl } from '@/lib/api';
import { getSpotifyPlaylistEmbedUrl, parseAudioSource } from '@/lib/audioSource';
import { buildGoogleCalendarUrl, buildIcsDownloadUrl, downloadIcsLocally } from '@/lib/calendar';
import { resolveTheme } from '@/lib/themes';
import { triggerWeddingConfetti } from '@/lib/confetti';
import { GuestGroup, MediaAsset, WeddingEvent, WishMessage } from '@/types/invitation';
import { WaxSealEnvelope } from './WaxSealEnvelope';
import { FloatingAudioPlayer } from './FloatingAudioPlayer';
import { AmbientParticles } from './AmbientParticles';
import { PhotoLightboxModal } from './PhotoLightboxModal';

const RSVP_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente por confirmar',
  VIEWED: 'Invitación abierta',
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

  const isPlannerEvent = event.organizationType === 'PLANNER';
  const planTier = isPlannerEvent
    ? 'PREMIUM'
    : event.themeConfig?.planTier === 'CLASSIC'
      ? 'CLASSIC'
      : 'PREMIUM';
  const isClassicPlan = planTier === 'CLASSIC';

  const [envelopeOpen, setEnvelopeOpen] = useState(isClassicPlan);
  const [playingMusic, setPlayingMusic] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytIframeRef = useRef<HTMLIFrameElement | null>(null);

  const audioSource = useMemo(
    () => parseAudioSource(!isClassicPlan ? event.themeConfig?.musicUrl : undefined),
    [event.themeConfig?.musicUrl, isClassicPlan]
  );

  // Visor Lightbox para fotos de alta resolución
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxPhotos, setLightboxPhotos] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

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
  const [photoQrData, setPhotoQrData] = useState<{
    qrDataUrl: string;
    targetUrl: string;
    destinationType: string;
    photosAlbumUrl?: string | null;
    driveFolderUrl?: string | null;
  } | null>(null);

  const theme = resolveTheme(event.theme);
  const sections = event.sectionsConfig || {};
  const content = event.contentConfig || {};

  // Bloqueo de scroll móvil mientras el sobre está cerrado
  useEffect(() => {
    if (!envelopeOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [envelopeOpen]);

  // Contador regresivo
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

  // Carga de deseos, fotos y código QR
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

      apiFetch<{
        qrDataUrl: string;
        targetUrl: string;
        destinationType: string;
        photosAlbumUrl?: string | null;
        driveFolderUrl?: string | null;
      }>(`/api/public/events/${event.slug}/photo-qr`)
        .then((res) => setPhotoQrData(res))
        .catch(() => {});
    }
  }, [event.slug, sections.wishesWall, sections.photoWall]);

  const handleSealBreak = () => {
    if (sections.heroMusic && audioSource.type === 'mp3' && audioRef.current) {
      audioRef.current.volume = 0.5;
      audioRef.current
        .play()
        .then(() => setPlayingMusic(true))
        .catch(() => {});
    }
  };

  const handleOpenEnvelope = () => {
    setEnvelopeOpen(true);
    if (!sections.heroMusic) return;

    if (audioSource.type === 'mp3' && audioRef.current && !playingMusic) {
      audioRef.current.volume = 0.5;
      audioRef.current
        .play()
        .then(() => setPlayingMusic(true))
        .catch(() => {});
    } else if (audioSource.type === 'youtube' && ytIframeRef.current?.contentWindow) {
      ytIframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
        '*'
      );
      setPlayingMusic(true);
    }
  };

  const toggleMusic = () => {
    if (audioSource.type === 'mp3') {
      if (!audioRef.current) return;
      if (playingMusic) {
        audioRef.current.pause();
        setPlayingMusic(false);
      } else {
        audioRef.current
          .play()
          .then(() => setPlayingMusic(true))
          .catch(() => toast.error('No se pudo reproducir el audio'));
      }
    } else if (audioSource.type === 'youtube') {
      const win = ytIframeRef.current?.contentWindow;
      if (!win) return;
      const cmd = playingMusic ? 'pauseVideo' : 'playVideo';
      win.postMessage(JSON.stringify({ event: 'command', func: cmd, args: [] }), '*');
      setPlayingMusic(!playingMusic);
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

  const openLightbox = (photos: string[], index = 0) => {
    setLightboxPhotos(photos);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Esta confirmación solo está disponible desde tu enlace personalizado');
      return;
    }
    setSubmittingRsvp(true);
    try {
      const payload = {
        guestMessage,
        members: memberForm.map((m) => ({
          memberId: m.id,
          attending: m.attending,
        })),
      };
      const res = await apiFetch<{ group: GuestGroup }>(`/api/public/invitations/${token}/rsvp`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setGroup(res.group);
      triggerWeddingConfetti();
      toast.success('¡Muchas gracias! Tu respuesta fue registrada con éxito.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar respuesta');
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
        body: JSON.stringify({
          authorName: wishAuthor.trim(),
          message: wishText.trim(),
        }),
      });
      setWishes((prev) => [res.wish, ...prev]);
      setWishText('');
      toast.success('¡Tu mensaje de bendición fue publicado!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo enviar el mensaje');
    } finally {
      setSendingWish(false);
    }
  };

  const formattedDate = useMemo(() => {
    try {
      const d = new Date(event.eventDate);
      if (isNaN(d.getTime())) return '';
      const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      const weekday = days[d.getUTCDay()];
      const day = d.getUTCDate();
      const month = months[d.getUTCMonth()];
      const year = d.getUTCFullYear();
      return `${weekday}, ${day} de ${month} de ${year}`;
    } catch {
      return '';
    }
  }, [event.eventDate]);

  return (
    <div
      className={`min-h-screen ${theme.pageBg} ${theme.textPrimary} ${event.themeConfig?.backgroundClean === false ? theme.texturePattern : ''} transition-colors duration-500 relative`}
    >
      {/* Audio nativo de fondo (MP3) */}
      {audioSource.type === 'mp3' && audioSource.directUrl && (
        <audio
          ref={audioRef}
          src={resolveAssetUrl(audioSource.directUrl)}
          loop
          preload="none"
        />
      )}

      {/* Audio de fondo por YouTube (IFrame invisible) */}
      {audioSource.type === 'youtube' && audioSource.youtubeEmbedUrl && (
        <iframe
          ref={ytIframeRef}
          src={audioSource.youtubeEmbedUrl}
          allow="autoplay"
          className="hidden pointer-events-none w-0 h-0 border-0"
          title="Fondo Musical YouTube"
        />
      )}

      {/* Capa de Imagen de Fondo Personalizada (Lienzo Nupcial) */}
      {event.themeConfig?.backgroundImageUrl && (
        <div
          className={`pointer-events-none z-0 overflow-hidden ${
            event.themeConfig.backgroundFixed !== false ? 'fixed' : 'absolute'
          } inset-0`}
          aria-hidden="true"
        >
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-700"
            style={{
              backgroundImage: `url(${resolveAssetUrl(event.themeConfig.backgroundImageUrl)})`,
              opacity: (event.themeConfig.backgroundOpacity ?? 25) / 100,
              filter: event.themeConfig.backgroundBlur ? `blur(${event.themeConfig.backgroundBlur}px)` : undefined,
              transform: event.themeConfig.backgroundBlur ? 'scale(1.05)' : undefined,
            }}
          />
          {/* Velo protector para garantizar la legibilidad de la tipografía ceremonial */}
          <div
            className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
              ['CLASSIC_NOCTURNE', 'NOCTURNE_ROYAL'].includes(event.theme)
                ? 'bg-gradient-to-b from-black/50 via-black/30 to-black/70'
                : 'bg-gradient-to-b from-white/50 via-transparent to-white/70'
            }`}
          />
        </div>
      )}

      {/* Partículas ambientales de pétalos / brillos dorados (Solo Premium y VIP) */}
      {!isClassicPlan && (
        <AmbientParticles
          theme={event.theme}
          effect={event.themeConfig?.particleEffect || 'AUTO'}
        />
      )}

      {/* Visor Lightbox para fotos de alta resolución */}
      <PhotoLightboxModal
        isOpen={lightboxOpen}
        photos={lightboxPhotos}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
      />

      {/* Sobre 3D Interactivo con Sello de Cera (Wax Seal) - Solo Premium y VIP */}
      {!envelopeOpen && !isClassicPlan && (
        <WaxSealEnvelope
          partnerOneName={event.partnerOneName}
          partnerTwoName={event.partnerTwoName}
          eventDateFormatted={formattedDate}
          groupName={group?.groupName}
          maxGuests={group?.maxGuests}
          theme={event.theme}
          openLabel={content.openEnvelopeLabel || 'Toca el sello para abrir'}
          waxSealMonogram={event.themeConfig?.waxSealMonogram || 'S&J'}
          waxSealColor={event.themeConfig?.waxSealColor}
          envelopeStyle={event.themeConfig?.envelopeStyle}
          envelopeFlap={event.themeConfig?.envelopeFlap}
          openingMode={event.themeConfig?.envelopeOpeningMode || 'CLASSIC_3D_ENVELOPE'}
          onSealBreak={handleSealBreak}
          onOpenComplete={handleOpenEnvelope}
        />
      )}

      {/* Control flotante de música estilo joya/vinilo (Solo Premium y VIP) */}
      {envelopeOpen && !isClassicPlan && sections.heroMusic && audioSource.type !== 'none' && (
        <FloatingAudioPlayer
          playing={playingMusic}
          onToggle={toggleMusic}
          theme={event.theme}
          title="Nuestra Canción"
        />
      )}

      {/* HERO PORTADA EDITORIAL DE ALTA COSTURA */}
      <header className="relative px-4 pt-16 sm:pt-20 pb-12 text-center max-w-4xl mx-auto z-20">
        {/* Monograma de honor */}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#d5c3a5]/50 bg-white/40 dark:bg-white/5 backdrop-blur-sm shadow-sm">
          <span className="font-serif text-sm tracking-widest text-[#b08d57]">
            {(() => {
              const mg = (event.themeConfig?.waxSealMonogram || 'S&J').trim();
              if (mg.includes('&')) {
                const [a, b] = mg.split('&').map((s) => s.trim());
                return (
                  <>
                    <span>{a}</span>
                    <span className="font-script text-lg mx-0.5">&amp;</span>
                    <span>{b}</span>
                  </>
                );
              }
              return mg;
            })()}
          </span>
        </div>

        {/* Badge superior */}
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-5 py-1.5 text-[11px] uppercase tracking-[0.3em] font-medium ${theme.badgeBg} shadow-sm`}
        >
          <Heart className="h-3 w-3 fill-current opacity-70" />
          {content.heroBadgeText || 'Nos Casamos'}
        </span>

        {/* Nombres con Cormorant Garamond y ampersand Pinyon Script */}
        <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-light mt-6 leading-tight tracking-tight text-stone-900 dark:text-[#f7f5f0]">
          {event.partnerOneName}
          <span className="font-script block text-4xl sm:text-6xl italic my-2 sm:my-3 text-[#b08d57] dark:text-[#dfc07c]">
            &amp;
          </span>
          {event.partnerTwoName}
        </h1>

        {/* Fecha ceremonial */}
        <p className={`mt-5 text-sm sm:text-base uppercase tracking-[0.2em] font-sans ${theme.textMuted}`}>
          {formattedDate}
        </p>

        {event.themeConfig?.coverSubtitle && (
          <p className={`mt-3 text-sm sm:text-base max-w-xl mx-auto font-serif italic ${theme.textMuted}`}>
            &ldquo;{event.themeConfig.coverSubtitle}&rdquo;
          </p>
        )}

        {content.welcomeText && (
          <p className={`mt-5 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed ${theme.textMuted} font-sans font-light`}>
            {content.welcomeText}
          </p>
        )}

        {/* FOTO PRINCIPAL HERO CON MARCO EDITORIAL ADAPTATIVO */}
        {event.themeConfig?.coverImageUrl ? (
          <div className="mt-10 max-w-2xl mx-auto">
            <div
              onClick={() =>
                openLightbox([resolveAssetUrl(event.themeConfig.coverImageUrl!)], 0)
              }
              className="group relative overflow-hidden rounded-3xl sm:rounded-[36px] border border-[#d5c3a5]/40 p-2 sm:p-3 bg-white/60 dark:bg-stone-900/60 shadow-xl backdrop-blur-md cursor-pointer transition-all duration-500 hover:shadow-2xl hover:scale-[1.008]"
            >
              {/* Contenedor adaptativo: preserva aspecto original con fondo ambiental de gala */}
              <div className="relative min-h-[280px] max-h-[560px] overflow-hidden rounded-2xl sm:rounded-[28px] flex items-center justify-center bg-stone-950/10">
                {/* Fondo difuminado ambiental */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolveAssetUrl(event.themeConfig.coverImageUrl)}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-125 pointer-events-none"
                />
                {/* Fotografía principal nítida sin cortes */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolveAssetUrl(event.themeConfig.coverImageUrl)}
                  alt="Retrato de los novios"
                  className="relative z-10 w-full h-auto max-h-[540px] object-contain drop-shadow-md transition-transform duration-700 group-hover:scale-[1.02]"
                />
                {/* Overlay flotante al posar el cursor */}
                <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-5 sm:pb-6">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 text-stone-900 px-4 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-sm transition-transform duration-300 group-hover:translate-y-0 translate-y-1">
                    <ZoomIn className="h-3.5 w-3.5 text-amber-700" /> Ver en Pantalla Completa
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-8 max-w-md mx-auto rounded-3xl border border-[#d5c3a5]/40 bg-white/50 dark:bg-white/5 p-8 text-center backdrop-blur-sm">
            <Heart className="h-8 w-8 mx-auto text-[#b08d57] fill-[#b08d57]/20 mb-2" />
            <p className="font-serif text-lg font-medium text-stone-800 dark:text-stone-200">
              {event.partnerOneName} &amp; {event.partnerTwoName}
            </p>
            <p className="text-xs text-stone-500 mt-1 uppercase tracking-widest font-sans">
              El comienzo de nuestra historia
            </p>
          </div>
        )}
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-4xl mx-auto px-4 pb-28 space-y-12 sm:space-y-16 relative z-20">
        {/* CUENTA REGRESIVA MINIMALISTA DE ALTA GAMA */}
        {sections.countdown && (
          <section
            className={`rounded-3xl border ${theme.borderClass} ${theme.surfaceBg} p-6 sm:p-10 text-center shadow-lg backdrop-blur-sm ${theme.cardBorderGlow}`}
          >
            <p className={`text-xs uppercase tracking-[0.3em] font-sans font-medium ${theme.accentText} mb-6`}>
              {content.countdownTitle || 'Cuenta regresiva para el gran día'}
            </p>
            <div className="grid grid-cols-4 gap-2.5 sm:gap-6 max-w-xl mx-auto">
              {[
                { label: 'Días', value: countdown.days },
                { label: 'Horas', value: countdown.hours },
                { label: 'Minutos', value: countdown.minutes },
                { label: 'Segundos', value: countdown.seconds },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`rounded-2xl ${theme.surfaceMutedBg} py-3.5 sm:py-5 px-1 border border-current/5 shadow-inner`}
                >
                  <div className="font-serif text-2xl sm:text-4xl md:text-5xl font-light text-stone-900 dark:text-[#f7f5f0]">
                    {String(item.value).padStart(2, '0')}
                  </div>
                  <div className={`text-[10px] sm:text-xs uppercase tracking-widest mt-1.5 font-sans ${theme.textMuted}`}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* HISTORIA Y GALERÍA EDITORIAL (Solo Premium y VIP) */}
        {sections.storyGallery && !isClassicPlan && (
          <section
            className={`rounded-3xl border ${theme.borderClass} ${theme.surfaceBg} p-6 sm:p-10 shadow-lg backdrop-blur-sm ${theme.cardBorderGlow}`}
          >
            <div className="text-center mb-8">
              <p className={`text-xs uppercase tracking-[0.3em] font-sans font-medium ${theme.accentText}`}>
                {content.storyEyebrow || 'Nuestro Camino'}
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-light mt-1 text-stone-900 dark:text-[#f7f5f0]">
                {content.storyTitle || 'Nuestra Historia'}
              </h2>
            </div>

            {content.storyItems && content.storyItems.length > 0 && (
              <div className="grid md:grid-cols-3 gap-5 mb-8">
                {content.storyItems.map((story, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl ${theme.surfaceMutedBg} p-5 border border-current/5 shadow-sm`}
                  >
                    <span className={`text-xs font-semibold uppercase tracking-widest ${theme.accentText}`}>
                      {story.year}
                    </span>
                    <h3 className="font-serif text-xl font-medium mt-1 mb-2 text-stone-800 dark:text-stone-200">
                      {story.title}
                    </h3>
                    <p className={`text-sm leading-relaxed ${theme.textMuted} font-sans font-light`}>
                      {story.description}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Galería Mosaico Revista de Moda */}
            {content.galleryUrls && content.galleryUrls.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs uppercase tracking-wider font-semibold text-stone-500 font-sans">
                    Recuerdos de la Pareja
                  </span>
                  <span className="text-xs text-[#b08d57] font-medium">
                    Toca para ampliar
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  {content.galleryUrls.map((url, idx) => (
                    <div
                      key={idx}
                      onClick={() =>
                        openLightbox(
                          content.galleryUrls!.map((u) => resolveAssetUrl(u)),
                          idx
                        )
                      }
                      className="group relative overflow-hidden rounded-2xl aspect-[4/5] bg-stone-200 dark:bg-stone-800 cursor-pointer shadow-md"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolveAssetUrl(url)}
                        alt={`Recuerdo de la pareja ${idx + 1}`}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <ZoomIn className="h-6 w-6 text-white drop-shadow" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ITINERARIO ILUSTRADO: CEREMONIA & RECEPCIÓN */}
        {sections.itinerary && (
          <section className="space-y-6">
            <div className="text-center mb-8">
              <p className={`text-xs uppercase tracking-[0.3em] font-sans font-medium ${theme.accentText}`}>
                {content.itineraryEyebrow || 'Cuándo y Dónde'}
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-light mt-1 text-stone-900 dark:text-[#f7f5f0]">
                {content.itineraryTitle || 'Itinerario del Evento'}
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Ceremonia */}
              <div
                className={`rounded-3xl border ${theme.borderClass} ${theme.surfaceBg} p-6 sm:p-8 shadow-lg backdrop-blur-sm relative overflow-hidden ${theme.cardBorderGlow}`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Clock className={`h-4 w-4 ${theme.accentText}`} />
                  <span className={`text-xs uppercase tracking-widest font-semibold ${theme.accentText}`}>
                    {event.ceremonyTime}
                  </span>
                </div>
                <h3 className="font-serif text-2xl font-light text-stone-900 dark:text-[#f7f5f0] mb-2">
                  {event.ceremonyTitle}
                </h3>
                <p className={`text-sm ${theme.textMuted} flex items-start gap-2 mb-6 font-sans font-light`}>
                  <MapPin className="h-4 w-4 shrink-0 text-[#b08d57] mt-0.5" />
                  <span>{event.ceremonyAddress}</span>
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {event.ceremonyMapUrl && (
                    <a
                      href={event.ceremonyMapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${theme.buttonPrimary}`}
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      Google Maps
                    </a>
                  )}
                  <a
                    href={buildGoogleCalendarUrl(event, 'ceremony')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition border ${theme.borderClass} ${theme.surfaceMutedBg} hover:opacity-80`}
                    title="Añadir Ceremonia a Google Calendar"
                  >
                    <Calendar className="h-3.5 w-3.5 text-[#b08d57]" />
                    Google Calendar
                  </a>
                  <a
                    href={buildIcsDownloadUrl(event.slug)}
                    onClick={(e) => {
                      e.preventDefault();
                      downloadIcsLocally(event, 'ceremony');
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition border ${theme.borderClass} ${theme.surfaceMutedBg} hover:opacity-80 cursor-pointer`}
                    title="Descargar archivo .ics para Apple Calendar / Outlook"
                  >
                    <Calendar className="h-3.5 w-3.5 text-stone-400" />
                    Agendar .ICS
                  </a>
                </div>
              </div>

              {/* Recepción */}
              <div
                className={`rounded-3xl border ${theme.borderClass} ${theme.surfaceBg} p-6 sm:p-8 shadow-lg backdrop-blur-sm relative overflow-hidden ${theme.cardBorderGlow}`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Clock className={`h-4 w-4 ${theme.accentText}`} />
                  <span className={`text-xs uppercase tracking-widest font-semibold ${theme.accentText}`}>
                    {event.receptionTime}
                  </span>
                </div>
                <h3 className="font-serif text-2xl font-light text-stone-900 dark:text-[#f7f5f0] mb-2">
                  {event.receptionTitle}
                </h3>
                <p className={`text-sm ${theme.textMuted} flex items-start gap-2 mb-6 font-sans font-light`}>
                  <MapPin className="h-4 w-4 shrink-0 text-[#b08d57] mt-0.5" />
                  <span>{event.receptionAddress}</span>
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {event.receptionMapUrl && (
                    <a
                      href={event.receptionMapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${theme.buttonPrimary}`}
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      Google Maps
                    </a>
                  )}
                  <a
                    href={buildGoogleCalendarUrl(event, 'reception')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition border ${theme.borderClass} ${theme.surfaceMutedBg} hover:opacity-80`}
                    title="Añadir Recepción a Google Calendar"
                  >
                    <Calendar className="h-3.5 w-3.5 text-[#b08d57]" />
                    Google Calendar
                  </a>
                  <a
                    href={buildIcsDownloadUrl(event.slug)}
                    onClick={(e) => {
                      e.preventDefault();
                      downloadIcsLocally(event, 'reception');
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition border ${theme.borderClass} ${theme.surfaceMutedBg} hover:opacity-80 cursor-pointer`}
                    title="Descargar archivo .ics para Apple Calendar / Outlook"
                  >
                    <Calendar className="h-3.5 w-3.5 text-stone-400" />
                    Agendar .ICS
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* CÓDIGO DE VESTIMENTA */}
        {sections.dressCode && (
          <section
            className={`rounded-3xl border ${theme.borderClass} ${theme.surfaceBg} p-6 sm:p-10 shadow-lg backdrop-blur-sm text-center ${theme.cardBorderGlow}`}
          >
            <p className={`text-xs uppercase tracking-[0.3em] font-sans font-medium ${theme.accentText}`}>
              {content.dressCodeEyebrow || 'Vestimenta'}
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-light mt-1 text-stone-900 dark:text-[#f7f5f0]">
              {content.dressCodeTitle || 'Etiqueta Formal'}
            </h2>
            {content.dressCodeNote && (
              <p className={`text-sm ${theme.textMuted} mt-3 max-w-lg mx-auto font-sans font-light`}>
                {content.dressCodeNote}
              </p>
            )}
            {(content.dressCodeShowPalette ?? event.themeConfig?.showDressCodePalette ?? true) &&
              content.dressCodePalette &&
              content.dressCodePalette.length > 0 && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {content.dressCodePalette.map((color, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1.5">
                    <div
                      className="h-10 w-10 rounded-full border-2 border-white/80 dark:border-stone-800 shadow-md"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[10px] uppercase font-mono text-stone-400">{color}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* MESA DE REGALOS / SOBRES */}
        {sections.giftRegistry && (
          <section
            className={`rounded-3xl border ${theme.borderClass} ${theme.surfaceBg} p-6 sm:p-10 shadow-lg backdrop-blur-sm ${theme.cardBorderGlow}`}
          >
            <div className="text-center mb-8">
              <Gift className={`h-8 w-8 mx-auto mb-2 ${theme.accentText}`} />
              <h2 className="font-serif text-3xl sm:text-4xl font-light text-stone-900 dark:text-[#f7f5f0]">
                {content.giftTitle || 'Lluvia de Sobres & Cuentas'}
              </h2>
              <p className={`text-sm ${theme.textMuted} mt-2 max-w-lg mx-auto font-sans font-light`}>
                {content.giftDescription ||
                  'Tu presencia es nuestro mejor regalo. Si deseas hacernos un presente, te compartimos nuestros datos bancarios o buzón de sobres en la recepción.'}
              </p>
            </div>

            {content.bankAccounts && content.bankAccounts.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                {content.bankAccounts.map((acc, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl ${theme.surfaceMutedBg} p-5 border border-current/5 shadow-sm space-y-2`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-serif text-base font-semibold">{acc.bank}</span>
                      <span className={`text-[10px] uppercase tracking-wider ${theme.accentText} font-semibold`}>
                        {acc.accountType}
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-black/5 dark:bg-white/5 rounded-xl px-3 py-2">
                      <span className="font-mono text-xs select-all">{acc.accountNumber}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(acc.accountNumber)}
                        className="text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 p-1"
                        title="Copiar número"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className={`text-[11px] ${theme.textMuted}`}>Titular: {acc.holder}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* RSVP FORMULARIO DE CONFIRMACIÓN */}
        <section
          id="rsvp"
          className={`rounded-3xl border ${theme.borderClass} ${theme.surfaceBg} p-6 sm:p-10 shadow-xl backdrop-blur-sm relative overflow-hidden ${theme.cardBorderGlow}`}
        >
          <div className="text-center mb-8">
            <p className={`text-xs uppercase tracking-[0.3em] font-sans font-medium ${theme.accentText}`}>
              {content.rsvpEyebrow || 'Confirmación de Asistencia'}
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-light mt-1 text-stone-900 dark:text-[#f7f5f0]">
              {content.rsvpTitle || '¿Nos Acompañarás?'}
            </h2>
            {event.rsvpDeadline && (
              <p className={`text-xs uppercase tracking-widest mt-2 ${theme.accentText} font-sans`}>
                Confirmar antes del{' '}
                {new Date(event.rsvpDeadline).toLocaleDateString('es-EC', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>

          {!group ? (
            <div className="max-w-md mx-auto text-center p-6 rounded-2xl bg-black/5 dark:bg-white/5">
              <p className="text-sm font-light">
                Para confirmar tu asistencia, abre la invitación desde el enlace personal que te enviamos por WhatsApp o correo.
              </p>
            </div>
          ) : (
            <form onSubmit={handleRsvpSubmit} className="max-w-xl mx-auto space-y-6">
              <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-400 uppercase tracking-wider">Invitación para</span>
                    {!isClassicPlan && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#b08d57] to-[#8d2b3d] px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-xs">
                        ★ Pase Personal
                      </span>
                    )}
                  </div>
                  <p className="font-serif text-lg font-medium">{group.groupName}</p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-[#b08d57]/20 text-[#b08d57] font-semibold">
                  {RSVP_STATUS_LABELS[group.rsvpStatus] || group.rsvpStatus}
                </span>
              </div>

              <div className="space-y-3">
                <p className="text-xs uppercase tracking-wider font-semibold text-stone-500">
                  Selecciona la asistencia de cada invitado:
                </p>
                {memberForm.map((m, idx) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-current/10 bg-white/40 dark:bg-white/5"
                  >
                    <div>
                      <p className="font-serif text-base">{m.fullName}</p>
                      {m.isCompanionSlot && (
                        <span className="text-[10px] text-stone-400 italic">Acompañante asignado</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setMemberForm((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, attending: true } : item))
                          )
                        }
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                          m.attending
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
                        }`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Asistirá
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setMemberForm((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, attending: false } : item))
                          )
                        }
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                          m.attending === false
                            ? 'bg-red-600 text-white shadow-sm'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
                        }`}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        No podrá
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-stone-500 mb-1.5">
                  Mensaje especial para los novios (restricciones alimentarias, canción favorita, etc.)
                </label>
                <textarea
                  rows={3}
                  value={guestMessage}
                  onChange={(e) => setGuestMessage(e.target.value)}
                  placeholder="Ej: Somos vegetarianos / ¡No podemos esperar para verlos!"
                  className={`w-full rounded-2xl border ${theme.borderClass} bg-transparent p-3.5 text-sm outline-none focus:ring-2 focus:ring-[#b08d57]`}
                />
              </div>

              <button
                type="submit"
                disabled={submittingRsvp}
                className={`w-full rounded-full py-4 text-xs font-semibold uppercase tracking-widest transition shadow-lg ${theme.buttonPrimary} disabled:opacity-60`}
              >
                <span>
                  {submittingRsvp
                    ? 'Guardando confirmación...'
                    : content.rsvpButtonLabel || 'Confirmar Mi Asistencia'}
                </span>
              </button>
            </form>
          )}
        </section>

        {/* ÁLBUM QR DE FOTOS & VIDEOS (Solo Premium y VIP) */}
        {sections.photoWall && !isClassicPlan && (
          <section
            className={`rounded-3xl border ${theme.borderClass} ${theme.surfaceBg} p-6 sm:p-10 shadow-lg backdrop-blur-sm ${theme.cardBorderGlow}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <p className={`text-xs uppercase tracking-[0.3em] font-sans font-medium ${theme.accentText}`}>
                  {content.photoAlbumEyebrow || 'Álbum Colaborativo'}
                </p>
                <h2 className="font-serif text-3xl font-light mt-1 text-stone-900 dark:text-[#f7f5f0]">
                  {content.photoAlbumTitle || 'Comparte tus Fotos y Videos'}
                </h2>
              </div>
              <Link
                href={`/e/${event.slug}/fotos`}
                className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-xs font-semibold uppercase tracking-wider transition ${theme.buttonPrimary}`}
              >
                <Camera className="h-4 w-4" />
                Subir Fotos / Videos
              </Link>
            </div>

            {/* Tarjetón QR de Gala para las Mesas y Móviles */}
            <div className="my-6 p-6 sm:p-8 rounded-2xl bg-white/70 dark:bg-stone-900/60 border border-[#b08d57]/30 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center md:text-left space-y-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#b08d57]/10 text-[#b08d57] border border-[#b08d57]/20">
                  <Camera className="h-3 w-3" /> Álbum Digital de la Boda
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-light text-stone-900 dark:text-[#f7f5f0]">
                  Escanea el Código QR
                </h3>
                <p className={`text-xs sm:text-sm font-sans ${theme.textMuted} max-w-md`}>
                  Apunta con la cámara de tu celular a este código QR para subir directamente tus fotos y videos al álbum de los novios, o entra con los botones directos:
                </p>

                {/* Botones de acción directa */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-3">
                  {event.photosAlbumUrl && (
                    <a
                      href={event.photosAlbumUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition shadow"
                    >
                      <Camera className="h-4 w-4" />
                      Subir a Google Photos
                    </a>
                  )}

                  {event.driveFolderUrl && (
                    <a
                      href={event.driveFolderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition shadow"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Abrir en Google Drive
                    </a>
                  )}

                  <Link
                    href={`/e/${event.slug}/fotos`}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition border ${theme.borderClass} ${theme.surfaceMutedBg} hover:opacity-80`}
                  >
                    <Upload className="h-4 w-4 text-[#b08d57]" />
                    Subir desde la Web
                  </Link>
                </div>
              </div>

              {/* QR enmarcado con borde dorado */}
              {photoQrData?.qrDataUrl && (
                <div className="flex flex-col items-center p-4 rounded-2xl bg-white border-2 border-[#b08d57]/40 shadow-xl text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoQrData.qrDataUrl}
                    alt="Código QR para subir fotos de la boda"
                    className="w-44 h-44 sm:w-48 sm:h-48 object-contain rounded-lg"
                  />
                  <span className="text-[10px] uppercase tracking-widest text-stone-500 font-sans mt-2 font-medium">
                    {event.partnerOneName} &amp; {event.partnerTwoName}
                  </span>
                </div>
              )}
            </div>

            {mediaItems.length === 0 ? (
              <p className={`text-sm ${theme.textMuted} font-sans font-light`}>
                Sé el primero en compartir recuerdos de este día escaneando el QR de las mesas o entrando al álbum digital.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {mediaItems.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() =>
                      item.mediaType !== 'VIDEO' &&
                      openLightbox(
                        mediaItems
                          .filter((m) => m.mediaType !== 'VIDEO')
                          .map((m) => `${API_BASE_URL}/api/public/media/${m.id}/file`),
                        idx
                      )
                    }
                    className="overflow-hidden rounded-2xl border border-current/10 aspect-square relative group cursor-pointer shadow-sm"
                  >
                    {item.mediaType === 'VIDEO' ? (
                      <video
                        src={`${API_BASE_URL}/api/public/media/${item.id}/file`}
                        controls
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`${API_BASE_URL}/api/public/media/${item.id}/file`}
                          alt={item.uploaderName}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ZoomIn className="h-5 w-5 text-white drop-shadow" />
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* PLAYLIST OFICIAL DE SPOTIFY DE LA BODA (Solo Premium y VIP) */}
        {sections.spotifyPlaylist !== false &&
          !isClassicPlan &&
          (event.themeConfig?.spotifyPlaylistUrl || content.spotifyPlaylistUrl) && (
            <section
              id="playlist"
              className={`rounded-3xl border ${theme.borderClass} ${theme.surfaceBg} p-6 sm:p-10 shadow-xl backdrop-blur-sm relative overflow-hidden ${theme.cardBorderGlow}`}
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#b08d57] to-transparent" />

              <div className="text-center max-w-xl mx-auto mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-3">
                  <Disc3 className="h-6 w-6 animate-[spin_10s_linear_infinite]" />
                </div>
                <p className={`text-xs uppercase tracking-[0.3em] font-sans font-medium ${theme.accentText}`}>
                  {content.spotifyPlaylistEyebrow || 'Música & Celebración'}
                </p>
                <h2 className="font-serif text-3xl sm:text-4xl font-light mt-1 text-stone-900 dark:text-[#f7f5f0]">
                  {content.spotifyPlaylistTitle || 'Playlist de Nuestra Boda'}
                </h2>
                <p className={`text-xs sm:text-sm font-sans font-light mt-2 ${theme.textMuted}`}>
                  {content.spotifyPlaylistSubtitle ||
                    'Te compartimos la selección de canciones que musicalizarán nuestra fiesta. ¡Prepárate para cantar y bailar con nosotros!'}
                </p>
              </div>

              {/* Reproductor Embebido Oficial de Spotify */}
              {(() => {
                const embedUrl = getSpotifyPlaylistEmbedUrl(
                  event.themeConfig?.spotifyPlaylistUrl || content.spotifyPlaylistUrl
                );
                if (!embedUrl) return null;
                return (
                  <div className="max-w-2xl mx-auto overflow-hidden rounded-2xl shadow-lg border border-black/5 dark:border-white/10 bg-stone-900">
                    <iframe
                      src={embedUrl}
                      width="100%"
                      height="352"
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      className="w-full"
                      title="Playlist Oficial de la Boda en Spotify"
                    />
                  </div>
                );
              })()}

              {/* Botones de Acción */}
              <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                <a
                  href={event.themeConfig?.spotifyPlaylistUrl || content.spotifyPlaylistUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#1DB954] hover:bg-[#1aa34a] text-white px-6 py-3 text-xs font-semibold uppercase tracking-wider transition shadow-md"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir en Spotify
                </a>

                {sections.wishesWall && (
                  <a
                    href="#wishes"
                    className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-semibold uppercase tracking-wider transition border ${theme.borderClass} ${theme.surfaceMutedBg} hover:opacity-80`}
                  >
                    <Music className="h-4 w-4 text-[#b08d57]" />
                    Recomendar una Canción
                  </a>
                )}
              </div>
            </section>
          )}

        {/* MURO DE BUENOS DESEOS (Solo Premium y VIP) */}
        {sections.wishesWall && !isClassicPlan && (
          <section
            id="wishes"
            className={`rounded-3xl border ${theme.borderClass} ${theme.surfaceBg} p-6 sm:p-10 shadow-lg backdrop-blur-sm ${theme.cardBorderGlow}`}
          >
            <div className="text-center mb-8">
              <MessageSquareHeart className={`h-8 w-8 mx-auto mb-2 ${theme.accentText}`} />
              <h2 className="font-serif text-3xl sm:text-4xl font-light text-stone-900 dark:text-[#f7f5f0]">
                {content.wishesTitle || 'Muro de Buenos Deseos'}
              </h2>
            </div>

            <form onSubmit={handleSendWish} className="grid sm:grid-cols-3 gap-3 mb-8">
              <input
                type="text"
                value={wishAuthor}
                onChange={(e) => setWishAuthor(e.target.value)}
                placeholder="Tu nombre o familia"
                required
                className={`rounded-xl border ${theme.borderClass} bg-transparent px-3.5 py-2.5 text-base sm:text-sm outline-none focus:ring-2 focus:ring-[#b08d57]`}
              />
              <input
                type="text"
                value={wishText}
                onChange={(e) => setWishText(e.target.value)}
                placeholder="Escribe tus bendiciones para los novios..."
                required
                className={`sm:col-span-2 rounded-xl border ${theme.borderClass} bg-transparent px-3.5 py-2.5 text-base sm:text-sm outline-none focus:ring-2 focus:ring-[#b08d57]`}
              />
              <button
                type="submit"
                disabled={sendingWish}
                className={`sm:col-span-3 rounded-full py-3 text-xs font-semibold uppercase tracking-wider transition ${theme.buttonPrimary}`}
              >
                {sendingWish ? 'Publicando deseo...' : 'Inscribir en el Libro de Deseos'}
              </button>
            </form>

            <div className="grid sm:grid-cols-2 gap-4">
              {wishes.map((w) => (
                <div key={w.id} className={`rounded-2xl ${theme.surfaceMutedBg} p-5 border border-current/5 shadow-sm`}>
                  <p className="text-sm font-serif italic text-stone-800 dark:text-stone-200">
                    &ldquo;{w.message}&rdquo;
                  </p>
                  <p className={`text-xs font-sans font-semibold mt-2.5 ${theme.accentText}`}>
                    — {w.authorName}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* PREGUNTAS FRECUENTES */}
        {sections.faq && content.faqItems && content.faqItems.length > 0 && (
          <section
            className={`rounded-3xl border ${theme.borderClass} ${theme.surfaceBg} p-6 sm:p-10 shadow-lg backdrop-blur-sm ${theme.cardBorderGlow}`}
          >
            <div className="text-center mb-8">
              <HelpCircle className={`h-8 w-8 mx-auto mb-2 ${theme.accentText}`} />
              <h2 className="font-serif text-3xl sm:text-4xl font-light text-stone-900 dark:text-[#f7f5f0]">
                {content.faqTitle || 'Preguntas Frecuentes'}
              </h2>
            </div>
            <div className="space-y-3">
              {content.faqItems.map((item, idx) => {
                const isOpen = openFaqIdx === idx;
                return (
                  <div key={idx} className={`rounded-2xl border ${theme.borderClass} overflow-hidden`}>
                    <button
                      type="button"
                      onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-medium text-sm"
                    >
                      <span className="font-serif text-base text-stone-900 dark:text-stone-100">
                        {item.question}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {isOpen && (
                      <div className={`px-4 pb-5 sm:px-5 text-sm leading-relaxed ${theme.textMuted} font-sans font-light`}>
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* PIE DE PÁGINA DE GALA */}
      <footer className={`border-t ${theme.borderClass} py-10 text-center text-xs ${theme.textMuted} relative z-20`}>
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="flex items-center gap-2 font-serif text-base text-stone-800 dark:text-stone-300">
            <Heart className="h-3.5 w-3.5 fill-[#b08d57] text-[#b08d57]" />
            <span>
              {event.partnerOneName} &amp; {event.partnerTwoName}
            </span>
          </div>
          <p className="text-[11px] uppercase tracking-widest text-stone-400 font-sans mt-0.5">
            {formattedDate}
          </p>
        </div>
      </footer>
    </div>
  );
}
