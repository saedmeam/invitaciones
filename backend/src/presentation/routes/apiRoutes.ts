import fs from 'fs';
import path from 'path';
import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import QRCode from 'qrcode';
import { z } from 'zod';
import { RsvpDomainService } from '../../domain/services/RsvpDomainService';
import { env } from '../../infrastructure/config/env';
import { AppError } from '../../shared/errors/AppError';
import { AppContainer } from '../container';
import { AuthenticatedRequest, createAuthMiddleware } from '../middlewares/authMiddleware';
import { createRateLimiter } from '../middlewares/rateLimitMiddleware';

const asyncHandler =
  (fn: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as AuthenticatedRequest, res, next)).catch(next);
  };

export function createApiRouter(container: AppContainer): Router {
  const router = Router();
  const requireAuth = createAuthMiddleware(container.jwtSecret);
  const loginLimiter = createRateLimiter(15, 60 * 1000);
  const pinUploadLimiter = createRateLimiter(30, 60 * 1000);

  fs.mkdirSync(env.tempUploadDir, { recursive: true });
  const assetsDir = path.resolve(process.cwd(), 'uploads', 'assets');
  fs.mkdirSync(assetsDir, { recursive: true });

  const assetStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, assetsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      const cleanBase = path
        .basename(file.originalname, ext)
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 30);
      const uniqueName = `asset-${Date.now()}-${cleanBase}${ext}`;
      cb(null, uniqueName);
    },
  });

  const assetUpload = multer({
    storage: assetStorage,
    limits: { fileSize: 25 * 1024 * 1024 }, // hasta 25MB por imagen
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Solo se permiten archivos de imagen'));
      }
    },
  });

  const mediaUpload = multer({
    dest: env.tempUploadDir,
    limits: { fileSize: env.maxUploadMb * 1024 * 1024 },
  });
  const excelUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
  });

  // Health
  router.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      whatsapp: container.whatsappProvider.getState().status,
      emailConfigured: container.emailProvider.isConfigured(),
      driveConfigured: container.driveProvider.isConfigured(),
    });
  });

  // Auth
  router.post(
    '/auth/login',
    loginLimiter,
    asyncHandler(async (req, res) => {
      const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
      const { email, password } = schema.parse(req.body);
      const data = await container.authUseCases.login(email, password);
      res.json(data);
    })
  );

  router.get(
    '/auth/me',
    requireAuth,
    asyncHandler(async (req, res) => {
      const user = await container.authUseCases.getMe(req.user!.userId);
      res.json({ user });
    })
  );

  router.put(
    '/auth/me',
    requireAuth,
    asyncHandler(async (req, res) => {
      const schema = z.object({
        name: z.string().min(2).max(120).optional(),
        email: z.string().email().optional(),
        currentPassword: z.string().min(1).optional(),
        newPassword: z.string().min(6).max(100).optional(),
      });
      const body = schema.parse(req.body);
      const result = await container.authUseCases.updateProfile(req.user!.userId, body);
      res.json(result);
    })
  );

  // Admin Global: Directorio de todos los usuarios (Solo SUPERADMIN)
  router.get(
    '/users',
    requireAuth,
    asyncHandler(async (req, res) => {
      const users = await container.authUseCases.listAllUsers(req.user!);
      res.json({ users });
    })
  );

  // Crear usuario (SUPERADMIN cualquier rol; ORG_ADMIN solo COUPLE de su empresa)
  router.post(
    '/users',
    requireAuth,
    asyncHandler(async (req, res) => {
      const schema = z.object({
        name: z.string().min(2).max(120),
        email: z.string().email(),
        password: z.string().min(6).max(100),
        role: z.enum(['SUPERADMIN', 'ORG_ADMIN', 'COUPLE']),
        mustChangePassword: z.boolean().optional(),
        organizationId: z.string().nullable().optional(),
        assignedEventId: z.string().nullable().optional(),
      });
      const body = schema.parse(req.body);
      const user = await container.authUseCases.createUser(req.user!, body);
      res.status(201).json({ user });
    })
  );

  // Editar usuario (SUPERADMIN cualquier usuario; ORG_ADMIN solo sus COUPLE creados)
  router.put(
    '/users/:userId',
    requireAuth,
    asyncHandler(async (req, res) => {
      const schema = z.object({
        name: z.string().min(2).max(120).optional(),
        email: z.string().email().optional(),
        password: z.string().min(6).max(100).optional().or(z.literal('')),
        mustChangePassword: z.boolean().optional(),
        organizationId: z.string().nullable().optional(),
        assignedEventId: z.string().nullable().optional(),
      });
      const body = schema.parse(req.body);
      const user = await container.authUseCases.updateUser(
        String(req.params.userId),
        req.user!,
        body
      );
      res.json({ user });
    })
  );

  // Eliminar usuario desde directorio global (Solo SUPERADMIN)
  router.delete(
    '/users/:userId',
    requireAuth,
    asyncHandler(async (req, res) => {
      await container.authUseCases.deleteUser(String(req.params.userId), req.user!);
      res.status(204).send();
    })
  );

  function sanitizePublicEvent(event: any) {
    if (!event) return null;
    const {
      googleRefreshToken,
      googleClientSecret,
      googleClientId,
      smtpPass,
      smtpUser,
      smtpHost,
      smtpPort,
      ...safe
    } = event;
    return {
      ...safe,
      photoPin: event.photoPin ? '***' : '',
      requiresPhotoPin: Boolean(event.photoPin && event.photoPin.trim()),
    };
  }

  // Public Invitation & Event
  router.get(
    '/public/featured',
    asyncHandler(async (_req, res) => {
      const event = await container.eventUseCases.getFeaturedPublic();
      res.json({
        event: event ? sanitizePublicEvent(event) : null,
      });
    })
  );

  router.get(
    '/public/events/:slug',
    asyncHandler(async (req, res) => {
      const event = await container.eventUseCases.getPublicBySlug(String(req.params.slug));
      res.json({
        event: sanitizePublicEvent(event),
      });
    })
  );

  router.get(
    '/public/events/:slug/calendar.ics',
    asyncHandler(async (req, res) => {
      const event = await container.eventUseCases.getPublicBySlug(String(req.params.slug));
      const ics = RsvpDomainService.buildIcsCalendar(event);
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="boda-${event.slug}.ics"`);
      res.send(ics);
    })
  );

  router.get(
    '/public/invitations/:token',
    asyncHandler(async (req, res) => {
      const data = await container.rsvpUseCases.getByTokenAndTrackView(String(req.params.token));
      res.json({
        event: sanitizePublicEvent(data.event),
        group: data.group,
      });
    })
  );

  router.post(
    '/public/invitations/:token/rsvp',
    asyncHandler(async (req, res) => {
      const schema = z.object({
        members: z
          .array(
            z.object({
              id: z.string().min(1),
              fullName: z.string().max(120),
              attending: z.boolean(),
            })
          )
          .min(1),
        guestMessage: z.string().max(500).optional(),
      });
      const body = schema.parse(req.body);
      const updated = await container.rsvpUseCases.submitByToken(String(req.params.token), body);
      res.json({ group: updated });
    })
  );

  // Public Wishes
  router.get(
    '/public/events/:slug/wishes',
    asyncHandler(async (req, res) => {
      const wishes = await container.mediaAndWishUseCases.listPublicWishes(String(req.params.slug));
      res.json({ wishes });
    })
  );

  router.post(
    '/public/events/:slug/wishes',
    asyncHandler(async (req, res) => {
      const schema = z.object({
        authorName: z.string().min(1).max(80),
        message: z.string().min(1).max(600),
      });
      const body = schema.parse(req.body);
      const wish = await container.mediaAndWishUseCases.createPublicWish(
        String(req.params.slug),
        body.authorName,
        body.message
      );
      res.status(201).json({ wish });
    })
  );

  // Public Media QR Upload & Gallery
  router.get(
    '/public/events/:slug/photo-qr',
    asyncHandler(async (req, res) => {
      const event = await container.eventUseCases.getPublicBySlug(String(req.params.slug));
      const resolvedPhotosUrl =
        event.photosAlbumUrl?.trim() ||
        (event.photosAlbumId?.trim().startsWith('http') ? event.photosAlbumId.trim() : null);

      const resolvedDriveUrl = event.driveFolderUrl?.trim() || null;

      const targetUrl =
        resolvedPhotosUrl ||
        resolvedDriveUrl ||
        `${env.frontendUrl}/e/${event.slug}/fotos`;

      const qrDataUrl = await QRCode.toDataURL(targetUrl, {
        width: 600,
        margin: 2,
        color: {
          dark: '#1c1917',
          light: '#ffffff',
        },
      });

      res.json({
        targetUrl,
        destinationType: resolvedPhotosUrl
          ? 'GOOGLE_PHOTOS'
          : resolvedDriveUrl
            ? 'GOOGLE_DRIVE'
            : 'WEB_ALBUM',
        qrDataUrl,
        slug: event.slug,
        photosAlbumUrl: resolvedPhotosUrl,
        driveFolderUrl: resolvedDriveUrl,
      });
    })
  );

  router.get(
    '/public/events/:slug/media',
    asyncHandler(async (req, res) => {
      const media = await container.mediaAndWishUseCases.listPublicMedia(String(req.params.slug));
      res.json({ media });
    })
  );

  router.post(
    '/public/events/:slug/media/upload',
    pinUploadLimiter,
    mediaUpload.array('files', 15),
    asyncHandler(async (req, res) => {
      const files = (req.files as Express.Multer.File[]) || [];
      if (files.length === 0) {
        throw new AppError('Debes seleccionar al menos una foto o video', 400, 'NO_FILES');
      }
      const uploaderName = String(req.body?.uploaderName || 'Invitado');
      const caption = req.body?.caption ? String(req.body.caption) : undefined;
      const pin = req.body?.pin ? String(req.body.pin) : undefined;

      const uploaded = [];
      for (const file of files) {
        const asset = await container.mediaAndWishUseCases.uploadMediaBySlug({
          slug: String(req.params.slug),
          uploaderName,
          caption,
          pin,
          file,
        });
        uploaded.push(asset);
      }
      res.status(201).json({ uploaded });
    })
  );

  router.get(
    '/public/media/:mediaId/file',
    asyncHandler(async (req, res) => {
      const { media, stream } = await container.mediaAndWishUseCases.streamMedia(
        String(req.params.mediaId)
      );
      res.setHeader('Content-Type', media.mimeType);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      stream.pipe(res);
    })
  );

  // Google OAuth2 helper (por boda y global)
  router.get(
    '/media/google/auth-url',
    requireAuth,
    asyncHandler(async (_req, res) => {
      const url = container.driveProvider.getAuthUrl();
      res.json({
        url,
        configured: container.driveProvider.isConfigured(),
        hasOAuthApp: container.driveProvider.hasOAuthApp(),
      });
    })
  );

  router.get(
    '/events/:eventId/google/auth-url',
    requireAuth,
    asyncHandler(async (req, res) => {
      const event = await container.eventUseCases.getByIdForActor(
        String(req.params.eventId),
        req.user!
      );
      const eventCreds = {
        clientId: event.googleClientId,
        clientSecret: event.googleClientSecret,
        refreshToken: event.googleRefreshToken,
      };
      const state = jwt.sign({ eventId: event.id }, container.jwtSecret, { expiresIn: '15m' });
      const url = container.driveProvider.getAuthUrl(state, eventCreds);
      res.json({
        url,
        hasOAuthApp: container.driveProvider.hasOAuthApp(eventCreds),
        googleAccountEmail: event.googleAccountEmail || null,
        googlePerEventConnected: Boolean(event.googleRefreshToken),
      });
    })
  );

  router.post(
    '/events/:eventId/google/disconnect',
    requireAuth,
    asyncHandler(async (req, res) => {
      await container.mediaAndWishUseCases.disconnectGoogleAccount(
        String(req.params.eventId),
        req.user!
      );
      res.json({ ok: true });
    })
  );

  router.get(
    '/media/google/callback',
    asyncHandler(async (req, res) => {
      const code = String(req.query.code || '');
      if (!code) {
        throw new AppError('Falta código de autorización de Google', 400, 'MISSING_CODE');
      }

      let targetEventId: string | null = null;
      let eventCreds: any = null;
      const rawState = req.query.state ? String(req.query.state) : '';
      if (rawState) {
        try {
          const decoded = jwt.verify(rawState, container.jwtSecret) as { eventId?: string };
          if (decoded.eventId) {
            targetEventId = decoded.eventId;
            const ev = await container.eventRepo.findById(targetEventId);
            if (ev) {
              eventCreds = {
                clientId: ev.googleClientId,
                clientSecret: ev.googleClientSecret,
                refreshToken: ev.googleRefreshToken,
              };
            }
          }
        } catch {
          throw new AppError('Estado OAuth inválido o expirado', 400, 'INVALID_OAUTH_STATE');
        }
      }

      const { refreshToken, email } = await container.driveProvider.exchangeCodeForTokens(
        code,
        !targetEventId,
        eventCreds
      );

      if (targetEventId && refreshToken) {
        await container.mediaAndWishUseCases.saveGoogleConnection(
          targetEventId,
          email,
          refreshToken
        );
      }

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(
        `<html><body style="font-family:sans-serif;padding:32px;max-width:560px;margin:auto;text-align:center;">
          <h2 style="color:#1c1917;">Cuenta Google conectada${targetEventId ? ' a esta boda' : ''}</h2>
          ${email ? `<p style="color:#059669;font-weight:600;">Correo vinculado: ${email}</p>` : ''}
          ${
            !refreshToken
              ? '<p style="color:#b91c1c;">Google no devolvió un refresh_token nuevo. Revoca el acceso previo en myaccount.google.com/permissions y vuelve a autorizar.</p>'
              : targetEventId
                ? '<p style="color:#57534e;">Las fotos y archivos de esta boda se guardarán automáticamente en esta cuenta. Ya puedes cerrar esta ventana.</p>'
                : `<p style="color:#57534e;">Cuenta autorizada exitosamente.</p>`
          }
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_OAUTH_DONE', eventId: ${JSON.stringify(targetEventId)}, email: ${JSON.stringify(email)} }, '*');
              setTimeout(() => window.close(), 1500);
            }
          </script>
        </body></html>`
      );
    })
  );

  // Admin: Organizations / Wedding Planners (Solo SUPERADMIN)
  router.get(
    '/organizations',
    requireAuth,
    asyncHandler(async (req, res) => {
      const organizations = await container.organizationUseCases.list(req.user!);
      res.json({ organizations });
    })
  );

  router.post(
    '/organizations',
    requireAuth,
    asyncHandler(async (req, res) => {
      const schema = z.object({
        name: z.string().min(2).max(120),
        slug: z.string().min(2).max(100),
        type: z.enum(['DIRECT', 'PLANNER']).optional(),
        contactEmail: z.string().email().nullable().optional().or(z.literal('')),
        maxEvents: z.number().int().min(1).max(10000).optional(),
        adminUser: z
          .object({
            name: z.string().min(2).max(120),
            email: z.string().email(),
            password: z.string().min(6).max(100),
          })
          .optional(),
      });
      const body = schema.parse(req.body);
      const organization = await container.organizationUseCases.create(req.user!, body);
      res.status(201).json({ organization });
    })
  );

  router.put(
    '/organizations/:orgId',
    requireAuth,
    asyncHandler(async (req, res) => {
      const schema = z.object({
        name: z.string().min(2).max(120).optional(),
        type: z.enum(['DIRECT', 'PLANNER']).optional(),
        contactEmail: z.string().email().nullable().optional().or(z.literal('')),
        maxEvents: z.number().int().min(1).max(10000).optional(),
        isActive: z.boolean().optional(),
      });
      const body = schema.parse(req.body);
      const organization = await container.organizationUseCases.update(
        String(req.params.orgId),
        req.user!,
        body
      );
      res.json({ organization });
    })
  );

  router.delete(
    '/organizations/:orgId',
    requireAuth,
    asyncHandler(async (req, res) => {
      await container.organizationUseCases.remove(String(req.params.orgId), req.user!);
      res.status(204).send();
    })
  );

  router.post(
    '/organizations/:orgId/admins',
    requireAuth,
    asyncHandler(async (req, res) => {
      const schema = z.object({
        name: z.string().min(2).max(120),
        email: z.string().email(),
        password: z.string().min(6).max(100),
      });
      const body = schema.parse(req.body);
      const admin = await container.organizationUseCases.upsertOrgAdmin(
        String(req.params.orgId),
        req.user!,
        body
      );
      res.status(201).json({ admin });
    })
  );

  router.delete(
    '/organizations/:orgId/admins/:userId',
    requireAuth,
    asyncHandler(async (req, res) => {
      await container.organizationUseCases.deleteOrgAdmin(
        String(req.params.orgId),
        String(req.params.userId),
        req.user!
      );
      res.status(204).send();
    })
  );

  // Admin: Events (SUPERADMIN, ORG_ADMIN y COUPLE scoping)
  router.get(
    '/events',
    requireAuth,
    asyncHandler(async (req, res) => {
      const orgFilter = req.query.organizationId ? String(req.query.organizationId) : undefined;
      const events = await container.eventUseCases.listForActor(req.user!, orgFilter);
      res.json({ events });
    })
  );

  router.post(
    '/events',
    requireAuth,
    asyncHandler(async (req, res) => {
      const schema = z.object({
        slug: z.string().min(2).max(100),
        title: z.string().min(2).max(120),
        partnerOneName: z.string().min(1).max(120),
        partnerTwoName: z.string().min(1).max(120),
        eventDate: z.string().min(4),
        rsvpDeadline: z.string().nullable().optional(),
        ceremonyTitle: z.string().optional(),
        ceremonyTime: z.string().optional(),
        ceremonyAddress: z.string().optional(),
        ceremonyMapUrl: z.string().optional(),
        receptionTitle: z.string().optional(),
        receptionTime: z.string().optional(),
        receptionAddress: z.string().optional(),
        receptionMapUrl: z.string().optional(),
        theme: z.string().optional(),
        themeConfig: z.record(z.unknown()).optional(),
        sectionsConfig: z.record(z.boolean()).optional(),
        contentConfig: z.record(z.unknown()).optional(),
        driveFolderId: z.string().nullable().optional(),
        driveFolderUrl: z.string().nullable().optional(),
        photosAlbumId: z.string().nullable().optional(),
        photosAlbumUrl: z.string().nullable().optional(),
        mediaProvider: z.enum(['GOOGLE_PHOTOS', 'GOOGLE_DRIVE', 'HYBRID', 'LOCAL_FALLBACK']).optional(),
        googleClientId: z.string().nullable().optional(),
        googleClientSecret: z.string().nullable().optional(),
        photoPin: z.string().nullable().optional(),
        isPrimary: z.boolean().optional(),
        organizationId: z.string().nullable().optional(),
      });
      const body = schema.parse(req.body);
      const event = await container.eventUseCases.create(req.user!, body as any);
      res.status(201).json({ event });
    })
  );

  router.get(
    '/events/:eventId',
    requireAuth,
    asyncHandler(async (req, res) => {
      const event = await container.eventUseCases.getByIdForActor(
        String(req.params.eventId),
        req.user!
      );
      res.json({ event });
    })
  );

  router.put(
    '/events/:eventId',
    requireAuth,
    asyncHandler(async (req, res) => {
      const event = await container.eventUseCases.update(
        String(req.params.eventId),
        req.user!,
        req.body
      );
      res.json({ event });
    })
  );

  router.delete(
    '/events/:eventId',
    requireAuth,
    asyncHandler(async (req, res) => {
      await container.eventUseCases.remove(String(req.params.eventId), req.user!);
      res.status(204).send();
    })
  );

  // Subida de imágenes y assets para configuración de evento (portada, galería prenupcial, etc.)
  router.post(
    '/events/:eventId/upload-asset',
    requireAuth,
    assetUpload.array('files', 20),
    asyncHandler(async (req, res) => {
      // Verificar permisos sobre el evento
      await container.eventUseCases.getByIdForActor(String(req.params.eventId), req.user!);

      const files =
        (req.files as Express.Multer.File[]) ||
        (req.file ? [req.file as Express.Multer.File] : []);

      if (!files || files.length === 0) {
        throw new AppError('No se recibió ningún archivo de imagen válido', 400, 'NO_FILES_UPLOADED');
      }

      const host = req.get('host') || 'localhost:4006';
      const protocol = req.protocol || 'http';
      const baseUrl = `${protocol}://${host}`;

      const urls = files.map((f) => `/uploads/assets/${f.filename}`);
      const fullUrls = files.map((f) => `${baseUrl}/uploads/assets/${f.filename}`);

      res.status(201).json({
        urls,
        fullUrls,
        url: urls[0],
        fullUrl: fullUrls[0],
        count: urls.length,
      });
    })
  );

  // Admin: Couple Users (Solo SUPERADMIN)
  router.get(
    '/events/:eventId/couple-users',
    requireAuth,
    asyncHandler(async (req, res) => {
      const users = await container.authUseCases.listCoupleUsers(
        String(req.params.eventId),
        req.user!
      );
      res.json({ users });
    })
  );

  router.post(
    '/events/:eventId/couple-users',
    requireAuth,
    asyncHandler(async (req, res) => {
      const schema = z.object({
        email: z.string().email(),
        name: z.string().min(2).max(120),
        password: z.string().min(6).max(100),
      });
      const body = schema.parse(req.body);
      const user = await container.authUseCases.upsertCoupleUser(
        String(req.params.eventId),
        req.user!,
        body
      );
      res.status(201).json({ user });
    })
  );

  router.delete(
    '/events/:eventId/couple-users/:userId',
    requireAuth,
    asyncHandler(async (req, res) => {
      await container.authUseCases.deleteCoupleUser(
        String(req.params.eventId),
        String(req.params.userId),
        req.user!
      );
      res.status(204).send();
    })
  );

  // Admin: Guests & Stats
  router.get(
    '/events/:eventId/stats',
    requireAuth,
    asyncHandler(async (req, res) => {
      const stats = await container.guestUseCases.getStats(String(req.params.eventId), req.user!);
      res.json({ stats });
    })
  );

  router.get(
    '/events/:eventId/guests',
    requireAuth,
    asyncHandler(async (req, res) => {
      const guests = await container.guestUseCases.listByEvent(
        String(req.params.eventId),
        req.user!
      );
      res.json({ guests });
    })
  );

  router.post(
    '/events/:eventId/guests',
    requireAuth,
    asyncHandler(async (req, res) => {
      const schema = z.object({
        groupName: z.string().min(1).max(120),
        category: z.string().max(60).optional(),
        email: z.string().email().nullable().optional().or(z.literal('')),
        phone: z.string().max(30).nullable().optional(),
        maxGuests: z.number().int().min(1).max(20),
        memberNames: z.array(z.string()).optional(),
      });
      const body = schema.parse(req.body);
      const guest = await container.guestUseCases.create(
        String(req.params.eventId),
        req.user!,
        body
      );
      res.status(201).json({ guest });
    })
  );

  router.put(
    '/events/:eventId/guests/:groupId',
    requireAuth,
    asyncHandler(async (req, res) => {
      const guest = await container.guestUseCases.update(
        String(req.params.eventId),
        String(req.params.groupId),
        req.user!,
        req.body
      );
      res.json({ guest });
    })
  );

  router.delete(
    '/events/:eventId/guests/:groupId',
    requireAuth,
    asyncHandler(async (req, res) => {
      await container.guestUseCases.delete(
        String(req.params.eventId),
        String(req.params.groupId),
        req.user!
      );
      res.status(204).send();
    })
  );

  router.post(
    '/events/:eventId/guests/import',
    requireAuth,
    excelUpload.single('file'),
    asyncHandler(async (req, res) => {
      if (!req.file) {
        throw new AppError('Adjunta un archivo Excel (.xlsx o .csv)', 400, 'NO_FILE');
      }
      const result = await container.guestUseCases.importFromExcel(
        String(req.params.eventId),
        req.user!,
        req.file.buffer
      );
      res.json(result);
    })
  );

  router.get(
    '/events/:eventId/guests/export',
    requireAuth,
    asyncHandler(async (req, res) => {
      const format = String(req.query.format || 'EXCEL').toUpperCase() === 'PDF' ? 'PDF' : 'EXCEL';
      const result = await container.guestUseCases.exportReport(
        String(req.params.eventId),
        req.user!,
        format
      );
      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
      res.send(result.buffer);
    })
  );

  // Admin & Couple: Mesas y Puestos
  router.get(
    '/events/:eventId/tables',
    requireAuth,
    asyncHandler(async (req, res) => {
      const data = await container.tableUseCases.listSeating(
        String(req.params.eventId),
        req.user!
      );
      res.json(data);
    })
  );

  router.post(
    '/events/:eventId/tables',
    requireAuth,
    asyncHandler(async (req, res) => {
      const schema = z.object({
        name: z.string().min(1).max(80),
        capacity: z.number().int().min(1).max(30).optional(),
        shape: z.enum(['ROUND', 'RECTANGULAR', 'HEAD']).optional(),
        zone: z.string().max(80).optional(),
      });
      const body = schema.parse(req.body);
      const table = await container.tableUseCases.createTable(
        String(req.params.eventId),
        req.user!,
        body
      );
      res.status(201).json({ table });
    })
  );

  router.put(
    '/events/:eventId/tables/:tableId',
    requireAuth,
    asyncHandler(async (req, res) => {
      const schema = z.object({
        name: z.string().min(1).max(80).optional(),
        capacity: z.number().int().min(1).max(30).optional(),
        shape: z.enum(['ROUND', 'RECTANGULAR', 'HEAD']).optional(),
        zone: z.string().max(80).optional(),
        sortOrder: z.number().int().optional(),
      });
      const body = schema.parse(req.body);
      const table = await container.tableUseCases.updateTable(
        String(req.params.eventId),
        String(req.params.tableId),
        req.user!,
        body
      );
      res.json({ table });
    })
  );

  router.delete(
    '/events/:eventId/tables/:tableId',
    requireAuth,
    asyncHandler(async (req, res) => {
      await container.tableUseCases.deleteTable(
        String(req.params.eventId),
        String(req.params.tableId),
        req.user!
      );
      res.status(204).send();
    })
  );

  router.post(
    '/events/:eventId/tables/:tableId/assign',
    requireAuth,
    asyncHandler(async (req, res) => {
      const schema = z.object({
        memberId: z.string().optional(),
        memberIds: z.array(z.string().min(1)).optional(),
        groupId: z.string().optional(),
        seatNumber: z.number().int().min(1).max(30).nullable().optional(),
      });
      const body = schema.parse(req.body);
      const table = await container.tableUseCases.assignToTable(
        String(req.params.eventId),
        String(req.params.tableId),
        req.user!,
        body
      );
      res.json({ table });
    })
  );

  router.post(
    '/events/:eventId/tables/unassign',
    requireAuth,
    asyncHandler(async (req, res) => {
      const schema = z.object({ memberId: z.string().min(1) });
      const { memberId } = schema.parse(req.body);
      await container.tableUseCases.unassignMember(
        String(req.params.eventId),
        req.user!,
        memberId
      );
      res.status(204).send();
    })
  );

  router.get(
    '/events/:eventId/tables/export',
    requireAuth,
    asyncHandler(async (req, res) => {
      const format = String(req.query.format || 'EXCEL').toUpperCase() === 'PDF' ? 'PDF' : 'EXCEL';
      const result = await container.tableUseCases.exportSeatingReport(
        String(req.params.eventId),
        req.user!,
        format
      );
      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
      res.send(result.buffer);
    })
  );

  // Admin: Dispatch (WhatsApp & Email)
  router.post(
    '/events/:eventId/dispatch',
    requireAuth,
    asyncHandler(async (req, res) => {
      const schema = z.object({
        channel: z.enum(['WHATSAPP', 'EMAIL']),
        groupIds: z.array(z.string()).optional(),
        onlyPending: z.boolean().optional(),
        onlyConfirmed: z.boolean().optional(),
        customMessage: z.string().max(2500).optional(),
        subject: z.string().max(200).optional(),
      });
      const body = schema.parse(req.body);
      const summary = await container.dispatchUseCases.sendBatch(
        String(req.params.eventId),
        req.user!,
        body
      );
      res.json(summary);
    })
  );

  router.get(
    '/events/:eventId/dispatch/logs',
    requireAuth,
    asyncHandler(async (req, res) => {
      const logs = await container.dispatchUseCases.listLogs(
        String(req.params.eventId),
        req.user!
      );
      res.json({ logs });
    })
  );

  // Admin: Configuración SMTP de Correo y Prueba en Vivo
  router.get(
    '/events/:eventId/email-config',
    requireAuth,
    asyncHandler(async (req, res) => {
      const event = await container.eventUseCases.getByIdForActor(
        String(req.params.eventId),
        req.user!
      );
      const isCustomConfigured = Boolean(event.smtpUser && event.smtpPass);
      const isGlobalConfigured = container.emailProvider.isConfigured(null);
      res.json({
        smtp: {
          host: event.smtpHost || '',
          port: event.smtpPort || 465,
          secure: event.smtpSecure !== false,
          user: event.smtpUser || '',
          pass: event.smtpPass ? '••••••••' : '',
          fromName: event.smtpFromName || `${event.partnerOneName} & ${event.partnerTwoName}`,
          isCustomConfigured,
          isConfigured: isCustomConfigured || isGlobalConfigured,
          usingGlobalFallback: !isCustomConfigured && isGlobalConfigured,
        },
      });
    })
  );

  router.put(
    '/events/:eventId/email-config',
    requireAuth,
    asyncHandler(async (req, res) => {
      const schema = z.object({
        host: z.string().optional().or(z.literal('')),
        port: z.number().int().min(1).max(65535).optional(),
        secure: z.boolean().optional(),
        user: z.string().email().optional().or(z.literal('')),
        pass: z.string().optional().or(z.literal('')),
        fromName: z.string().max(120).optional().or(z.literal('')),
      });
      const body = schema.parse(req.body);
      const current = await container.eventUseCases.getByIdForActor(
        String(req.params.eventId),
        req.user!
      );

      const pass =
        body.pass && body.pass !== '••••••••'
          ? body.pass.replace(/\s+/g, '')
          : body.pass === ''
            ? null
            : current.smtpPass;

      const updated = await container.eventUseCases.update(String(req.params.eventId), req.user!, {
        smtpHost: body.host !== undefined ? body.host.trim() || null : undefined,
        smtpPort: body.port !== undefined ? body.port : undefined,
        smtpSecure: body.secure !== undefined ? body.secure : undefined,
        smtpUser: body.user !== undefined ? body.user.trim().toLowerCase() || null : undefined,
        smtpPass: pass,
        smtpFromName: body.fromName !== undefined ? body.fromName.trim() || null : undefined,
      });

      const isCustomConfigured = Boolean(updated.smtpUser && updated.smtpPass);
      res.json({
        smtp: {
          host: updated.smtpHost || '',
          port: updated.smtpPort || 465,
          secure: updated.smtpSecure !== false,
          user: updated.smtpUser || '',
          pass: updated.smtpPass ? '••••••••' : '',
          fromName: updated.smtpFromName || '',
          isCustomConfigured,
          isConfigured: isCustomConfigured || container.emailProvider.isConfigured(null),
        },
      });
    })
  );

  router.post(
    '/events/:eventId/email-config/test',
    requireAuth,
    asyncHandler(async (req, res) => {
      const schema = z.object({
        testEmail: z.string().email(),
      });
      const { testEmail } = schema.parse(req.body);
      const event = await container.eventUseCases.getByIdForActor(
        String(req.params.eventId),
        req.user!
      );

      const customSmtp =
        event.smtpUser && event.smtpPass
          ? {
              host: event.smtpHost || undefined,
              port: event.smtpPort || undefined,
              secure: event.smtpSecure !== false,
              user: event.smtpUser,
              pass: event.smtpPass,
              fromName: event.smtpFromName || `${event.partnerOneName} & ${event.partnerTwoName}`,
            }
          : null;

      const testHtml = `
        <div style="font-family:Georgia,serif;max-width:540px;margin:auto;padding:24px;border:1px solid #e7dcc8;border-radius:16px;background:#ffffff;color:#292524;text-align:center;">
          <h2 style="color:#1c1917;margin-top:0;">Prueba de Envío Exitosa 💌</h2>
          <p style="font-size:14px;color:#57534e;">Este es un correo de prueba enviado desde el sistema de invitaciones para la boda de:</p>
          <h3 style="color:#b08d57;font-size:20px;margin:12px 0;">${event.partnerOneName} &amp; ${event.partnerTwoName}</h3>
          <p style="font-size:12px;color:#78716c;background:#faf7f2;padding:12px;border-radius:8px;display:inline-block;">
            Servidor SMTP verificado y listo para enviar invitaciones a los invitados.
          </p>
        </div>
      `;

      const result = await container.emailProvider.sendHtml({
        to: testEmail,
        subject: `Prueba de correo — Boda ${event.partnerOneName} & ${event.partnerTwoName}`,
        html: testHtml,
        smtpConfig: customSmtp,
      });

      if (!result.ok) {
        throw new AppError(result.error || 'No se pudo enviar el correo de prueba', 400, 'SMTP_TEST_FAILED');
      }

      res.json({ ok: true, message: `Correo de prueba enviado a ${testEmail}` });
    })
  );

  // Admin: Configuración Google Drive & Photos y Prueba en Vivo
  router.get(
    '/events/:eventId/drive-config',
    requireAuth,
    asyncHandler(async (req, res) => {
      const event = await container.eventUseCases.getByIdForActor(
        String(req.params.eventId),
        req.user!
      );
      const eventCreds = {
        clientId: event.googleClientId,
        clientSecret: event.googleClientSecret,
        refreshToken: event.googleRefreshToken,
      };
      const isCustomConnected = Boolean(event.googleRefreshToken);
      const isGlobalConfigured = container.driveProvider.isConfigured(null);

      res.json({
        drive: {
          mediaProvider: event.mediaProvider,
          driveFolderId: event.driveFolderId || null,
          driveFolderUrl: event.driveFolderUrl || null,
          photosAlbumId: event.photosAlbumId || null,
          photosAlbumUrl: event.photosAlbumUrl || null,
          photoPin: event.photoPin || null,
          googleClientId: event.googleClientId || null,
          hasCustomClientSecret: Boolean(event.googleClientSecret),
          googleAccountEmail: event.googleAccountEmail || null,
          isCustomConnected,
          isGlobalConfigured,
          isConfigured: isCustomConnected || isGlobalConfigured,
          usingGlobalFallback: !isCustomConnected && isGlobalConfigured,
          hasOAuthApp: container.driveProvider.hasOAuthApp(eventCreds),
        },
      });
    })
  );

  router.put(
    '/events/:eventId/drive-config',
    requireAuth,
    asyncHandler(async (req, res) => {
      const schema = z.object({
        mediaProvider: z.enum(['GOOGLE_PHOTOS', 'GOOGLE_DRIVE', 'HYBRID', 'LOCAL_FALLBACK']).optional(),
        driveFolderId: z.string().trim().max(500).nullable().optional().or(z.literal('')),
        driveFolderUrl: z.string().trim().max(1000).nullable().optional().or(z.literal('')),
        photosAlbumId: z.string().trim().max(500).nullable().optional().or(z.literal('')),
        photosAlbumUrl: z.string().trim().max(1000).nullable().optional().or(z.literal('')),
        photoPin: z.string().trim().max(20).nullable().optional().or(z.literal('')),
        googleClientId: z.string().trim().max(500).nullable().optional().or(z.literal('')),
        googleClientSecret: z.string().trim().max(500).nullable().optional().or(z.literal('')),
      });
      const body = schema.parse(req.body);

      const updated = await container.eventUseCases.update(
        String(req.params.eventId),
        req.user!,
        {
          mediaProvider: body.mediaProvider ? (body.mediaProvider === 'LOCAL_FALLBACK' ? 'HYBRID' : body.mediaProvider as any) : undefined,
          driveFolderId: body.driveFolderId !== undefined ? (body.driveFolderId === '' ? null : body.driveFolderId) : undefined,
          driveFolderUrl: body.driveFolderUrl !== undefined ? (body.driveFolderUrl === '' ? null : body.driveFolderUrl) : undefined,
          photosAlbumId: body.photosAlbumId !== undefined ? (body.photosAlbumId === '' ? null : body.photosAlbumId) : undefined,
          photosAlbumUrl: body.photosAlbumUrl !== undefined ? (body.photosAlbumUrl === '' ? null : body.photosAlbumUrl) : undefined,
          photoPin: body.photoPin !== undefined ? (body.photoPin === '' ? null : body.photoPin) : undefined,
          googleClientId: body.googleClientId !== undefined ? (body.googleClientId === '' ? null : body.googleClientId) : undefined,
          googleClientSecret: body.googleClientSecret !== undefined ? (body.googleClientSecret === '' ? null : body.googleClientSecret) : undefined,
        }
      );

      const eventCreds = {
        clientId: updated.googleClientId,
        clientSecret: updated.googleClientSecret,
        refreshToken: updated.googleRefreshToken,
      };
      const isCustomConnected = Boolean(updated.googleRefreshToken);
      const isGlobalConfigured = container.driveProvider.isConfigured(null);

      res.json({
        drive: {
          mediaProvider: updated.mediaProvider,
          driveFolderId: updated.driveFolderId || null,
          driveFolderUrl: updated.driveFolderUrl || null,
          photosAlbumId: updated.photosAlbumId || null,
          photosAlbumUrl: updated.photosAlbumUrl || null,
          photoPin: updated.photoPin || null,
          googleClientId: updated.googleClientId || null,
          hasCustomClientSecret: Boolean(updated.googleClientSecret),
          googleAccountEmail: updated.googleAccountEmail || null,
          isCustomConnected,
          isGlobalConfigured,
          isConfigured: isCustomConnected || isGlobalConfigured,
          usingGlobalFallback: !isCustomConnected && isGlobalConfigured,
          hasOAuthApp: container.driveProvider.hasOAuthApp(eventCreds),
        },
      });
    })
  );

  router.post(
    '/events/:eventId/drive-config/test',
    requireAuth,
    asyncHandler(async (req, res) => {
      const schema = z
        .object({
          folderId: z.string().trim().max(500).optional(),
          mediaProvider: z.enum(['GOOGLE_PHOTOS', 'GOOGLE_DRIVE', 'HYBRID', 'LOCAL_FALLBACK']).optional(),
        })
        .optional();
      const body = schema ? schema.parse(req.body) : {};

      const event = await container.eventUseCases.getByIdForActor(
        String(req.params.eventId),
        req.user!
      );

      const eventCreds = {
        clientId: event.googleClientId,
        clientSecret: event.googleClientSecret,
        refreshToken: event.googleRefreshToken,
      };

      const isConfigured = container.driveProvider.isConfigured(event.googleRefreshToken, eventCreds);
      if (!isConfigured) {
        throw new AppError(
          'No hay cuenta de Google Drive / Photos vinculada a este evento ni configurada en el servidor. Vincula tu cuenta con el botón "Vincular con Google".',
          400,
          'DRIVE_NOT_CONFIGURED'
        );
      }

      const testResult = await container.driveProvider.testConnection({
        refreshToken: event.googleRefreshToken,
        folderId: body?.folderId !== undefined ? body.folderId : (event.driveFolderId || event.driveFolderUrl),
        mediaProvider: body?.mediaProvider && body.mediaProvider !== 'LOCAL_FALLBACK' ? body.mediaProvider : event.mediaProvider,
        credentials: eventCreds,
      });

      if (!testResult.ok) {
        throw new AppError(
          testResult.error || 'Fallo en la prueba de conexión con Google Drive',
          testResult.errorCode === 'DRIVE_FOLDER_NOT_FOUND' ? 404 : 400,
          testResult.errorCode || 'DRIVE_TEST_FAILED'
        );
      }

      res.json({
        ok: true,
        message: 'Conexión con Google verificada exitosamente',
        details: {
          accountEmail: testResult.email || event.googleAccountEmail || null,
          mediaProvider: body?.mediaProvider || event.mediaProvider,
          driveAccessible: true,
          folderVerified: Boolean(testResult.folderName),
          folderName: testResult.folderName || null,
        },
      });
    })
  );

  // Admin: Media & Wishes & QR
  router.get(
    '/events/:eventId/media/qr',
    requireAuth,
    asyncHandler(async (req, res) => {
      const qr = await container.mediaAndWishUseCases.generatePhotoQr(
        String(req.params.eventId),
        req.user!
      );
      res.json(qr);
    })
  );

  router.get(
    '/events/:eventId/media',
    requireAuth,
    asyncHandler(async (req, res) => {
      const media = await container.mediaAndWishUseCases.listAdminMedia(
        String(req.params.eventId),
        req.user!
      );
      res.json({ media });
    })
  );

  router.patch(
    '/events/:eventId/media/:mediaId',
    requireAuth,
    asyncHandler(async (req, res) => {
      const schema = z.object({ status: z.enum(['APPROVED', 'PENDING', 'REJECTED']) });
      const { status } = schema.parse(req.body);
      const updated = await container.mediaAndWishUseCases.moderateMedia(
        String(req.params.eventId),
        String(req.params.mediaId),
        req.user!,
        status
      );
      res.json({ media: updated });
    })
  );

  router.delete(
    '/events/:eventId/media/:mediaId',
    requireAuth,
    asyncHandler(async (req, res) => {
      await container.mediaAndWishUseCases.deleteMedia(
        String(req.params.eventId),
        String(req.params.mediaId),
        req.user!
      );
      res.status(204).send();
    })
  );

  router.get(
    '/events/:eventId/wishes',
    requireAuth,
    asyncHandler(async (req, res) => {
      const wishes = await container.mediaAndWishUseCases.listAdminWishes(
        String(req.params.eventId),
        req.user!
      );
      res.json({ wishes });
    })
  );

  router.delete(
    '/events/:eventId/wishes/:wishId',
    requireAuth,
    asyncHandler(async (req, res) => {
      await container.mediaAndWishUseCases.deleteWish(
        String(req.params.eventId),
        String(req.params.wishId),
        req.user!
      );
      res.status(204).send();
    })
  );

  // Admin: WhatsApp Baileys Control
  router.get('/whatsapp/status', requireAuth, (_req, res) => {
    res.json(container.whatsappProvider.getState());
  });

  router.post(
    '/whatsapp/connect',
    requireAuth,
    asyncHandler(async (_req, res) => {
      await container.whatsappProvider.connect();
      res.json(container.whatsappProvider.getState());
    })
  );

  router.post(
    '/whatsapp/disconnect',
    requireAuth,
    asyncHandler(async (_req, res) => {
      await container.whatsappProvider.disconnect();
      res.json(container.whatsappProvider.getState());
    })
  );

  return router;
}
