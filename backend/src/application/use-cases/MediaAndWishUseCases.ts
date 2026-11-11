import fs from 'fs/promises';
import QRCode from 'qrcode';
import { MediaStatus, MediaType } from '../../domain/entities/MediaAndDispatch';
import { IDriveStorageProvider } from '../../domain/ports/Providers';
import {
  IEventRepository,
  IMediaRepository,
  IWishRepository,
} from '../../domain/ports/Repositories';
import { AppError } from '../../shared/errors/AppError';
import { AuthActor, ensureEventAccess } from '../helpers/AccessControlHelper';

export class MediaAndWishUseCases {
  constructor(
    private readonly eventRepo: IEventRepository,
    private readonly mediaRepo: IMediaRepository,
    private readonly wishRepo: IWishRepository,
    private readonly driveProvider: IDriveStorageProvider,
    private readonly frontendUrl: string
  ) {}

  private sanitizeText(input: string): string {
    return input.replace(/[<>]/g, '').trim();
  }

  async generatePhotoQr(eventId: string, actor: AuthActor) {
    const event = await ensureEventAccess(this.eventRepo, eventId, actor);
    const uploadUrl = `${this.frontendUrl}/e/${event.slug}/fotos`;
    const qrDataUrl = await QRCode.toDataURL(uploadUrl, {
      width: 512,
      margin: 2,
      color: { dark: '#1c1917', light: '#ffffff' },
    });
    const qrSvg = await QRCode.toString(uploadUrl, { type: 'svg', margin: 2 });

    return {
      uploadUrl,
      qrDataUrl,
      qrSvg,
      driveConfigured: this.driveProvider.isConfigured(),
      driveFolderId: event.driveFolderId,
      photosAlbumId: event.photosAlbumId,
      mediaProvider: event.mediaProvider,
    };
  }

  async uploadMediaBySlug(params: {
    slug: string;
    uploaderName: string;
    caption?: string;
    pin?: string;
    file: { path: string; originalname: string; mimetype: string; size: number };
  }) {
    try {
      const event = await this.eventRepo.findBySlug(params.slug);
      if (!event || !event.isActive) {
        throw new AppError('Evento no encontrado o inactivo', 404, 'NOT_FOUND');
      }

      if (event.photoPin && event.photoPin.trim() !== '') {
        if ((params.pin || '').trim() !== event.photoPin.trim()) {
          throw new AppError('PIN del álbum incorrecto', 403, 'INVALID_PIN');
        }
      }

      const isImage = params.file.mimetype.startsWith('image/');
      const isVideo = params.file.mimetype.startsWith('video/');
      const mediaType: MediaType = isVideo ? 'VIDEO' : isImage ? 'IMAGE' : 'OTHER';

      if (event.mediaProvider === 'GOOGLE_PHOTOS' && mediaType === 'OTHER') {
        throw new AppError(
          'Este álbum en Google Photos solo admite fotos y videos',
          400,
          'INVALID_FILE_TYPE'
        );
      }

      const safeCaption = params.caption ? this.sanitizeText(params.caption) : undefined;
      const safeUploader = this.sanitizeText(params.uploaderName || 'Invitado');

      const uploadResult = await this.driveProvider.uploadFile({
        filePath: params.file.path,
        fileName: `${Date.now()}-${params.file.originalname}`,
        mimeType: params.file.mimetype,
        caption: `${safeUploader}${safeCaption ? `: ${safeCaption}` : ''}`,
        mediaProvider: event.mediaProvider,
        folderId: event.driveFolderId,
        photosAlbumId: event.photosAlbumId,
        albumTitle: `${event.partnerOneName} & ${event.partnerTwoName}`,
      });

      if (uploadResult.photosAlbumId && uploadResult.photosAlbumId !== event.photosAlbumId) {
        await this.eventRepo.update(event.id, { photosAlbumId: uploadResult.photosAlbumId });
      }

      const status: MediaStatus = event.themeConfig.moderatePhotos ? 'PENDING' : 'APPROVED';

      return await this.mediaRepo.create({
        eventId: event.id,
        uploaderName: safeUploader,
        caption: safeCaption || null,
        originalName: params.file.originalname,
        mimeType: params.file.mimetype,
        mediaType,
        sizeBytes: params.file.size,
        driveFileId: uploadResult.driveFileId,
        driveWebUrl: uploadResult.driveWebUrl,
        photosMediaItemId: uploadResult.photosMediaItemId,
        localFallbackPath: uploadResult.localFallbackPath,
        storageMode: uploadResult.storageMode,
        status,
      });
    } finally {
      await fs.unlink(params.file.path).catch(() => {});
    }
  }

  async listPublicMedia(slug: string) {
    const event = await this.eventRepo.findBySlug(slug);
    if (!event || !event.isActive) {
      throw new AppError('Evento no encontrado', 404, 'NOT_FOUND');
    }
    return this.mediaRepo.findByEvent(event.id, true);
  }

  async listAdminMedia(eventId: string, actor: AuthActor) {
    const event = await ensureEventAccess(this.eventRepo, eventId, actor);
    return this.mediaRepo.findByEvent(event.id, false);
  }

  async moderateMedia(eventId: string, mediaId: string, actor: AuthActor, status: MediaStatus) {
    await ensureEventAccess(this.eventRepo, eventId, actor);
    const media = await this.mediaRepo.findById(mediaId);
    if (!media || media.eventId !== eventId) {
      throw new AppError('Archivo no encontrado', 404, 'NOT_FOUND');
    }
    return this.mediaRepo.updateStatus(mediaId, status);
  }

  async deleteMedia(eventId: string, mediaId: string, actor: AuthActor) {
    await ensureEventAccess(this.eventRepo, eventId, actor);
    const media = await this.mediaRepo.findById(mediaId);
    if (!media || media.eventId !== eventId) {
      throw new AppError('Archivo no encontrado', 404, 'NOT_FOUND');
    }
    await this.driveProvider.deleteFile({
      storageMode: media.storageMode,
      driveFileId: media.driveFileId,
      localFallbackPath: media.localFallbackPath,
    });
    await this.mediaRepo.delete(mediaId);
  }

  async streamMedia(mediaId: string) {
    const media = await this.mediaRepo.findById(mediaId);
    if (!media) {
      throw new AppError('Archivo no encontrado', 404, 'NOT_FOUND');
    }
    const stream = await this.driveProvider.getFileStream({
      storageMode: media.storageMode,
      driveFileId: media.driveFileId,
      photosMediaItemId: media.photosMediaItemId,
      localFallbackPath: media.localFallbackPath,
    });
    return { media, stream };
  }

  async listPublicWishes(slug: string) {
    const event = await this.eventRepo.findBySlug(slug);
    if (!event || !event.isActive) {
      throw new AppError('Evento no encontrado', 404, 'NOT_FOUND');
    }
    return this.wishRepo.findByEvent(event.id, true);
  }

  async createPublicWish(slug: string, authorName: string, message: string) {
    const event = await this.eventRepo.findBySlug(slug);
    if (!event || !event.isActive) {
      throw new AppError('Evento no encontrado', 404, 'NOT_FOUND');
    }
    const cleanAuthor = this.sanitizeText(authorName);
    const cleanMsg = this.sanitizeText(message);
    if (!cleanAuthor || !cleanMsg) {
      throw new AppError('Nombre y mensaje son obligatorios', 400, 'INVALID_WISH');
    }
    return this.wishRepo.create({
      eventId: event.id,
      authorName: cleanAuthor.slice(0, 80),
      message: cleanMsg.slice(0, 600),
      isApproved: !event.themeConfig.moderateWishes,
    });
  }

  async listAdminWishes(eventId: string, actor: AuthActor) {
    const event = await ensureEventAccess(this.eventRepo, eventId, actor);
    return this.wishRepo.findByEvent(event.id, false);
  }

  async deleteWish(eventId: string, wishId: string, actor: AuthActor) {
    await ensureEventAccess(this.eventRepo, eventId, actor);
    await this.wishRepo.delete(wishId);
  }
}
