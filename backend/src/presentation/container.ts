import { PrismaClient } from '@prisma/client';
import { AuthUseCases } from '../application/use-cases/AuthUseCases';
import { DispatchUseCases } from '../application/use-cases/DispatchUseCases';
import { EventUseCases } from '../application/use-cases/EventUseCases';
import { GuestUseCases } from '../application/use-cases/GuestUseCases';
import { MediaAndWishUseCases } from '../application/use-cases/MediaAndWishUseCases';
import { OrganizationUseCases } from '../application/use-cases/OrganizationUseCases';
import { RsvpUseCases } from '../application/use-cases/RsvpUseCases';
import { TableUseCases } from '../application/use-cases/TableUseCases';
import { env } from '../infrastructure/config/env';
import { prisma as defaultPrisma } from '../infrastructure/database/prismaClient';
import {
  PrismaAdminUserRepository,
  PrismaDispatchRepository,
  PrismaEventRepository,
  PrismaGuestRepository,
  PrismaMediaRepository,
  PrismaOrganizationRepository,
  PrismaTableRepository,
  PrismaWishRepository,
} from '../infrastructure/database/PrismaRepositories';
import { BaileysWhatsAppProvider } from '../infrastructure/providers/BaileysWhatsAppProvider';
import { GoogleDriveStorageProvider } from '../infrastructure/providers/GoogleDriveStorageProvider';
import { NodemailerEmailProvider } from '../infrastructure/providers/NodemailerEmailProvider';
import {
  IDriveStorageProvider,
  IEmailProvider,
  IWhatsAppProvider,
} from '../domain/ports/Providers';

export interface AppContainer {
  authUseCases: AuthUseCases;
  organizationUseCases: OrganizationUseCases;
  eventUseCases: EventUseCases;
  guestUseCases: GuestUseCases;
  rsvpUseCases: RsvpUseCases;
  tableUseCases: TableUseCases;
  dispatchUseCases: DispatchUseCases;
  mediaAndWishUseCases: MediaAndWishUseCases;
  whatsappProvider: IWhatsAppProvider;
  emailProvider: IEmailProvider;
  driveProvider: IDriveStorageProvider;
  jwtSecret: string;
}

export function buildContainer(overrides?: {
  db?: PrismaClient;
  whatsappProvider?: IWhatsAppProvider;
  emailProvider?: IEmailProvider;
  driveProvider?: IDriveStorageProvider;
}): AppContainer {
  const db = overrides?.db || defaultPrisma;

  const orgRepo = new PrismaOrganizationRepository(db);
  const adminRepo = new PrismaAdminUserRepository(db);
  const eventRepo = new PrismaEventRepository(db);
  const guestRepo = new PrismaGuestRepository(db);
  const tableRepo = new PrismaTableRepository(db);
  const dispatchRepo = new PrismaDispatchRepository(db);
  const wishRepo = new PrismaWishRepository(db);
  const mediaRepo = new PrismaMediaRepository(db);

  const whatsappProvider =
    overrides?.whatsappProvider || new BaileysWhatsAppProvider(env.whatsappSessionDir);
  const emailProvider =
    overrides?.emailProvider ||
    new NodemailerEmailProvider(env.gmailUser, env.gmailAppPassword, env.gmailFromName);
  const driveProvider =
    overrides?.driveProvider ||
    new GoogleDriveStorageProvider(
      env.googleClientId,
      env.googleClientSecret,
      env.googleRedirectUri,
      env.googleRefreshToken,
      env.googleDriveRootFolderId,
      env.localMediaFallbackDir
    );

  return {
    authUseCases: new AuthUseCases(adminRepo, eventRepo, orgRepo, env.jwtSecret, env.jwtExpiresIn),
    organizationUseCases: new OrganizationUseCases(orgRepo, adminRepo),
    eventUseCases: new EventUseCases(eventRepo, orgRepo),
    guestUseCases: new GuestUseCases(guestRepo, eventRepo),
    rsvpUseCases: new RsvpUseCases(guestRepo),
    tableUseCases: new TableUseCases(eventRepo, tableRepo, guestRepo),
    dispatchUseCases: new DispatchUseCases(
      eventRepo,
      guestRepo,
      dispatchRepo,
      whatsappProvider,
      emailProvider,
      env.frontendUrl,
      env.whatsappMinDelayMs,
      env.whatsappMaxDelayMs
    ),
    mediaAndWishUseCases: new MediaAndWishUseCases(
      eventRepo,
      mediaRepo,
      wishRepo,
      driveProvider,
      env.frontendUrl
    ),
    whatsappProvider,
    emailProvider,
    driveProvider,
    jwtSecret: env.jwtSecret,
  };
}
