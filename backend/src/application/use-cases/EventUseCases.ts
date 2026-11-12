import {
  DEFAULT_SECTIONS_CONFIG,
  EventContentConfig,
  EventEntity,
  EventSectionsConfig,
  EventTheme,
  EventThemeConfig,
  MediaProviderType,
} from '../../domain/entities/Event';
import { IEventRepository, IOrganizationRepository } from '../../domain/ports/Repositories';
import { OrganizationDomainService } from '../../domain/services/OrganizationDomainService';
import { AppError } from '../../shared/errors/AppError';
import {
  AuthActor,
  ensureCanManageEventsOrCouples,
  ensureEventAccess,
} from '../helpers/AccessControlHelper';

export interface CreateEventDto {
  slug: string;
  title: string;
  partnerOneName: string;
  partnerTwoName: string;
  eventDate: string;
  rsvpDeadline?: string | null;
  ceremonyTitle?: string;
  ceremonyTime?: string;
  ceremonyAddress?: string;
  ceremonyMapUrl?: string;
  receptionTitle?: string;
  receptionTime?: string;
  receptionAddress?: string;
  receptionMapUrl?: string;
  theme?: EventTheme;
  themeConfig?: EventThemeConfig;
  sectionsConfig?: Partial<EventSectionsConfig>;
  contentConfig?: EventContentConfig;
  driveFolderId?: string | null;
  photosAlbumId?: string | null;
  mediaProvider?: MediaProviderType;
  photoPin?: string | null;
  isPrimary?: boolean;
  organizationId?: string | null;
}

export interface UpdateEventDto extends Partial<CreateEventDto> {
  isActive?: boolean;
  googleAccountEmail?: string | null;
  googleRefreshToken?: string | null;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpSecure?: boolean | null;
  smtpUser?: string | null;
  smtpPass?: string | null;
  smtpFromName?: string | null;
}

export class EventUseCases {
  constructor(
    private readonly eventRepo: IEventRepository,
    private readonly orgRepo: IOrganizationRepository
  ) {}

  async listForActor(actor: AuthActor, filterOrganizationId?: string): Promise<EventEntity[]> {
    if (actor.role === 'COUPLE') {
      if (!actor.assignedEventId) return [];
      const event = await this.eventRepo.findById(actor.assignedEventId);
      return event ? [event] : [];
    }

    if (actor.role === 'ORG_ADMIN') {
      if (!actor.organizationId) return [];
      return this.eventRepo.findAllByOrganization(actor.organizationId);
    }

    return this.eventRepo.findAll(filterOrganizationId);
  }

  async getByIdForActor(eventId: string, actor: AuthActor): Promise<EventEntity> {
    return ensureEventAccess(this.eventRepo, eventId, actor);
  }

  async getFeaturedPublic(): Promise<EventEntity | null> {
    return this.eventRepo.findFeatured();
  }

  async getPublicBySlug(slug: string): Promise<EventEntity> {
    const event = await this.eventRepo.findBySlug(slug);
    if (!event || !event.isActive) {
      throw new AppError('Invitación no encontrada o inactiva', 404, 'NOT_FOUND');
    }
    return event;
  }

  async create(actor: AuthActor, dto: CreateEventDto): Promise<EventEntity> {
    ensureCanManageEventsOrCouples(actor);

    const cleanSlug = dto.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-|-$/g, '');

    if (!cleanSlug) {
      throw new AppError('El slug del evento es inválido', 400, 'INVALID_SLUG');
    }

    const existing = await this.eventRepo.findBySlug(cleanSlug);
    if (existing) {
      throw new AppError('Ya existe un evento con ese slug', 409, 'SLUG_CONFLICT');
    }

    let targetOrgId: string | null = null;
    if (actor.role === 'ORG_ADMIN') {
      if (!actor.organizationId) {
        throw new AppError('Usuario sin empresa asignada', 403, 'FORBIDDEN');
      }
      targetOrgId = actor.organizationId;
      const org = await this.orgRepo.findById(targetOrgId);
      OrganizationDomainService.ensureCanCreateEvent(org!);
    } else {
      targetOrgId = dto.organizationId || actor.organizationId || null;
      if (targetOrgId) {
        const org = await this.orgRepo.findById(targetOrgId);
        OrganizationDomainService.ensureCanCreateEvent(org!);
      }
    }

    const sections: EventSectionsConfig = {
      ...DEFAULT_SECTIONS_CONFIG,
      ...(dto.sectionsConfig || {}),
    };

    const created = await this.eventRepo.create({
      slug: cleanSlug,
      title: dto.title.trim(),
      partnerOneName: dto.partnerOneName.trim(),
      partnerTwoName: dto.partnerTwoName.trim(),
      eventDate: new Date(dto.eventDate),
      rsvpDeadline: dto.rsvpDeadline ? new Date(dto.rsvpDeadline) : null,
      ceremonyTitle: dto.ceremonyTitle,
      ceremonyTime: dto.ceremonyTime,
      ceremonyAddress: dto.ceremonyAddress,
      ceremonyMapUrl: dto.ceremonyMapUrl,
      receptionTitle: dto.receptionTitle,
      receptionTime: dto.receptionTime,
      receptionAddress: dto.receptionAddress,
      receptionMapUrl: dto.receptionMapUrl,
      theme: dto.theme || 'ROMANTIC_EDITORIAL',
      themeConfig: JSON.stringify(dto.themeConfig || {}),
      sectionsConfig: JSON.stringify(sections),
      contentConfig: JSON.stringify(dto.contentConfig || {}),
      driveFolderId: dto.driveFolderId || null,
      photosAlbumId: dto.photosAlbumId || null,
      mediaProvider: dto.mediaProvider || 'HYBRID',
      photoPin: dto.photoPin || null,
      isPrimary: actor.role === 'SUPERADMIN' ? Boolean(dto.isPrimary) : false,
      organizationId: targetOrgId,
      ownerId: actor.userId,
    });

    if (created.isPrimary) {
      await this.eventRepo.clearPrimaryExcept(created.id);
    }

    return created;
  }

  async update(eventId: string, actor: AuthActor, dto: UpdateEventDto): Promise<EventEntity> {
    const current = await ensureEventAccess(this.eventRepo, eventId, actor);

    if (actor.role === 'SUPERADMIN' && dto.isPrimary) {
      await this.eventRepo.clearPrimaryExcept(eventId);
    }

    let nextSlug = current.slug;
    if (dto.slug && dto.slug.trim() !== current.slug) {
      nextSlug = dto.slug
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-|-$/g, '');
      const conflict = await this.eventRepo.findBySlug(nextSlug);
      if (conflict && conflict.id !== current.id) {
        throw new AppError('El slug ya está en uso por otro evento', 409, 'SLUG_CONFLICT');
      }
    }

    const mergedSections: EventSectionsConfig | undefined = dto.sectionsConfig
      ? { ...current.sectionsConfig, ...dto.sectionsConfig }
      : undefined;

    const mergedThemeConfig: EventThemeConfig | undefined = dto.themeConfig
      ? { ...current.themeConfig, ...dto.themeConfig }
      : undefined;

    const mergedContent: EventContentConfig | undefined = dto.contentConfig
      ? { ...current.contentConfig, ...dto.contentConfig }
      : undefined;

    return this.eventRepo.update(eventId, {
      slug: nextSlug,
      title: dto.title?.trim(),
      partnerOneName: dto.partnerOneName?.trim(),
      partnerTwoName: dto.partnerTwoName?.trim(),
      eventDate: dto.eventDate ? new Date(dto.eventDate) : undefined,
      rsvpDeadline:
        dto.rsvpDeadline === null
          ? null
          : dto.rsvpDeadline
            ? new Date(dto.rsvpDeadline)
            : undefined,
      ceremonyTitle: dto.ceremonyTitle,
      ceremonyTime: dto.ceremonyTime,
      ceremonyAddress: dto.ceremonyAddress,
      ceremonyMapUrl: dto.ceremonyMapUrl,
      receptionTitle: dto.receptionTitle,
      receptionTime: dto.receptionTime,
      receptionAddress: dto.receptionAddress,
      receptionMapUrl: dto.receptionMapUrl,
      theme: dto.theme,
      themeConfig: mergedThemeConfig ? JSON.stringify(mergedThemeConfig) : undefined,
      sectionsConfig: mergedSections ? JSON.stringify(mergedSections) : undefined,
      contentConfig: mergedContent ? JSON.stringify(mergedContent) : undefined,
      driveFolderId: dto.driveFolderId,
      photosAlbumId: dto.photosAlbumId,
      mediaProvider: dto.mediaProvider,
      googleAccountEmail: dto.googleAccountEmail,
      googleRefreshToken: dto.googleRefreshToken,
      smtpHost: dto.smtpHost,
      smtpPort: dto.smtpPort,
      smtpSecure: dto.smtpSecure,
      smtpUser: dto.smtpUser,
      smtpPass: dto.smtpPass,
      smtpFromName: dto.smtpFromName,
      photoPin: dto.photoPin,
      isPrimary: actor.role === 'SUPERADMIN' ? dto.isPrimary : undefined,
      isActive: dto.isActive,
    });
  }

  async remove(eventId: string, actor: AuthActor): Promise<void> {
    ensureCanManageEventsOrCouples(actor);
    await ensureEventAccess(this.eventRepo, eventId, actor);
    await this.eventRepo.delete(eventId);
  }
}
