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

export interface SmtpConfigDto {
  host?: string;
  port?: number;
  secure?: boolean;
  user: string;
  pass: string;
  fromName?: string;
}

export interface IEmailProvider {
  isConfigured(customSmtp?: SmtpConfigDto | null): boolean;
  sendHtml(params: {
    to: string;
    subject: string;
    html: string;
    icsContent?: string;
    smtpConfig?: SmtpConfigDto | null;
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

export interface EventOAuthCredentials {
  clientId?: string | null;
  clientSecret?: string | null;
  refreshToken?: string | null;
}

export interface DriveTestResult {
  ok: boolean;
  email?: string | null;
  folderName?: string | null;
  error?: string;
  errorCode?: string;
}

export interface IDriveStorageProvider {
  hasOAuthApp(credentials?: EventOAuthCredentials | null): boolean;
  isConfigured(eventRefreshToken?: string | null, credentials?: EventOAuthCredentials | null): boolean;
  getAuthUrl(state?: string, credentials?: EventOAuthCredentials | null): string | null;
  exchangeCodeForTokens(
    code: string,
    persistToGlobalEnv?: boolean,
    credentials?: EventOAuthCredentials | null
  ): Promise<{ refreshToken: string | null; email: string | null }>;
  extractFolderId(input?: string | null): string | null;
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
    credentials?: EventOAuthCredentials | null;
  }): Promise<DriveUploadResult>;
  getFileStream(params: {
    storageMode: StorageMode;
    driveFileId: string | null;
    photosMediaItemId: string | null;
    localFallbackPath: string | null;
    refreshToken?: string | null;
    credentials?: EventOAuthCredentials | null;
  }): Promise<Readable>;
  deleteFile(params: {
    storageMode: StorageMode;
    driveFileId: string | null;
    localFallbackPath: string | null;
    refreshToken?: string | null;
    credentials?: EventOAuthCredentials | null;
  }): Promise<void>;
  testConnection(params: {
    refreshToken?: string | null;
    folderId?: string | null;
    mediaProvider?: MediaProviderType;
    credentials?: EventOAuthCredentials | null;
  }): Promise<DriveTestResult>;
}
