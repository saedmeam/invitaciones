import { describe, expect, it } from 'vitest';
import QRCode from 'qrcode';

interface EventQrMock {
  slug: string;
  photosAlbumUrl?: string | null;
  driveFolderUrl?: string | null;
}

describe('Photo QR & Destination Logic', () => {
  it('prioritizes photosAlbumUrl when provided and generates valid QR data URL', async () => {
    const event: EventQrMock = {
      slug: 'joselin-y-santiago-2027',
      photosAlbumUrl: 'https://photos.app.goo.gl/AbCdEfGh12345',
      driveFolderUrl: 'https://drive.google.com/drive/folders/XYZ123',
    };

    const targetUrl =
      event.photosAlbumUrl?.trim() ||
      event.driveFolderUrl?.trim() ||
      `http://localhost:3006/e/${event.slug}/fotos`;

    expect(targetUrl).toBe('https://photos.app.goo.gl/AbCdEfGh12345');

    const destinationType = event.photosAlbumUrl
      ? 'GOOGLE_PHOTOS'
      : event.driveFolderUrl
        ? 'GOOGLE_DRIVE'
        : 'WEB_ALBUM';

    expect(destinationType).toBe('GOOGLE_PHOTOS');

    const qrDataUrl = await QRCode.toDataURL(targetUrl, {
      width: 600,
      margin: 2,
      color: { dark: '#1c1917', light: '#ffffff' },
    });

    expect(qrDataUrl.startsWith('data:image/png;base64,')).toBe(true);
  });

  it('falls back to driveFolderUrl when photosAlbumUrl is null', () => {
    const event: EventQrMock = {
      slug: 'joselin-y-santiago-2027',
      photosAlbumUrl: null,
      driveFolderUrl: 'https://drive.google.com/drive/folders/XYZ123',
    };

    const targetUrl =
      event.photosAlbumUrl?.trim() ||
      event.driveFolderUrl?.trim() ||
      `http://localhost:3006/e/${event.slug}/fotos`;

    expect(targetUrl).toBe('https://drive.google.com/drive/folders/XYZ123');
  });

  it('falls back to internal web album when both Google links are null', () => {
    const event: EventQrMock = {
      slug: 'joselin-y-santiago-2027',
      photosAlbumUrl: null,
      driveFolderUrl: null,
    };

    const targetUrl =
      event.photosAlbumUrl?.trim() ||
      event.driveFolderUrl?.trim() ||
      `http://localhost:3006/e/${event.slug}/fotos`;

    expect(targetUrl).toBe('http://localhost:3006/e/joselin-y-santiago-2027/fotos');
  });
});
