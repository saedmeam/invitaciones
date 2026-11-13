import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { Readable } from 'stream';
import { google } from 'googleapis';
import { MediaProviderType } from '../../domain/entities/Event';
import { StorageMode } from '../../domain/entities/MediaAndDispatch';
import {
  DriveTestResult,
  DriveUploadResult,
  EventOAuthCredentials,
  IDriveStorageProvider,
} from '../../domain/ports/Providers';

export function extractGoogleDriveFolderId(input?: string | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) {
    return folderMatch[1];
  }

  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1]) {
    return idParamMatch[1];
  }

  const fileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch && fileMatch[1]) {
    return fileMatch[1];
  }

  if (!trimmed.includes('/') && !trimmed.includes('.') && /^[a-zA-Z0-9_-]{10,}$/.test(trimmed)) {
    return trimmed;
  }

  if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

export class GoogleDriveStorageProvider implements IDriveStorageProvider {
  private runtimeRefreshToken: string;
  private readonly defaultFolderId: string;

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly redirectUri: string,
    refreshToken: string,
    defaultFolderId: string,
    private readonly localFallbackDir: string
  ) {
    this.runtimeRefreshToken = refreshToken;
    this.defaultFolderId = extractGoogleDriveFolderId(defaultFolderId) || defaultFolderId.trim();
    fs.mkdirSync(this.localFallbackDir, { recursive: true });
  }

  extractFolderId(input?: string | null): string | null {
    return extractGoogleDriveFolderId(input);
  }

  private resolveCredentials(credentials?: EventOAuthCredentials | null) {
    const clientId = credentials?.clientId?.trim() || this.clientId;
    const clientSecret = credentials?.clientSecret?.trim() || this.clientSecret;
    const refreshToken = credentials?.refreshToken?.trim() || this.runtimeRefreshToken;
    return { clientId, clientSecret, refreshToken };
  }

  private createOAuthClient(
    eventRefreshToken?: string | null,
    credentials?: EventOAuthCredentials | null
  ) {
    const creds = this.resolveCredentials(credentials);
    if (!creds.clientId || !creds.clientSecret) {
      return null;
    }
    const auth = new google.auth.OAuth2(creds.clientId, creds.clientSecret, this.redirectUri);
    const token = eventRefreshToken || creds.refreshToken;
    if (token) {
      auth.setCredentials({ refresh_token: token });
    }
    return auth;
  }

  hasOAuthApp(credentials?: EventOAuthCredentials | null): boolean {
    const creds = this.resolveCredentials(credentials);
    return Boolean(creds.clientId && creds.clientSecret);
  }

  isConfigured(
    eventRefreshToken?: string | null,
    credentials?: EventOAuthCredentials | null
  ): boolean {
    const creds = this.resolveCredentials(credentials);
    const token = eventRefreshToken || creds.refreshToken;
    return Boolean(creds.clientId && creds.clientSecret && token);
  }

  getAuthUrl(state?: string, credentials?: EventOAuthCredentials | null): string | null {
    const creds = this.resolveCredentials(credentials);
    if (!creds.clientId || !creds.clientSecret) return null;
    const auth = new google.auth.OAuth2(creds.clientId, creds.clientSecret, this.redirectUri);
    return auth.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      ...(state ? { state } : {}),
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/photoslibrary.appendonly',
        'https://www.googleapis.com/auth/photoslibrary.readonly.appcreateddata',
        'https://www.googleapis.com/auth/drive.file',
      ],
    });
  }

  async exchangeCodeForTokens(
    code: string,
    persistToGlobalEnv = false,
    credentials?: EventOAuthCredentials | null
  ): Promise<{ refreshToken: string | null; email: string | null }> {
    const creds = this.resolveCredentials(credentials);
    if (!creds.clientId || !creds.clientSecret) {
      return { refreshToken: null, email: null };
    }
    const auth = new google.auth.OAuth2(creds.clientId, creds.clientSecret, this.redirectUri);
    const { tokens } = await auth.getToken(code);
    auth.setCredentials(tokens);

    let email: string | null = null;
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth });
      const profile = await oauth2.userinfo.get();
      email = profile.data.email || null;
    } catch {
      // Continuar con el refresh_token si no se pudo leer el correo
    }

    if (tokens.refresh_token && persistToGlobalEnv) {
      this.runtimeRefreshToken = tokens.refresh_token;
      await this.persistRefreshTokenToEnv(tokens.refresh_token);
    }
    return { refreshToken: tokens.refresh_token || null, email };
  }

  private async persistRefreshTokenToEnv(refreshToken: string) {
    try {
      const envPath = path.resolve(process.cwd(), '.env');
      if (!fs.existsSync(envPath)) return;
      const content = await fsPromises.readFile(envPath, 'utf-8');
      if (/^GOOGLE_REFRESH_TOKEN=/m.test(content)) {
        const updated = content.replace(
          /^GOOGLE_REFRESH_TOKEN=.*$/m,
          `GOOGLE_REFRESH_TOKEN=${refreshToken}`
        );
        await fsPromises.writeFile(envPath, updated, 'utf-8');
      } else {
        await fsPromises.appendFile(envPath, `\nGOOGLE_REFRESH_TOKEN=${refreshToken}\n`, 'utf-8');
      }
    } catch {
      // Silencioso si no existe archivo .env editable
    }
  }

  private async getAccessToken(
    eventRefreshToken?: string | null,
    credentials?: EventOAuthCredentials | null
  ): Promise<string> {
    const auth = this.createOAuthClient(eventRefreshToken, credentials);
    if (!auth) throw new Error('OAuth2 de Google no configurado');
    const { token } = await auth.getAccessToken();
    if (!token) throw new Error('No se pudo obtener Access Token de Google');
    return token;
  }

  private async ensurePhotosAlbum(accessToken: string, existingAlbumId?: string | null, title?: string) {
    if (existingAlbumId) return existingAlbumId;
    const res = await fetch('https://photoslibrary.googleapis.com/v1/albums', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        album: { title: title || 'Álbum de Boda' },
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Error creando álbum en Google Photos: ${errText}`);
    }
    const data = (await res.json()) as { id: string };
    return data.id;
  }

  private async uploadToGooglePhotos(params: {
    filePath: string;
    fileName: string;
    mimeType: string;
    caption?: string;
    photosAlbumId?: string | null;
    albumTitle?: string;
    refreshToken?: string | null;
    credentials?: EventOAuthCredentials | null;
  }): Promise<DriveUploadResult> {
    const accessToken = await this.getAccessToken(params.refreshToken, params.credentials);
    const albumId = await this.ensurePhotosAlbum(
      accessToken,
      params.photosAlbumId,
      params.albumTitle
    );

    const fileBuffer = await fsPromises.readFile(params.filePath);
    const uploadRes = await fetch('https://photoslibrary.googleapis.com/v1/uploads', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-type': 'application/octet-stream',
        'X-Goog-Upload-Content-Type': params.mimeType,
        'X-Goog-Upload-Protocol': 'raw',
      },
      body: fileBuffer,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`Error subiendo bytes a Google Photos: ${errText}`);
    }

    const uploadToken = await uploadRes.text();

    const createRes = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        albumId,
        newMediaItems: [
          {
            description: params.caption || params.fileName,
            simpleMediaItem: {
              uploadToken,
              fileName: params.fileName,
            },
          },
        ],
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Error registrando media en Google Photos: ${errText}`);
    }

    const createdData = (await createRes.json()) as {
      newMediaItemResults?: Array<{
        mediaItem?: { id: string; productUrl?: string };
      }>;
    };
    const item = createdData.newMediaItemResults?.[0]?.mediaItem;

    return {
      storageMode: 'GOOGLE_PHOTOS',
      driveFileId: null,
      driveWebUrl: item?.productUrl || null,
      photosMediaItemId: item?.id || null,
      photosAlbumId: albumId,
      localFallbackPath: null,
    };
  }

  private async uploadToGoogleDrive(params: {
    filePath: string;
    fileName: string;
    mimeType: string;
    folderId?: string | null;
    refreshToken?: string | null;
    credentials?: EventOAuthCredentials | null;
  }): Promise<DriveUploadResult> {
    const auth = this.createOAuthClient(params.refreshToken, params.credentials);
    if (!auth) throw new Error('OAuth2 de Google no disponible');
    const drive = google.drive({ version: 'v3', auth });

    const rawFolder = params.folderId || this.defaultFolderId;
    const targetFolder = extractGoogleDriveFolderId(rawFolder) || (rawFolder ? rawFolder.trim() : null);

    const res = await drive.files.create({
      requestBody: {
        name: params.fileName,
        ...(targetFolder ? { parents: [targetFolder] } : {}),
      },
      media: {
        mimeType: params.mimeType,
        body: fs.createReadStream(params.filePath),
      },
      fields: 'id, webViewLink',
    });

    return {
      storageMode: 'GOOGLE_DRIVE',
      driveFileId: res.data.id || null,
      driveWebUrl: res.data.webViewLink || null,
      photosMediaItemId: null,
      photosAlbumId: null,
      localFallbackPath: null,
    };
  }

  async uploadFile(params: {
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
  }): Promise<DriveUploadResult> {
    const isPhotoOrVideo =
      params.mimeType.startsWith('image/') || params.mimeType.startsWith('video/');

    if (this.isConfigured(params.refreshToken, params.credentials)) {
      try {
        // Modo Híbrido Dual: Sube tanto a Google Photos como a Google Drive con la misma cuenta vinculada
        if (params.mediaProvider === 'HYBRID' && isPhotoOrVideo) {
          const [photosRes, driveRes] = await Promise.allSettled([
            this.uploadToGooglePhotos(params),
            this.uploadToGoogleDrive(params),
          ]);

          const photosVal = photosRes.status === 'fulfilled' ? photosRes.value : null;
          const driveVal = driveRes.status === 'fulfilled' ? driveRes.value : null;

          if (photosVal || driveVal) {
            return {
              storageMode: photosVal ? 'GOOGLE_PHOTOS' : 'GOOGLE_DRIVE',
              driveFileId: driveVal?.driveFileId || null,
              driveWebUrl: driveVal?.driveWebUrl || null,
              photosMediaItemId: photosVal?.photosMediaItemId || null,
              photosAlbumId: photosVal?.photosAlbumId || params.photosAlbumId || null,
              localFallbackPath: null,
            };
          }
        }

        const usePhotos =
          params.mediaProvider === 'GOOGLE_PHOTOS' ||
          (params.mediaProvider === 'HYBRID' && isPhotoOrVideo);

        if (usePhotos) {
          return await this.uploadToGooglePhotos(params);
        }
        return await this.uploadToGoogleDrive(params);
      } catch (googleError) {
        console.warn(
          '[GoogleDriveStorageProvider] Error subiendo a Google. Activando fallback local para no perder la foto:',
          googleError
        );
      }
    }

    const safeFileName = `${Date.now()}-${path.basename(params.fileName).replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const destPath = path.join(this.localFallbackDir, safeFileName);
    await fsPromises.copyFile(params.filePath, destPath);

    return {
      storageMode: 'LOCAL_FALLBACK',
      driveFileId: null,
      driveWebUrl: null,
      photosMediaItemId: null,
      photosAlbumId: params.photosAlbumId || null,
      localFallbackPath: safeFileName,
    };
  }

  async getFileStream(params: {
    storageMode: StorageMode;
    driveFileId: string | null;
    photosMediaItemId: string | null;
    localFallbackPath: string | null;
    refreshToken?: string | null;
    credentials?: EventOAuthCredentials | null;
  }): Promise<Readable> {
    if (
      params.storageMode === 'GOOGLE_PHOTOS' &&
      params.photosMediaItemId &&
      this.isConfigured(params.refreshToken, params.credentials)
    ) {
      const accessToken = await this.getAccessToken(params.refreshToken, params.credentials);
      const itemRes = await fetch(
        `https://photoslibrary.googleapis.com/v1/mediaItems/${params.photosMediaItemId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (!itemRes.ok) {
        throw new Error('No se pudo obtener el enlace de Google Photos');
      }
      const item = (await itemRes.json()) as { baseUrl: string; mimeType?: string };
      const suffix = item.mimeType?.startsWith('video/') ? '=dv' : '=w1600';
      const mediaRes = await fetch(`${item.baseUrl}${suffix}`);
      if (!mediaRes.ok || !mediaRes.body) {
        throw new Error('Error descargando media de Google Photos');
      }
      return Readable.fromWeb(mediaRes.body as any);
    }

    if (
      params.storageMode === 'GOOGLE_DRIVE' &&
      params.driveFileId &&
      this.isConfigured(params.refreshToken, params.credentials)
    ) {
      const auth = this.createOAuthClient(params.refreshToken, params.credentials);
      if (auth) {
        const drive = google.drive({ version: 'v3', auth });
        const res = await drive.files.get(
          { fileId: params.driveFileId, alt: 'media' },
          { responseType: 'stream' }
        );
        return res.data as Readable;
      }
    }

    if (!params.localFallbackPath) {
      throw new Error('Archivo no disponible localmente');
    }
    const safePath = path.join(this.localFallbackDir, path.basename(params.localFallbackPath));
    return fs.createReadStream(safePath);
  }

  async deleteFile(params: {
    storageMode: StorageMode;
    driveFileId: string | null;
    localFallbackPath: string | null;
    refreshToken?: string | null;
    credentials?: EventOAuthCredentials | null;
  }): Promise<void> {
    if (
      params.storageMode === 'GOOGLE_DRIVE' &&
      params.driveFileId &&
      this.isConfigured(params.refreshToken, params.credentials)
    ) {
      const auth = this.createOAuthClient(params.refreshToken, params.credentials);
      if (auth) {
        const drive = google.drive({ version: 'v3', auth });
        await drive.files.delete({ fileId: params.driveFileId }).catch(() => {});
        return;
      }
    }

    if (params.localFallbackPath) {
      const safePath = path.join(this.localFallbackDir, path.basename(params.localFallbackPath));
      await fsPromises.unlink(safePath).catch(() => {});
    }
  }

  async testConnection(params: {
    refreshToken?: string | null;
    folderId?: string | null;
    mediaProvider?: MediaProviderType;
    credentials?: EventOAuthCredentials | null;
  }): Promise<DriveTestResult> {
    const creds = this.resolveCredentials(params.credentials);
    const token = params.refreshToken?.trim() || creds.refreshToken;
    if (!creds.clientId || !creds.clientSecret || !token) {
      return {
        ok: false,
        error: 'No hay credenciales ni token de Google configurados para esta prueba.',
        errorCode: 'DRIVE_NOT_CONFIGURED',
      };
    }

    try {
      const auth = new google.auth.OAuth2(creds.clientId, creds.clientSecret, this.redirectUri);
      auth.setCredentials({ refresh_token: token });

      let email: string | null = null;
      try {
        const oauth2 = google.oauth2({ version: 'v2', auth });
        const profile = await oauth2.userinfo.get();
        email = profile.data.email || null;
      } catch {
        // Perfil opcional
      }

      let folderName: string | null = null;
      const cleanFolderId = extractGoogleDriveFolderId(params.folderId);
      if (cleanFolderId) {
        try {
          const drive = google.drive({ version: 'v3', auth });
          const res = await drive.files.get({
            fileId: cleanFolderId,
            fields: 'id, name, mimeType, trashed',
          });
          folderName = res.data.name || cleanFolderId;
        } catch {
          return {
            ok: false,
            email,
            error: `La carpeta de Google Drive '${cleanFolderId}' no existe o no tiene permisos de acceso.`,
            errorCode: 'DRIVE_FOLDER_NOT_FOUND',
          };
        }
      }

      return {
        ok: true,
        email,
        folderName,
      };
    } catch (err: any) {
      const msg = err?.message || 'Error autenticando con Google';
      return {
        ok: false,
        error: msg,
        errorCode: msg.includes('invalid_grant') ? 'DRIVE_AUTH_REVOKED' : 'DRIVE_TEST_FAILED',
      };
    }
  }
}
