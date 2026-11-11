import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4006),
  frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:3006').replace(/\/$/, ''),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production-32-chars',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  gmailUser: process.env.GMAIL_USER || '',
  gmailAppPassword: process.env.GMAIL_APP_PASSWORD || '',
  gmailFromName: process.env.GMAIL_FROM_NAME || 'Invitaciones de Matrimonio',

  whatsappSessionDir: path.resolve(process.env.WHATSAPP_SESSION_DIR || './sessions/wa'),
  whatsappMinDelayMs: Number(process.env.WHATSAPP_MIN_DELAY_MS || 2500),
  whatsappMaxDelayMs: Number(process.env.WHATSAPP_MAX_DELAY_MS || 5500),

  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleRedirectUri:
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4006/api/media/google/callback',
  googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN || '',
  googleDriveRootFolderId: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || '',

  maxUploadMb: Number(process.env.MAX_UPLOAD_MB || 150),
  tempUploadDir: path.resolve(process.env.TEMP_UPLOAD_DIR || './uploads/tmp'),
  localMediaFallbackDir: path.resolve('./uploads/media'),
};
