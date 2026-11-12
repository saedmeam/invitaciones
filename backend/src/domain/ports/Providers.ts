import { Readable } from 'stream';
import { MediaProviderType } from '../entities/Event';
import { StorageMode } from '../entities/MediaAndDispatch';

export type WhatsAppConnectionStatus =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'QR_READY'
  | 'CONNECTED';

export interface WhatsAppStateDto {
  status: WhatsAppConnectionStatus;
  qrDataUrl: string | null;
  connectedPhone: string | null;
  lastError: string | null;
}

export interface IWhatsAppProvider {
  getState(): WhatsAppStateDto;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  sendText(toPhone: string, message: string): Promise<{ ok: boolean; error?: string; fallbackUrl: string }>;
  buildFallbackUrl(toPhone: string, message: string): string;
}

export interface IEmailProvider {
  isConfigured(): boolean;
  sendHtml(params: {
    to: string;
    subject: string;
    html: string;
    icsContent?: string;
  }): Promise<{ ok: boolean; error?: string }>;
}

export interface DriveUploadResult {
  storageMode: StorageMode;
  driveFileId: string | null;
  driveWebUrl: string | null;
  photosMediaItemId: string | null;
  photosAlbumId: string | null;
  localFallbackPath: string | null;
}

export interface IDriveStorageProvider {
  hasOAuthApp(): boolean;
  isConfigured(eventRefreshToken?: string | null): boolean;
  getAuthUrl(state?: string): string | null;
  exchangeCodeForTokens(
    code: string,
    persistToGlobalEnv?: boolean
  ): Promise<{ refreshToken: string | null; email: string | null }>;
  uploadFile(params: {
    filePath: string;
    fileName: string;
    mimeType: string;
    caption?: string;
    mediaProvider: MediaProviderType;
    folderId?: string | null;
    photosAlbumId?: string | null;
    albumTitle?: string;
    refreshToken?: string | null;
  }): Promise<DriveUploadResult>;
  getFileStream(params: {
    storageMode: StorageMode;
    driveFileId: string | null;
    photosMediaItemId: string | null;
    localFallbackPath: string | null;
    refreshToken?: string | null;
  }): Promise<Readable>;
  deleteFile(params: {
    storageMode: StorageMode;
    driveFileId: string | null;
    localFallbackPath: string | null;
    refreshToken?: string | null;
  }): Promise<void>;
}
