'use client';

import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Check,
  Disc3,
  ExternalLink,
  FolderOpen,
  HardDrive,
  Image as ImageIcon,
  Loader2,
  Music,
  Palette,
  Plus,
  Save,
  Sliders,
  Sparkles,
  Trash2,
  Type,
  Upload,
  Video,
  X,
} from 'lucide-react';
import { apiFetch, resolveAssetUrl, uploadEventAsset } from '@/lib/api';
import { parseAudioSource, getSpotifyPlaylistEmbedUrl } from '@/lib/audioSource';
import { DriveConfigModal } from './DriveConfigModal';
import {
  BankAccountItem,
  EventSectionsConfig,
  EventTheme,
  FaqItem,
  MediaProviderType,
  ParticleEffectType,
  StoryItem,
  WeddingEvent,
} from '@/types/invitation';

interface AdminCustomizerTabProps {
  event: WeddingEvent;
  onUpdated: (ev: WeddingEvent) => void;
}

const FINE_BACKGROUND_PRESETS = [
  {
    id: 'handmade-paper',
    title: 'Papel de Algodón Artesanal',
    desc: 'Textura orgánica y calidez editorial clásica',
    url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1920&q=80',
    opacity: 35,
    blur: 1,
    tag: 'Editorial',
  },
  {
    id: 'white-linen',
    title: 'Lino Blanco Puro',
    desc: 'Trama nupcial de hilo tejido sutil',
    url: 'https://images.unsplash.com/photo-1584589167171-541ce45f1eea?auto=format&fit=crop&w=1920&q=80',
    opacity: 30,
    blur: 1,
    tag: 'Minimalista',
  },
  {
    id: 'warm-marble',
    title: 'Mármol Calacatta Dorado',
    desc: 'Vetas doradas y piedra marfil refinada',
    url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1920&q=80',
    opacity: 25,
    blur: 2,
    tag: 'Gala Imperial',
  },
  {
    id: 'botanical-watercolor',
    title: 'Acuarela Floral Botánica',
    desc: 'Follaje salvia y pigmentos suaves al agua',
    url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1920&q=80',
    opacity: 25,
    blur: 2,
    tag: 'Jardín Nupcial',
  },
];

const DRESS_CODE_PRESETS = [
  { name: 'Gala Nocturna', colors: ['#1c1917', '#57534e', '#b08d57', '#78866b'] },
  { name: 'Neutros & Tierra', colors: ['#2b1f17', '#7c533e', '#c49e7b', '#e8dec8'] },
  { name: 'Salvia & Jardín', colors: ['#1e2d24', '#4d6b53', '#889e83', '#d8e2dc'] },
  { name: 'Borgoña & Oro', colors: ['#4a0e17', '#80182a', '#b08d57', '#d9c5a0'] },
  { name: 'Lavanda & Pastel', colors: ['#2d2738', '#6b5b7b', '#b8a9c9', '#e0d8e8'] },
];

const THEME_METADATA: Record<
  EventTheme,
  { label: string; category: string; description: string; swatches: string[]; sealColor: string }
> = {
  ROMANTIC_EDITORIAL: {
    label: 'Editorial Romántico',
    category: 'Romance Editorial',
    description: 'Marfil cálido, tipografía clásica, cera borgoña y detalles en dorado antiguo.',
    swatches: ['#faf7f2', '#ffffff', '#b08d57', '#8d2b3d', '#1c1917'],
    sealColor: 'burgundy',
  },
  MINIMAL_LUXURY: {
    label: 'Lujo Minimalista',
    category: 'Lujo Contemporáneo',
    description: 'Blanco puro, titanio y negro carbón con estética arquitectónica y lacre grafito.',
    swatches: ['#f8f9fa', '#ffffff', '#1a1d20', '#2e333d', '#111315'],
    sealColor: 'graphite',
  },
  BOTANICAL_GARDEN: {
    label: 'Jardín Botánico',
    category: 'Naturaleza Orgánica',
    description: 'Verde salvia, crema vegetal, cera bosque y estética floral al aire libre.',
    swatches: ['#f3f6f1', '#ffffff', '#4d6b53', '#3b5e43', '#1e2d24'],
    sealColor: 'olive',
  },
  GOLDEN_GLAMOUR: {
    label: 'Glamour Dorado',
    category: 'Gala & Oro',
    description: 'Champán luminoso, oro líquido, chandeliers y elegancia de gala imperial.',
    swatches: ['#fcfaf4', '#ffffff', '#d4af37', '#b58e45', '#231d14'],
    sealColor: 'gold',
  },
  RUSTIC_CHIC: {
    label: 'Rústico Chic',
    category: 'Bohemio & Tierra',
    description: 'Terracota suave, kraft, acentos cálidos y ambiente campestre sofisticado.',
    swatches: ['#fbf7f2', '#ffffff', '#b8613e', '#c46944', '#2b1f17'],
    sealColor: 'terracotta',
  },
  NOCTURNE_ROYAL: {
    label: 'Nocturno Real',
    category: 'Realeza & Noche',
    description: 'Obsidiana profunda, azul noche, lacre medianoche y oro estelar de gala.',
    swatches: ['#0c0e14', '#141822', '#cda658', '#1d263b', '#f7f5f0'],
    sealColor: 'gold',
  },
  CLASSIC_NOCTURNE: {
    label: 'Noche Clásica',
    category: 'Gala Nocturna',
    description: 'Negro medianoche, pizarra, marfil y acentos dorados de etiqueta rigurosa.',
    swatches: ['#0f1115', '#181b22', '#c9a45c', '#1d263b', '#f5efe6'],
    sealColor: 'gold',
  },
  BURGUNDY_VELVET: {
    label: 'Borgoña Velvet',
    category: 'Pasión & Alta Costura',
    description: 'Rojo vino profundo, terciopelo marsala, crema aperlada y lacre borgoña.',
    swatches: ['#fdf7f7', '#ffffff', '#80182a', '#6b1120', '#20050a'],
    sealColor: 'burgundy',
  },
  EMERALD_IMPERIAL: {
    label: 'Esmeralda Imperial',
    category: 'Bosque & Realeza',
    description: 'Verde esmeralda joya, oro imperial, marfil perlado y lacre esmeralda.',
    swatches: ['#f2f8f5', '#ffffff', '#0f6244', '#0a4631', '#06261b'],
    sealColor: 'emerald',
  },
  LAVENDER_PROVENCE: {
    label: 'Lavanda Provenzal',
    category: 'Ensueño & Flores',
    description: 'Lavanda etérea, lila suave, marfil y romance provenzal al atardecer.',
    swatches: ['#f8f5fc', '#ffffff', '#7c5295', '#603978', '#261233'],
    sealColor: 'lavender',
  },
  SAPPHIRE_SERENITY: {
    label: 'Zafiro Celestial',
    category: 'Océano & Majestad',
    description: 'Azul zafiro celestial, plata suave, hielo perlado y lacre azul zafiro.',
    swatches: ['#f2f6fa', '#ffffff', '#1b4d79', '#123454', '#081726'],
    sealColor: 'sapphire',
  },
  TERRACOTTA_SUNSET: {
    label: 'Atardecer Terracota',
    category: 'Calidez Toscana',
    description: 'Teja toscana, arena dorada, cobre cálido y lacre terracota artesanal.',
    swatches: ['#faf5f2', '#ffffff', '#c05c36', '#9c4524', '#36150a'],
    sealColor: 'terracotta',
  },
};

const SECTION_LABELS: Array<{ key: keyof EventSectionsConfig; label: string; desc: string }> = [
  { key: 'heroMusic', label: 'Música de fondo', desc: 'Botón reproductor flotante al abrir el sobre' },
  { key: 'countdown', label: 'Cuenta regresiva', desc: 'Contador en vivo de días, horas y minutos' },
  { key: 'storyGallery', label: 'Historia & Galería', desc: 'Línea de tiempo de la pareja y fotos' },
  { key: 'itinerary', label: 'Itinerario & Mapas', desc: 'Ceremonia, recepción, Google Maps y .ics' },
  { key: 'dressCode', label: 'Código de vestimenta', desc: 'Etiqueta, notas y paleta sugerida' },
  { key: 'giftRegistry', label: 'Mesa de regalos / Sobres', desc: 'Datos bancarios con copia rápida' },
  { key: 'spotifyPlaylist', label: 'Playlist de Spotify', desc: 'Reproductor oficial de Spotify y canciones de la fiesta' },
  { key: 'wishesWall', label: 'Muro de buenos deseos', desc: 'Formulario y mensajes de invitados' },
  { key: 'photoWall', label: 'Álbum QR de fotos/videos', desc: 'Sección y enlace al cargador QR' },
  { key: 'faq', label: 'Preguntas frecuentes', desc: 'Acordeón de dudas comunes' },
];

export function AdminCustomizerTab({ event, onUpdated }: AdminCustomizerTabProps) {
  const [showDriveModal, setShowDriveModal] = useState(false);
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
    driveFolderUrl: event.driveFolderUrl || '',
    photosAlbumId: event.photosAlbumId || '',
    photosAlbumUrl: event.photosAlbumUrl || '',
    photoPin: event.photoPin || '',
    isPrimary: Boolean(event.isPrimary),
    coverSubtitle: event.themeConfig.coverSubtitle || '',
    musicUrl: event.themeConfig.musicUrl || '',
    coverImageUrl: event.themeConfig.coverImageUrl || '',
    waxSealMonogram: event.themeConfig.waxSealMonogram || 'S&J',
    waxSealColor: event.themeConfig.waxSealColor || '',
    particleEffect: (event.themeConfig.particleEffect || 'ROSE_PETALS') as ParticleEffectType,
    backgroundClean: event.themeConfig.backgroundClean ?? true,
    backgroundImageUrl: event.themeConfig.backgroundImageUrl || '',
    backgroundOpacity: event.themeConfig.backgroundOpacity !== undefined ? event.themeConfig.backgroundOpacity : 35,
    backgroundBlur: event.themeConfig.backgroundBlur !== undefined ? event.themeConfig.backgroundBlur : 1,
    backgroundFixed: event.themeConfig.backgroundFixed ?? true,
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
    dressCodeShowPalette:
      c.dressCodeShowPalette !== undefined
        ? Boolean(c.dressCodeShowPalette)
        : Boolean(c.dressCodePalette && c.dressCodePalette.length > 0),
    dressCodePalette: Array.isArray(c.dressCodePalette)
      ? (c.dressCodePalette as string[])
      : ['#1c1917', '#57534e', '#b08d57', '#78866b'],
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
    galleryUrlsText: (c.galleryUrls || []).join('\n'),
    spotifyPlaylistUrl: event.themeConfig.spotifyPlaylistUrl || c.spotifyPlaylistUrl || '',
    spotifyPlaylistTitle: c.spotifyPlaylistTitle || 'Playlist de Nuestra Boda',
    spotifyPlaylistSubtitle:
      c.spotifyPlaylistSubtitle ||
      'Las mejores canciones que sonarán en nuestra fiesta. ¡Prepárate para bailar!',
    sectionsConfig: { ...event.sectionsConfig },
  });

  useEffect(() => {
    const content = event.contentConfig || {};
    setForm((prev) => ({
      ...prev,
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
      driveFolderUrl: event.driveFolderUrl || '',
      photosAlbumId: event.photosAlbumId || '',
      photosAlbumUrl: event.photosAlbumUrl || '',
      photoPin: event.photoPin || '',
      isPrimary: Boolean(event.isPrimary),
      coverSubtitle: event.themeConfig.coverSubtitle || '',
      musicUrl: event.themeConfig.musicUrl || '',
      coverImageUrl: event.themeConfig.coverImageUrl || '',
      waxSealMonogram: event.themeConfig.waxSealMonogram || 'S&J',
      waxSealColor: event.themeConfig.waxSealColor || '',
      particleEffect: (event.themeConfig.particleEffect || 'ROSE_PETALS') as ParticleEffectType,
      backgroundClean: event.themeConfig.backgroundClean ?? true,
      backgroundImageUrl: event.themeConfig.backgroundImageUrl || '',
      backgroundOpacity: event.themeConfig.backgroundOpacity !== undefined ? event.themeConfig.backgroundOpacity : 35,
      backgroundBlur: event.themeConfig.backgroundBlur !== undefined ? event.themeConfig.backgroundBlur : 1,
      backgroundFixed: event.themeConfig.backgroundFixed ?? true,
      moderatePhotos: Boolean(event.themeConfig.moderatePhotos),
      moderateWishes: Boolean(event.themeConfig.moderateWishes),
      galleryUrlsText: (content.galleryUrls || []).join('\n'),
      dressCodeShowPalette:
        content.dressCodeShowPalette !== undefined
          ? Boolean(content.dressCodeShowPalette)
          : Boolean(content.dressCodePalette && content.dressCodePalette.length > 0),
      dressCodePalette: Array.isArray(content.dressCodePalette)
        ? (content.dressCodePalette as string[])
        : ['#1c1917', '#57534e', '#b08d57', '#78866b'],
      spotifyPlaylistUrl: event.themeConfig.spotifyPlaylistUrl || content.spotifyPlaylistUrl || '',
      spotifyPlaylistTitle: content.spotifyPlaylistTitle || 'Playlist de Nuestra Boda',
      spotifyPlaylistSubtitle:
        content.spotifyPlaylistSubtitle ||
        'Las mejores canciones que sonarán en nuestra fiesta. ¡Prepárate para bailar!',
      sectionsConfig: { ...event.sectionsConfig },
    }));
  }, [event]);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBg(true);
    try {
      const res = await uploadEventAsset(event.id, file);
      setForm((p) => ({ ...p, backgroundImageUrl: res.url }));
      const updateRes = await apiFetch<{ event: WeddingEvent }>(`/api/events/${event.id}`, {
        method: 'PUT',
        auth: true,
        body: JSON.stringify({
          themeConfig: {
            ...event.themeConfig,
            backgroundImageUrl: res.url,
            backgroundOpacity: form.backgroundOpacity,
            backgroundBlur: form.backgroundBlur,
            backgroundFixed: form.backgroundFixed,
          },
        }),
      });
      if (updateRes.event) onUpdated(updateRes.event);
      toast.success('Imagen de fondo subida y guardada');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al subir fondo');
    } finally {
      setUploadingBg(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveBackground = async () => {
    setForm((p) => ({ ...p, backgroundImageUrl: '' }));
    try {
      const updateRes = await apiFetch<{ event: WeddingEvent }>(`/api/events/${event.id}`, {
        method: 'PUT',
        auth: true,
        body: JSON.stringify({
          themeConfig: {
            ...event.themeConfig,
            backgroundImageUrl: '',
          },
        }),
      });
      if (updateRes.event) onUpdated(updateRes.event);
      toast.success('Imagen de fondo eliminada');
    } catch {
      toast.error('Error al quitar fondo');
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const res = await uploadEventAsset(event.id, file);
      setForm((p) => ({ ...p, coverImageUrl: res.url }));
      const updateRes = await apiFetch<{ event: WeddingEvent }>(`/api/events/${event.id}`, {
        method: 'PUT',
        auth: true,
        body: JSON.stringify({
          themeConfig: {
            ...event.themeConfig,
            coverImageUrl: res.url,
          },
        }),
      });
      if (updateRes.event) onUpdated(updateRes.event);
      toast.success('Foto de portada subida y guardada');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al subir la imagen');
    } finally {
      setUploadingCover(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingGallery(true);
    try {
      const res = await uploadEventAsset(event.id, Array.from(files));
      const current = form.galleryUrlsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      const updatedList = [...current, ...res.urls];
      setForm((p) => ({ ...p, galleryUrlsText: updatedList.join('\n') }));
      const updateRes = await apiFetch<{ event: WeddingEvent }>(`/api/events/${event.id}`, {
        method: 'PUT',
        auth: true,
        body: JSON.stringify({
          contentConfig: {
            ...event.contentConfig,
            galleryUrls: updatedList,
          },
        }),
      });
      if (updateRes.event) onUpdated(updateRes.event);
      toast.success(`${res.urls.length} foto(s) agregada(s) y guardada(s)`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al subir fotos');
    } finally {
      setUploadingGallery(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveGalleryImage = async (indexToRemove: number) => {
    const urls = form.galleryUrlsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    urls.splice(indexToRemove, 1);
    setForm((p) => ({ ...p, galleryUrlsText: urls.join('\n') }));
    try {
      const updateRes = await apiFetch<{ event: WeddingEvent }>(`/api/events/${event.id}`, {
        method: 'PUT',
        auth: true,
        body: JSON.stringify({
          contentConfig: {
            ...event.contentConfig,
            galleryUrls: urls,
          },
        }),
      });
      if (updateRes.event) onUpdated(updateRes.event);
      toast.success('Foto eliminada de la galería');
    } catch {
      toast.error('Error al actualizar la galería');
    }
  };

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
        driveFolderUrl: form.driveFolderUrl.trim() || null,
        photosAlbumId: form.photosAlbumId || null,
        photosAlbumUrl: form.photosAlbumUrl.trim() || null,
        photoPin: form.photoPin || null,
        isPrimary: form.isPrimary,
        sectionsConfig: form.sectionsConfig,
        themeConfig: {
          ...event.themeConfig,
          coverSubtitle: form.coverSubtitle,
          musicUrl: form.musicUrl,
          spotifyPlaylistUrl: form.spotifyPlaylistUrl,
          coverImageUrl: form.coverImageUrl,
          waxSealMonogram: form.waxSealMonogram.trim() || 'S&J',
          waxSealColor: form.waxSealColor || undefined,
          particleEffect: form.particleEffect,
          backgroundClean: form.backgroundClean,
          backgroundImageUrl: form.backgroundImageUrl,
          backgroundOpacity: Number(form.backgroundOpacity),
          backgroundBlur: Number(form.backgroundBlur),
          backgroundFixed: Boolean(form.backgroundFixed),
          moderatePhotos: form.moderatePhotos,
          moderateWishes: form.moderateWishes,
        },
        contentConfig: {
          ...event.contentConfig,
          spotifyPlaylistUrl: form.spotifyPlaylistUrl,
          spotifyPlaylistTitle: form.spotifyPlaylistTitle,
          spotifyPlaylistSubtitle: form.spotifyPlaylistSubtitle,
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
          dressCodeShowPalette: form.dressCodeShowPalette,
          dressCodePalette: form.dressCodeShowPalette ? form.dressCodePalette : [],
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
          galleryUrls: form.galleryUrlsText
            .split('\n')
            .map((s) => s.trim())
            .filter((s) => s.length > 0),
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

      {/* Selector de 12 Paletas y Diseños de Gala */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-amber-700" />
            <h4 className="font-semibold text-sm text-stone-900">
              Paletas de Color &amp; Diseños de Gala (12 Estilos Exclusivos)
            </h4>
          </div>
          <span className="text-xs text-stone-500 font-medium">
            Selecciona el tema visual para la invitación y el sobre
          </span>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Object.keys(THEME_METADATA) as EventTheme[]).map((themeKey) => {
            const meta = THEME_METADATA[themeKey];
            const selected = form.theme === themeKey;
            return (
              <button
                key={themeKey}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, theme: themeKey }))}
                className={`group text-left rounded-2xl border-2 p-4 transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                  selected
                    ? 'border-amber-600 bg-amber-50/50 shadow-md ring-2 ring-amber-600/20'
                    : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 text-stone-700 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                      {meta.category}
                    </span>
                    {selected && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                        <Check className="h-3 w-3" /> Activo
                      </span>
                    )}
                  </div>
                  <h5 className="font-semibold text-sm text-stone-900 group-hover:text-amber-900 transition-colors">
                    {meta.label}
                  </h5>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    {meta.description}
                  </p>
                </div>

                {/* Fila de Swatches Cromáticos Circulares */}
                <div className="mt-4 pt-3 border-t border-stone-200/60 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-stone-600 font-bold">
                    Paleta
                  </span>
                  <div className="flex items-center gap-1.5">
                    {meta.swatches.map((color, idx) => (
                      <span
                        key={idx}
                        title={`Color #${idx + 1}: ${color}`}
                        className="w-4 h-4 rounded-full border border-stone-300/80 shadow-xs inline-block transition-transform group-hover:scale-110"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sello de Cera Artesanal 3D & Monograma Parametrizable */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-700" />
            <h4 className="font-semibold text-sm text-stone-900">
              Sello de Cera Artesanal 3D (Sobre de la Invitación)
            </h4>
          </div>
          <span className="text-xs text-amber-800 bg-amber-50 border border-amber-200 font-medium px-2.5 py-0.5 rounded-full">
            100% Parametrizable
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-center">
          {/* Vista previa 3D en vivo del lacre */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-stone-950/5 border border-stone-200 text-center">
            <div
              className="relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl"
              style={{
                borderRadius: '50% 50% 49% 51% / 51% 49% 50% 50%',
                background:
                  (form.waxSealColor === 'gold' || (!form.waxSealColor && ['CLASSIC_NOCTURNE', 'NOCTURNE_ROYAL', 'GOLDEN_GLAMOUR'].includes(form.theme)))
                    ? 'radial-gradient(circle at 35% 32%, #fff0b3 0%, #d4af37 40%, #997318 75%, #5a4005 100%)'
                    : (form.waxSealColor === 'olive' || (!form.waxSealColor && form.theme === 'BOTANICAL_GARDEN'))
                    ? 'radial-gradient(circle at 35% 32%, #6b8f71 0%, #3d5a42 45%, #253928 80%, #141f16 100%)'
                    : (form.waxSealColor === 'emerald' || (!form.waxSealColor && form.theme === 'EMERALD_IMPERIAL'))
                    ? 'radial-gradient(circle at 35% 32%, #10b981 0%, #065f46 45%, #04392a 80%, #021f17 100%)'
                    : (form.waxSealColor === 'sapphire' || (!form.waxSealColor && form.theme === 'SAPPHIRE_SERENITY'))
                    ? 'radial-gradient(circle at 35% 32%, #38bdf8 0%, #1e3a8a 45%, #0f172a 80%, #080c18 100%)'
                    : (form.waxSealColor === 'terracotta' || (!form.waxSealColor && ['TERRACOTTA_SUNSET', 'RUSTIC_CHIC'].includes(form.theme)))
                    ? 'radial-gradient(circle at 35% 32%, #ea580c 0%, #9a3412 45%, #591d08 80%, #2f0d03 100%)'
                    : (form.waxSealColor === 'lavender' || (!form.waxSealColor && form.theme === 'LAVENDER_PROVENCE'))
                    ? 'radial-gradient(circle at 35% 32%, #c084fc 0%, #7e22ce 45%, #4c1d95 80%, #260a52 100%)'
                    : (form.waxSealColor === 'graphite' || (!form.waxSealColor && form.theme === 'MINIMAL_LUXURY'))
                    ? 'radial-gradient(circle at 35% 32%, #64748b 0%, #334155 45%, #1e293b 80%, #0f172a 100%)'
                    : 'radial-gradient(circle at 35% 32%, #b52236 0%, #7d0d1d 45%, #4f0611 80%, #290308 100%)',
                boxShadow: '0 10px 24px -4px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -4px 6px rgba(0,0,0,0.7)',
              }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center border border-white/30"
                style={{
                  border: '1.5px dashed rgba(255,255,255,0.4)',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.55), 0 1px 2px rgba(255,255,255,0.25)',
                }}
              >
                <span
                  className="font-serif text-xl font-bold tracking-tight text-white select-none"
                  style={{ textShadow: '-1px -1px 1px rgba(255,255,255,0.35), 1px 1px 2px rgba(0,0,0,0.95)' }}
                >
                  {(form.waxSealMonogram || 'S&J').includes('&') ? (
                    <>
                      <span>{(form.waxSealMonogram || 'S&J').split('&')[0].trim()}</span>
                      <span className="text-xs font-light mx-0.5 italic opacity-90">&amp;</span>
                      <span>{(form.waxSealMonogram || 'S&J').split('&')[1].trim()}</span>
                    </>
                  ) : (
                    form.waxSealMonogram || 'S&J'
                  )}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-stone-500 mt-3 font-medium">
              Vista previa del grabado en el sobre
            </p>
          </div>

          {/* Opciones y controles de edición */}
          <div className="md:col-span-2 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Monograma de los Novios (Grabado en Relieve)
              </label>
              <input
                type="text"
                maxLength={8}
                value={form.waxSealMonogram}
                onChange={(e) => setForm((p) => ({ ...p, waxSealMonogram: e.target.value }))}
                placeholder="Ej. S&J"
                className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-base font-serif font-bold text-stone-900 tracking-wider"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                Puedes colocar <strong>S&amp;J</strong>, <strong>J&amp;S</strong> o el monograma que prefieras para sellar el sobre de gala.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, waxSealMonogram: 'S&J' }))}
                className="rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-900 transition"
              >
                Poner &quot;S&amp;J&quot; (Santiago &amp; Joselin)
              </button>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, waxSealMonogram: 'J&S' }))}
                className="rounded-lg border border-stone-300 bg-stone-50 hover:bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-700 transition"
              >
                Poner &quot;J&amp;S&quot; (Joselin &amp; Santiago)
              </button>
              <button
                type="button"
                onClick={() => {
                  const p1 = (form.partnerOneName?.[0] || 'S').toUpperCase();
                  const p2 = (form.partnerTwoName?.[0] || 'J').toUpperCase();
                  setForm((p) => ({ ...p, waxSealMonogram: `${p1}&${p2}` }));
                }}
                className="rounded-lg border border-stone-200 bg-white hover:bg-stone-50 px-3 py-1.5 text-xs text-stone-600 transition"
              >
                Iniciales automáticas
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Atmósfera Visual: Partículas Ambientales y Fondo Limpio */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-700" />
            <h4 className="font-semibold text-sm text-stone-900">
              Atmósfera Visual &amp; Partículas Ambientales
            </h4>
          </div>
          <span className="text-xs text-amber-800 bg-amber-50 border border-amber-200 font-medium px-2.5 py-0.5 rounded-full">
            Efectos de Gala
          </span>
        </div>

        {/* Selector de Partículas */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-700">
              Efecto de Partículas Flotantes (Lluvia Ambiental)
            </label>
            <span className="text-xs text-stone-500">
              Configurado actualmente:{' '}
              <strong className="text-stone-800">
                {form.particleEffect === 'ROSE_PETALS'
                  ? 'Pétalos de Rosas de Gala'
                  : form.particleEffect === 'GOLD_SPARKLES'
                  ? 'Polvo de Oro & Destellos (✦)'
                  : form.particleEffect === 'BOTANICAL_LEAVES'
                  ? 'Hojas de Olivo & Salvia'
                  : form.particleEffect === 'LAVENDER_PETALS'
                  ? 'Pétalos de Lavanda'
                  : form.particleEffect === 'CELESTIAL_SPARKLES'
                  ? 'Cristales Zafiro & Diamante'
                  : form.particleEffect === 'NONE'
                  ? 'Sin Partículas (Desactivado)'
                  : 'Automático según Tema'}
              </strong>
            </span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                id: 'ROSE_PETALS' as ParticleEffectType,
                title: 'Pétalos de Rosas de Gala',
                badge: 'Recomendado',
                desc: 'Pétalos de rosas reales con caída, curvatura y balanceo 3D en terciopelo y rubor.',
                icon: '🌹',
                colors: ['#7e182b', '#ba324b', '#efa9b8', '#f4ecdc'],
              },
              {
                id: 'GOLD_SPARKLES' as ParticleEffectType,
                title: 'Polvo de Oro & Destellos (✦)',
                badge: 'Gala Imperial',
                desc: 'Estrellas de 4 puntas y destellos dorados con resplandor suave y centelleo.',
                icon: '✨',
                colors: ['#d4af37', '#ffd700', '#f3e5ab', '#ffffff'],
              },
              {
                id: 'BOTANICAL_LEAVES' as ParticleEffectType,
                title: 'Hojas de Olivo & Salvia',
                badge: 'Jardín Campestre',
                desc: 'Hojas botánicas lanceoladas con venación y movimiento orgánico al viento.',
                icon: '🍃',
                colors: ['#5a735c', '#758f77', '#93aa95', '#cddccd'],
              },
              {
                id: 'LAVENDER_PETALS' as ParticleEffectType,
                title: 'Pétalos de Lavanda',
                badge: 'Provenza',
                desc: 'Pétalos delicados y floretes en tonos violeta y lila etéreo.',
                icon: '🪻',
                colors: ['#7c5295', '#9d7bb0', '#bfa6d1', '#f1ebf7'],
              },
              {
                id: 'CELESTIAL_SPARKLES' as ParticleEffectType,
                title: 'Cristales Zafiro & Diamante',
                badge: 'Celestial',
                desc: 'Destellos prismáticos y cristales celestes con micro-partículas plateadas.',
                icon: '💎',
                colors: ['#1e40af', '#3b82f6', '#93c5fd', '#ffffff'],
              },
              {
                id: 'AUTO' as ParticleEffectType,
                title: 'Automático según Tema',
                badge: 'Dinámico',
                desc: 'Selecciona pétalos, destellos u hojas automáticamente según el tema de color.',
                icon: '🎨',
                colors: ['#b08d57', '#8d2b3d', '#3b5e43', '#1d263b'],
              },
              {
                id: 'NONE' as ParticleEffectType,
                title: 'Sin Partículas',
                badge: 'Minimalista',
                desc: 'Fondo totalmente despejado sin animaciones flotantes (0 consumo de recursos).',
                icon: '🚫',
                colors: ['#d6d3d1', '#a8a29e', '#78716c'],
              },
            ].map((opt) => {
              const isSelected = form.particleEffect === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, particleEffect: opt.id }))}
                  className={`group text-left rounded-2xl border-2 p-3.5 transition-all duration-200 relative flex flex-col justify-between ${
                    isSelected
                      ? 'border-amber-600 bg-amber-50/40 shadow-sm ring-2 ring-amber-600/15'
                      : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xl" role="img" aria-label={opt.title}>
                        {opt.icon}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          isSelected
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-stone-100 text-stone-600 border-stone-200'
                        }`}
                      >
                        {opt.badge}
                      </span>
                    </div>
                    <h5 className="font-semibold text-xs text-stone-900 group-hover:text-amber-950 transition-colors">
                      {opt.title}
                    </h5>
                    <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                      {opt.desc}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-stone-200/60 flex items-center justify-between">
                    <span className="text-[10px] text-stone-500 font-medium">Tonalidades</span>
                    <div className="flex items-center gap-1">
                      {opt.colors.map((c, i) => (
                        <span
                          key={i}
                          className="w-3.5 h-3.5 rounded-full border border-stone-300/80 shadow-2xs inline-block"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Toggle para Fondo Limpio sin Puntos */}
        <div className="pt-4 border-t border-stone-100">
          <div className="flex items-center justify-between p-4 rounded-xl border border-stone-200 bg-stone-50/60">
            <div>
              <h5 className="text-xs font-semibold text-stone-900">
                Fondo Limpio y Minimalista (Sin Puntos ni Mallas)
              </h5>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Mantiene el fondo liso en el tono de papel nupcial elegido, sin tramas de puntos ni cuadrículas.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.backgroundClean}
                onChange={(e) => setForm((p) => ({ ...p, backgroundClean: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Lienzo de Fondo & Texturas Nupciales (Imagen de Fondo Personalizada) */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-amber-700" />
            <div>
              <h4 className="font-semibold text-sm text-stone-900">
                Lienzo de Fondo Personalizado (Toda la Invitación)
              </h4>
              <p className="text-xs text-stone-500">
                Sube tu propia foto, textura o diseño para ambientar la entrada y todo el recorrido de la invitación
              </p>
            </div>
          </div>
          <span className="text-xs text-amber-800 bg-amber-50 border border-amber-200 font-medium px-2.5 py-0.5 rounded-full">
            100% Personalizable
          </span>
        </div>

        {/* Presets Rápidos de Papelería Fina */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-700">
              Fondos &amp; Texturas Sugeridas de Alta Costura
            </label>
            <span className="text-[11px] text-stone-400">1-Clic para aplicar</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {FINE_BACKGROUND_PRESETS.map((preset) => {
              const isActive = form.backgroundImageUrl === preset.url;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setForm((p) => ({
                      ...p,
                      backgroundImageUrl: preset.url,
                      backgroundOpacity: preset.opacity,
                      backgroundBlur: preset.blur,
                      backgroundClean: false,
                    }));
                    toast.success(`Fondo "${preset.title}" aplicado`);
                  }}
                  className={`group text-left rounded-xl border-2 p-2.5 transition-all relative overflow-hidden flex flex-col justify-between ${
                    isActive
                      ? 'border-amber-600 bg-amber-50/50 ring-2 ring-amber-600/15'
                      : 'border-stone-200 hover:border-amber-300 hover:bg-stone-50/60'
                  }`}
                >
                  <div
                    className="h-16 w-full rounded-lg bg-cover bg-center border border-stone-200/80 mb-2 relative overflow-hidden"
                    style={{ backgroundImage: `url(${preset.url})` }}
                  >
                    <span className="absolute top-1 right-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs">
                      {preset.tag}
                    </span>
                  </div>
                  <div>
                    <h6 className="font-semibold text-xs text-stone-900 group-hover:text-amber-900 truncate">
                      {preset.title}
                    </h6>
                    <p className="text-[10px] text-stone-500 mt-0.5 line-clamp-1">
                      {preset.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input de URL o Subir Archivo Propio */}
        <div className="space-y-3 pt-2 border-t border-stone-100">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="block text-xs font-medium text-stone-700">
              Foto o Imagen de Fondo Propia
            </label>
            <div className="flex items-center gap-2">
              <input
                ref={bgInputRef}
                type="file"
                accept="image/*"
                onChange={handleBgUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => bgInputRef.current?.click()}
                disabled={uploadingBg}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-900 transition disabled:opacity-50"
              >
                {uploadingBg ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-700" />
                ) : (
                  <Upload className="h-3.5 w-3.5 text-amber-700" />
                )}
                <span>{uploadingBg ? 'Subiendo imagen...' : 'Subir Fondo de tu Equipo'}</span>
              </button>
              {form.backgroundImageUrl && (
                <button
                  type="button"
                  onClick={handleRemoveBackground}
                  className="inline-flex items-center gap-1 rounded-xl border border-stone-200 hover:border-red-300 hover:bg-red-50 px-2.5 py-1.5 text-xs font-medium text-stone-600 hover:text-red-700 transition"
                  title="Quitar fondo y volver al tono de papel limpio"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Quitar Fondo</span>
                </button>
              )}
            </div>
          </div>

          <input
            type="text"
            value={form.backgroundImageUrl}
            onChange={(e) => setForm((p) => ({ ...p, backgroundImageUrl: e.target.value }))}
            placeholder="https://... o sube una imagen con el botón superior"
            className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-xs font-mono text-stone-800 placeholder-stone-400 focus:border-amber-600 focus:outline-none"
          />

          {/* Previsualización en Vivo de la Imagen de Fondo */}
          {form.backgroundImageUrl && (
            <div className="relative rounded-2xl border border-stone-200 p-4 bg-stone-900/5 overflow-hidden flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-28 h-20 rounded-xl overflow-hidden border border-stone-300 shrink-0 shadow-sm">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-all duration-300"
                  style={{
                    backgroundImage: `url(${resolveAssetUrl(form.backgroundImageUrl)})`,
                    opacity: form.backgroundOpacity / 100,
                    filter: form.backgroundBlur ? `blur(${form.backgroundBlur}px)` : undefined,
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs">
                    {form.backgroundOpacity}%
                  </span>
                </div>
              </div>

              <div className="min-w-0 flex-1 space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="text-xs font-semibold text-stone-900 truncate">
                    {form.backgroundImageUrl.split('/').pop() || 'Imagen personalizada'}
                  </span>
                  <a
                    href={resolveAssetUrl(form.backgroundImageUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-amber-800 hover:underline font-medium inline-flex items-center gap-0.5"
                  >
                    <ExternalLink className="h-3 w-3" /> Ver
                  </a>
                </div>
                <p className="text-[11px] text-stone-500">
                  El escudo protector de legibilidad se encuentra activo para que los textos ceremoniales, nombres y fechas contrasten con máxima nitidez.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Ajustes de Opacidad y Desenfoque (Blur) para Legibilidad */}
        {form.backgroundImageUrl && (
          <div className="grid sm:grid-cols-2 gap-4 pt-3 border-t border-stone-100">
            {/* Opacidad */}
            <div className="space-y-2 p-3.5 rounded-xl border border-stone-200 bg-stone-50/60">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-800">
                  Opacidad de la Imagen ({form.backgroundOpacity}%)
                </label>
                <span className="text-[11px] text-stone-500">
                  {form.backgroundOpacity <= 20
                    ? 'Muy sutil'
                    : form.backgroundOpacity <= 45
                    ? 'Recomendado'
                    : form.backgroundOpacity <= 70
                    ? 'Marcado'
                    : 'Intenso'}
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={100}
                step={5}
                value={form.backgroundOpacity}
                onChange={(e) => setForm((p) => ({ ...p, backgroundOpacity: Number(e.target.value) }))}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[15, 25, 35, 50, 80].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, backgroundOpacity: v }))}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium border transition ${
                      form.backgroundOpacity === v
                        ? 'border-amber-600 bg-amber-100 text-amber-900 font-bold'
                        : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {v}%
                  </button>
                ))}
              </div>
            </div>

            {/* Desenfoque (Blur) */}
            <div className="space-y-2 p-3.5 rounded-xl border border-stone-200 bg-stone-50/60">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-800">
                  Desenfoque Suave / Blur ({form.backgroundBlur}px)
                </label>
                <span className="text-[11px] text-stone-500">
                  {form.backgroundBlur === 0
                    ? 'Nítido'
                    : form.backgroundBlur <= 2
                    ? 'Sutil'
                    : form.backgroundBlur <= 6
                    ? 'Suave'
                    : 'Bokeh artístico'}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={16}
                step={1}
                value={form.backgroundBlur}
                onChange={(e) => setForm((p) => ({ ...p, backgroundBlur: Number(e.target.value) }))}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { v: 0, label: '0px (Nítido)' },
                  { v: 1, label: '1px' },
                  { v: 2, label: '2px (Recomendado)' },
                  { v: 4, label: '4px' },
                  { v: 8, label: '8px (Bokeh)' },
                ].map((item) => (
                  <button
                    key={item.v}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, backgroundBlur: item.v }))}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium border transition ${
                      form.backgroundBlur === item.v
                        ? 'border-amber-600 bg-amber-100 text-amber-900 font-bold'
                        : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modo Parallax / Fijo */}
        {form.backgroundImageUrl && (
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-stone-200 bg-stone-50/60">
            <div>
              <h6 className="text-xs font-semibold text-stone-900">
                Fijar Imagen de Fondo en Pantalla (Efecto Parallax Nupcial)
              </h6>
              <p className="text-[11px] text-stone-500 mt-0.5">
                La imagen permanece fija de fondo mientras el invitado se desplaza suavemente por la invitación.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.backgroundFixed}
                onChange={(e) => setForm((p) => ({ ...p, backgroundFixed: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>
        )}
      </div>

      {/* Destino de Fotos / Videos / Archivos (Google Photos vs Drive vs Híbrido) */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-amber-700" />
            <h4 className="font-semibold text-sm text-stone-900">
              Destino de Carga QR (Google Photos / Google Drive)
            </h4>
          </div>
          <button
            type="button"
            onClick={() => setShowDriveModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-stone-50 hover:bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-700 transition"
          >
            <FolderOpen className="h-3.5 w-3.5 text-amber-700" />
            <span>Configuración Avanzada & Vincular Google</span>
          </button>
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

        <div className="grid sm:grid-cols-2 gap-3 pt-2">
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              URL del Álbum de Google Photos (Recomendado para QR)
            </label>
            <input
              type="url"
              value={form.photosAlbumUrl}
              onChange={(e) => {
                const val = e.target.value;
                setForm((p) => ({
                  ...p,
                  photosAlbumUrl: val,
                  photosAlbumId: val && !val.startsWith('http') ? val : p.photosAlbumId,
                }));
              }}
              placeholder="https://photos.app.goo.gl/... o https://photos.google.com/share/..."
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs font-mono"
            />
            <p className="text-[11px] text-stone-500 mt-1">
              Al colocar tu enlace aquí, el código QR de las mesas y los botones de la invitación llevarán directamente a los invitados a este álbum.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              URL de Carpeta en Google Drive (Opcional)
            </label>
            <input
              type="url"
              value={form.driveFolderUrl}
              onChange={(e) => {
                const val = e.target.value;
                setForm((p) => ({
                  ...p,
                  driveFolderUrl: val,
                  driveFolderId: val && !val.startsWith('http') ? val : p.driveFolderId,
                }));
              }}
              placeholder="https://drive.google.com/drive/folders/..."
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs font-mono"
            />
            <p className="text-[11px] text-stone-500 mt-1">
              Enlace directo si prefieres que los invitados abran una carpeta compartida de Google Drive.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 pt-2">
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">
              ID Álbum Google Photos (Avanzado)
            </label>
            <input
              type="text"
              value={form.photosAlbumId}
              onChange={(e) => {
                const val = e.target.value;
                setForm((p) => ({
                  ...p,
                  photosAlbumId: val,
                  photosAlbumUrl: val.startsWith('http') ? val : p.photosAlbumUrl,
                }));
              }}
              placeholder="Se crea automáticamente al subir"
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">
              ID Carpeta Google Drive (Avanzado)
            </label>
            <input
              type="text"
              value={form.driveFolderId}
              onChange={(e) => {
                const val = e.target.value;
                setForm((p) => ({
                  ...p,
                  driveFolderId: val,
                  driveFolderUrl: val.startsWith('http') ? val : p.driveFolderUrl,
                }));
              }}
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

        {/* FOTO DE PORTADA */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-stone-600">
              Foto de Portada (Opcional)
            </label>
            <div className="flex items-center gap-1.5">
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-700 transition disabled:opacity-50"
              >
                {uploadingCover ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-700" />
                ) : (
                  <Upload className="h-3.5 w-3.5 text-amber-700" />
                )}
                <span>{uploadingCover ? 'Subiendo...' : 'Subir Foto'}</span>
              </button>
            </div>
          </div>
          <input
            type="text"
            value={form.coverImageUrl}
            onChange={(e) => setForm((p) => ({ ...p, coverImageUrl: e.target.value }))}
            placeholder="https://... o sube una imagen de tu equipo"
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm font-mono text-xs"
          />
          {form.coverImageUrl && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-stone-50 border border-stone-200 shadow-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveAssetUrl(form.coverImageUrl)}
                alt="Vista previa de portada"
                className="w-20 h-20 rounded-xl object-cover border border-stone-300 shadow-sm shrink-0"
              />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 border border-emerald-200">
                    Portada Activa
                  </span>
                  <a
                    href={resolveAssetUrl(form.coverImageUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-amber-800 hover:underline font-medium"
                  >
                    <ExternalLink className="h-3 w-3" /> Ver completa
                  </a>
                </div>
                <p className="text-xs font-semibold text-stone-800 truncate" title={form.coverImageUrl}>
                  {form.coverImageUrl.split('/').pop() || 'Foto de portada'}
                </p>
                <p className="text-[11px] text-stone-500">
                  Visible en la portada principal con encuadre editorial adaptativo
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  setForm((p) => ({ ...p, coverImageUrl: '' }));
                  try {
                    const updateRes = await apiFetch<{ event: WeddingEvent }>(`/api/events/${event.id}`, {
                      method: 'PUT',
                      auth: true,
                      body: JSON.stringify({
                        themeConfig: {
                          ...event.themeConfig,
                          coverImageUrl: '',
                        },
                      }),
                    });
                    if (updateRes.event) onUpdated(updateRes.event);
                    toast.success('Foto de portada eliminada');
                  } catch {
                    toast.error('Error al quitar foto de portada');
                  }
                }}
                className="p-2 text-stone-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition"
                title="Quitar foto de portada"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* MÚSICA DE FONDO (YOUTUBE / SPOTIFY / MP3) */}
        <div className="space-y-2">
          {(() => {
            const parsedAudio = parseAudioSource(form.musicUrl);
            return (
              <>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-stone-600">
                    Música de Fondo (YouTube / Spotify / MP3)
                  </label>
                  {parsedAudio.type === 'youtube' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700 border border-red-200">
                      <Video className="h-3 w-3" /> YouTube Video
                    </span>
                  )}
                  {parsedAudio.type === 'spotify' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200">
                      <Disc3 className="h-3 w-3" /> Spotify Track
                    </span>
                  )}
                  {parsedAudio.type === 'mp3' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-200">
                      <Music className="h-3 w-3" /> Archivo MP3
                    </span>
                  )}
                </div>
                <input
                  type="url"
                  value={form.musicUrl}
                  onChange={(e) => setForm((p) => ({ ...p, musicUrl: e.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=... o link de Spotify o archivo .mp3"
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
                />
                <p className="text-[11px] text-stone-500">
                  Esta canción sonará automáticamente al abrir el sobre de gala o con el reproductor de vinilo.
                </p>
              </>
            );
          })()}
        </div>

        {/* PLAYLIST DE SPOTIFY DE LA BODA */}
        <div className="md:col-span-2 space-y-2">
          {(() => {
            const spotifyEmbedUrl = getSpotifyPlaylistEmbedUrl(form.spotifyPlaylistUrl);
            return (
              <>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-stone-600">
                    Playlist de Spotify de la Boda (Opcional)
                  </label>
                  {form.spotifyPlaylistUrl && (
                    <a
                      href={form.spotifyPlaylistUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:underline font-medium"
                    >
                      <ExternalLink className="h-3 w-3" /> Abrir en Spotify
                    </a>
                  )}
                </div>
                <input
                  type="url"
                  value={form.spotifyPlaylistUrl}
                  onChange={(e) => setForm((p) => ({ ...p, spotifyPlaylistUrl: e.target.value }))}
                  placeholder="https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M"
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
                />
                <p className="text-[11px] text-stone-500">
                  Pega el enlace de la lista de reproducción de la boda. Se desplegará el reproductor oficial interactivo de Spotify en la invitación para tus invitados.
                </p>

                {spotifyEmbedUrl && (
                  <div className="mt-2 rounded-2xl overflow-hidden border border-emerald-200/80 bg-stone-900 shadow-md">
                    <iframe
                      src={spotifyEmbedUrl}
                      width="100%"
                      height="152"
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      className="w-full"
                      title="Vista previa Playlist Spotify"
                    />
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* GALERÍA DE FOTOS PRENUPCIALES */}
        <div className="md:col-span-2 space-y-2">
          {(() => {
            const galleryList = form.galleryUrlsText
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean);

            return (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="block text-xs font-medium text-stone-600">
                      Galería de Fotos Prenupciales
                    </label>
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600">
                      {galleryList.length} foto{galleryList.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      ref={galleryInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleGalleryUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      disabled={uploadingGallery}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-700 transition disabled:opacity-50"
                    >
                      {uploadingGallery ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-700" />
                      ) : (
                        <Upload className="h-3.5 w-3.5 text-amber-700" />
                      )}
                      <span>{uploadingGallery ? 'Subiendo fotos...' : 'Subir Fotos (Múltiples)'}</span>
                    </button>
                  </div>
                </div>

                {/* Mosaico de Miniaturas con Borrado Rápido */}
                {galleryList.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 p-2 rounded-xl bg-stone-50 border border-stone-200 max-h-48 overflow-y-auto">
                    {galleryList.map((url, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border border-stone-300 aspect-square bg-stone-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={resolveAssetUrl(url)}
                          alt={`Foto galería ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <a
                          href={resolveAssetUrl(url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute bottom-1 left-1 bg-black/75 hover:bg-black text-white rounded p-1 opacity-0 group-hover:opacity-100 transition shadow"
                          title="Ver en resolución completa"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemoveGalleryImage(idx)}
                          className="absolute top-1 right-1 bg-black/75 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow"
                          title="Eliminar de la galería"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <textarea
                  rows={3}
                  value={form.galleryUrlsText}
                  onChange={(e) => setForm((p) => ({ ...p, galleryUrlsText: e.target.value }))}
                  placeholder="https://ejemplo.com/foto1.jpg&#10;https://ejemplo.com/foto2.jpg"
                  className="w-full rounded-xl border border-stone-300 p-2.5 text-xs font-mono"
                />
                <p className="text-[11px] text-stone-500">
                  Puedes subir fotos directamente con el botón o pegar URLs externas (una por línea). Se desplegarán en el mosaico editorial de la invitación.
                </p>
              </>
            );
          })()}
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
          {/* CÓDIGO DE VESTIMENTA & PALETA OPCIONAL */}
          <div className="md:col-span-2 rounded-2xl border border-stone-200 bg-stone-50/70 p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/60 pb-3">
              <div>
                <h4 className="text-sm font-serif font-semibold text-stone-900">Código de Vestimenta & Paleta Opcional</h4>
                <p className="text-xs text-stone-500">
                  Define la etiqueta y decide si deseas sugerir una paleta de colores para los invitados o dejarlo solo en texto.
                </p>
              </div>
              <label className="inline-flex items-center gap-2 cursor-pointer select-none bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-sm">
                <input
                  type="checkbox"
                  checked={form.dressCodeShowPalette}
                  onChange={(e) => setForm((p) => ({ ...p, dressCodeShowPalette: e.target.checked }))}
                  className="rounded text-[#b08d57] focus:ring-[#b08d57]"
                />
                <span className="text-xs font-medium text-stone-800">
                  {form.dressCodeShowPalette ? 'Paleta activada' : 'Paleta oculta (Solo texto)'}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Código de Vestimenta - Título</label>
                <input
                  type="text"
                  value={form.dressCodeTitle}
                  onChange={(e) => setForm((p) => ({ ...p, dressCodeTitle: e.target.value }))}
                  placeholder="Ej: Rigurosa Etiqueta o Etiqueta Formal"
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Código de Vestimenta - Nota</label>
                <input
                  type="text"
                  value={form.dressCodeNote}
                  onChange={(e) => setForm((p) => ({ ...p, dressCodeNote: e.target.value }))}
                  placeholder="Ej: Reservamos el color blanco y marfil exclusivamente para la novia."
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
                />
              </div>
            </div>

            {form.dressCodeShowPalette && (
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-stone-700">
                    Colores de la Paleta ({form.dressCodePalette.length})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          dressCodePalette: [...p.dressCodePalette, '#b08d57'],
                        }))
                      }
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-[#8d2b3d] hover:underline"
                    >
                      + Añadir Color
                    </button>
                    {form.dressCodePalette.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, dressCodePalette: [] }))}
                        className="text-[11px] text-stone-400 hover:text-stone-600"
                      >
                        Limpiar todos
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {form.dressCodePalette.map((color, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-2 rounded-xl bg-white border border-stone-200 px-2.5 py-1.5 shadow-sm"
                    >
                      <input
                        type="color"
                        value={color.startsWith('#') ? color : `#${color}`}
                        onChange={(e) => {
                          const newPal = [...form.dressCodePalette];
                          newPal[idx] = e.target.value;
                          setForm((p) => ({ ...p, dressCodePalette: newPal }));
                        }}
                        className="h-6 w-6 rounded-full cursor-pointer border-0 p-0"
                        title="Seleccionar color"
                      />
                      <input
                        type="text"
                        value={color}
                        onChange={(e) => {
                          const newPal = [...form.dressCodePalette];
                          newPal[idx] = e.target.value;
                          setForm((p) => ({ ...p, dressCodePalette: newPal }));
                        }}
                        className="w-20 text-[11px] font-mono uppercase border-0 p-0 text-stone-700 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newPal = form.dressCodePalette.filter((_, i) => i !== idx);
                          setForm((p) => ({ ...p, dressCodePalette: newPal }));
                        }}
                        className="text-stone-400 hover:text-stone-700 text-xs px-1"
                        title="Eliminar este color"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {form.dressCodePalette.length === 0 && (
                    <p className="text-xs text-stone-400 italic">
                      No hay colores en la paleta. Añade uno con el botón superior o selecciona un preset rápido.
                    </p>
                  )}
                </div>

                {/* Presets Rápidos */}
                <div className="pt-2 border-t border-stone-200/60">
                  <span className="text-[11px] text-stone-500 font-medium block mb-1.5">
                    Paletas Rápidas Recomendadas:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {DRESS_CODE_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() =>
                          setForm((p) => ({
                            ...p,
                            dressCodePalette: [...preset.colors],
                          }))
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2 py-1 text-[11px] text-stone-700 hover:border-stone-400 hover:bg-stone-50 transition"
                      >
                        <span className="flex -space-x-1">
                          {preset.colors.map((c, i) => (
                            <span
                              key={i}
                              className="inline-block h-3 w-3 rounded-full border border-white"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </span>
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
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

      {showDriveModal && (
        <DriveConfigModal
          eventId={event.id}
          weddingTitle={event.title}
          initialConfig={{
            mediaProvider: form.mediaProvider,
            driveFolderId: form.driveFolderId,
            driveFolderUrl: form.driveFolderUrl,
            photosAlbumId: form.photosAlbumId,
            photosAlbumUrl: form.photosAlbumUrl,
            photoPin: form.photoPin,
          }}
          onClose={() => setShowDriveModal(false)}
          onSaved={() => {
            apiFetch<{ event: WeddingEvent }>(`/api/events/${event.id}`, { auth: true })
              .then((res) => {
                if (res.event) {
                  onUpdated(res.event);
                  setForm((p) => ({
                    ...p,
                    mediaProvider: res.event.mediaProvider,
                    driveFolderId: res.event.driveFolderId || '',
                    driveFolderUrl: res.event.driveFolderUrl || '',
                    photosAlbumId: res.event.photosAlbumId || '',
                    photosAlbumUrl: res.event.photosAlbumUrl || '',
                    photoPin: res.event.photoPin || '',
                  }));
                }
              })
              .catch(() => {});
          }}
        />
      )}
    </form>
  );
}
