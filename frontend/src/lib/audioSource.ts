export type AudioSourceType = 'none' | 'mp3' | 'youtube' | 'spotify';

export interface ParsedAudioSource {
  type: AudioSourceType;
  rawUrl: string;
  youtubeId?: string;
  youtubeEmbedUrl?: string;
  spotifyType?: 'track' | 'playlist' | 'album';
  spotifyId?: string;
  spotifyEmbedUrl?: string;
  directUrl?: string;
}

/**
 * Analiza una URL de audio o video y determina si es un archivo directo,
 * un video/audio de YouTube o un track/playlist de Spotify.
 */
export function parseAudioSource(url?: string | null): ParsedAudioSource {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return { type: 'none', rawUrl: '' };
  }

  const trimmed = url.trim();

  // 1. Detección de YouTube
  // Formatos soportados:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://music.youtube.com/watch?v=VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  const ytMatch =
    trimmed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/|music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/i);

  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      type: 'youtube',
      rawUrl: trimmed,
      youtubeId: videoId,
      youtubeEmbedUrl: `https://www.youtube.com/embed/${videoId}?enablejsapi=1&playsinline=1&controls=0&disablekb=1&fs=0&loop=1&playlist=${videoId}`,
    };
  }

  // 2. Detección de Spotify (Track, Playlist o Álbum)
  // Formatos:
  // - https://open.spotify.com/track/ID
  // - https://open.spotify.com/playlist/ID
  // - https://open.spotify.com/intl-es/track/ID
  // - spotify:track:ID
  // - https://open.spotify.com/embed/track/ID
  const spotifyMatch = trimmed.match(
    /(?:open\.spotify\.com\/(?:intl-[a-z]+\/)?(track|playlist|album)\/|spotify:(track|playlist|album):)([a-zA-Z0-9]+)/i
  );

  if (spotifyMatch) {
    const type = (spotifyMatch[1] || spotifyMatch[2]) as 'track' | 'playlist' | 'album';
    const id = spotifyMatch[3];
    return {
      type: 'spotify',
      rawUrl: trimmed,
      spotifyType: type,
      spotifyId: id,
      spotifyEmbedUrl: `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`,
    };
  }

  // 3. Audio Directo (MP3, WAV, OGG, o cualquier URL servida por el backend)
  return {
    type: 'mp3',
    rawUrl: trimmed,
    directUrl: trimmed,
  };
}

/**
 * Obtiene la URL embed de una Playlist de Spotify.
 * Soporta links web estándar, links intl y URIs de Spotify.
 */
export function getSpotifyPlaylistEmbedUrl(rawUrl?: string | null): string | null {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) return null;
  const trimmed = rawUrl.trim();

  if (trimmed.includes('open.spotify.com/embed/')) {
    return trimmed;
  }

  const match = trimmed.match(
    /(?:open\.spotify\.com\/(?:intl-[a-z]+\/)?(playlist|album)\/|spotify:(playlist|album):)([a-zA-Z0-9]+)/i
  );

  if (match) {
    const type = match[1] || match[2];
    const id = match[3];
    return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
  }

  return null;
}
