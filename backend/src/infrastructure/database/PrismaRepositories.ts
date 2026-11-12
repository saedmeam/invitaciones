import { PrismaClient } from '@prisma/client';
import {
  DEFAULT_SECTIONS_CONFIG,
  EventContentConfig,
  EventEntity,
  EventSectionsConfig,
  EventTheme,
  EventThemeConfig,
  MediaProviderType,
} from '../../domain/entities/Event';
import { GuestGroupEntity, GuestMemberEntity, RsvpStatus } from '../../domain/entities/Guest';
import {
  AdminUserEntity,
  DispatchChannel,
  DispatchStatus,
  MediaAssetEntity,
  MediaStatus,
  MediaType,
  MessageDispatchEntity,
  StorageMode,
  WishMessageEntity,
} from '../../domain/entities/MediaAndDispatch';
import { EventTableEntity, TableShape } from '../../domain/entities/Table';
import { OrganizationEntity, OrganizationType } from '../../domain/entities/Organization';
import {
  CreateDispatchInput,
  CreateEventInput,
  CreateGuestGroupInput,
  IAdminUserRepository,
  IDispatchRepository,
  IEventRepository,
  IGuestRepository,
  IMediaRepository,
  IOrganizationRepository,
  ITableRepository,
  IWishRepository,
  SubmitGroupRsvpInput,
  UpdateEventInput,
  UpdateGuestGroupInput,
} from '../../domain/ports/Repositories';

function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    return { ...fallback, ...(JSON.parse(raw) as Partial<T>) };
  } catch {
    return fallback;
  }
}

function mapEvent(row: any): EventEntity {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    partnerOneName: row.partnerOneName,
    partnerTwoName: row.partnerTwoName,
    eventDate: row.eventDate,
    rsvpDeadline: row.rsvpDeadline,
    ceremonyTitle: row.ceremonyTitle,
    ceremonyTime: row.ceremonyTime,
    ceremonyAddress: row.ceremonyAddress,
    ceremonyMapUrl: row.ceremonyMapUrl,
    receptionTitle: row.receptionTitle,
    receptionTime: row.receptionTime,
    receptionAddress: row.receptionAddress,
    receptionMapUrl: row.receptionMapUrl,
    theme: row.theme as EventTheme,
    themeConfig: safeJsonParse<EventThemeConfig>(row.themeConfig, {}),
    sectionsConfig: safeJsonParse<EventSectionsConfig>(row.sectionsConfig, DEFAULT_SECTIONS_CONFIG),
    contentConfig: safeJsonParse<EventContentConfig>(row.contentConfig, {}),
    driveFolderId: row.driveFolderId,
    photosAlbumId: row.photosAlbumId ?? null,
    mediaProvider: (row.mediaProvider || 'HYBRID') as MediaProviderType,
    googleAccountEmail: row.googleAccountEmail ?? null,
    googleRefreshToken: row.googleRefreshToken ?? null,
    smtpHost: row.smtpHost ?? null,
    smtpPort: row.smtpPort ?? null,
    smtpSecure: row.smtpSecure !== undefined ? Boolean(row.smtpSecure) : true,
    smtpUser: row.smtpUser ?? null,
    smtpPass: row.smtpPass ?? null,
    smtpFromName: row.smtpFromName ?? null,
    photoPin: row.photoPin,
    isPrimary: Boolean(row.isPrimary),
    isActive: row.isActive,
    organizationId: row.organizationId ?? null,
    organizationName: row.organization?.name ?? null,
    ownerId: row.ownerId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapGuestMember(m: any): GuestMemberEntity {
  return {
    id: m.id,
    groupId: m.groupId,
    fullName: m.fullName,
    isPrimary: m.isPrimary,
    isCompanionSlot: m.isCompanionSlot,
    attending: m.attending,
    tableId: m.tableId ?? null,
    seatNumber: m.seatNumber ?? null,
    tableName: m.table?.name ?? null,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
}

function mapGuestGroup(row: any): GuestGroupEntity {
  return {
    id: row.id,
    eventId: row.eventId,
    token: row.token,
    groupName: row.groupName,
    category: row.category,
    email: row.email,
    phone: row.phone,
    maxGuests: row.maxGuests,
    rsvpStatus: row.rsvpStatus as RsvpStatus,
    guestMessage: row.guestMessage,
    viewedAt: row.viewedAt,
    respondedAt: row.respondedAt,
    members: (row.members || []).map(mapGuestMember),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapTable(row: any): EventTableEntity {
  const members = (row.members || [])
    .map((m: any) => ({
      id: m.id,
      groupId: m.groupId,
      groupName: m.group?.groupName || '',
      category: m.group?.category || 'General',
      fullName: m.fullName,
      seatNumber: m.seatNumber ?? null,
    }))
    .sort((a: any, b: any) => {
      if (a.seatNumber !== null && b.seatNumber !== null) return a.seatNumber - b.seatNumber;
      if (a.seatNumber !== null) return -1;
      if (b.seatNumber !== null) return 1;
      return a.fullName.localeCompare(b.fullName);
    });

  return {
    id: row.id,
    eventId: row.eventId,
    name: row.name,
    capacity: row.capacity,
    shape: row.shape as TableShape,
    zone: row.zone,
    sortOrder: row.sortOrder,
    members,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapOrganization(row: any): OrganizationEntity {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    type: row.type as OrganizationType,
    contactEmail: row.contactEmail ?? null,
    maxEvents: row.maxEvents,
    isActive: row.isActive,
    eventsCount: row._count?.events ?? row.events?.length ?? 0,
    admins: (row.users || [])
      .filter((u: any) => u.role === 'ORG_ADMIN')
      .map((u: any) => ({ id: u.id, name: u.name, email: u.email })),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const orgInclude = {
  _count: { select: { events: true } },
  users: { select: { id: true, name: true, email: true, role: true } },
};

export class PrismaOrganizationRepository implements IOrganizationRepository {
  constructor(private readonly db: PrismaClient) {}

  async findAll(): Promise<OrganizationEntity[]> {
    const rows = await this.db.organization.findMany({
      include: orgInclude,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapOrganization);
  }

  async findById(id: string): Promise<OrganizationEntity | null> {
    const row = await this.db.organization.findUnique({
      where: { id },
      include: orgInclude,
    });
    return row ? mapOrganization(row) : null;
  }

  async findBySlug(slug: string): Promise<OrganizationEntity | null> {
    const row = await this.db.organization.findUnique({
      where: { slug },
      include: orgInclude,
    });
    return row ? mapOrganization(row) : null;
  }

  async create(data: {
    name: string;
    slug: string;
    type: OrganizationType;
    contactEmail?: string | null;
    maxEvents: number;
  }): Promise<OrganizationEntity> {
    const row = await this.db.organization.create({
      data,
      include: orgInclude,
    });
    return mapOrganization(row);
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      type: OrganizationType;
      contactEmail: string | null;
      maxEvents: number;
      isActive: boolean;
    }>
  ): Promise<OrganizationEntity> {
    const row = await this.db.organization.update({
      where: { id },
      data,
      include: orgInclude,
    });
    return mapOrganization(row);
  }

  async delete(id: string): Promise<void> {
    await this.db.organization.delete({ where: { id } });
  }
}

export class PrismaAdminUserRepository implements IAdminUserRepository {
  constructor(private readonly db: PrismaClient) {}

  private mapUser(row: any): AdminUserEntity {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      name: row.name,
      role: row.role,
      mustChangePassword: Boolean(row.mustChangePassword),
      organizationId: row.organizationId ?? null,
      organizationName: row.organization?.name ?? null,
      organizationType: row.organization?.type ?? null,
      organizationMaxEvents: row.organization?.maxEvents ?? null,
      assignedEventId: row.assignedEventId ?? null,
      assignedEventSlug: row.assignedEvent?.slug ?? null,
      assignedEventTitle: row.assignedEvent
        ? `${row.assignedEvent.partnerOneName} & ${row.assignedEvent.partnerTwoName}`
        : null,
      createdById: row.createdById ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private readonly userInclude = {
    organization: { select: { name: true, type: true, maxEvents: true } },
    assignedEvent: { select: { slug: true, partnerOneName: true, partnerTwoName: true } },
  };

  async findAll(): Promise<AdminUserEntity[]> {
    const rows = await this.db.adminUser.findMany({
      include: this.userInclude,
      orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
    });
    return rows.map((r) => this.mapUser(r));
  }

  async findByEmail(email: string): Promise<AdminUserEntity | null> {
    const row = await this.db.adminUser.findUnique({
      where: { email },
      include: this.userInclude,
    });
    return row ? this.mapUser(row) : null;
  }

  async findById(id: string): Promise<AdminUserEntity | null> {
    const row = await this.db.adminUser.findUnique({
      where: { id },
      include: this.userInclude,
    });
    return row ? this.mapUser(row) : null;
  }

  async findCoupleUsersByEvent(eventId: string, createdById?: string): Promise<AdminUserEntity[]> {
    const rows = await this.db.adminUser.findMany({
      where: {
        assignedEventId: eventId,
        role: 'COUPLE',
        ...(createdById ? { createdById } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.mapUser(r));
  }

  async upsertOrgAdminUser(data: {
    organizationId: string;
    email: string;
    name: string;
    passwordHash: string;
    createdById: string;
  }): Promise<AdminUserEntity> {
    const row = await this.db.adminUser.upsert({
      where: { email: data.email },
      update: {
        name: data.name,
        passwordHash: data.passwordHash,
        role: 'ORG_ADMIN',
        organizationId: data.organizationId,
        assignedEventId: null,
      },
      create: {
        email: data.email,
        name: data.name,
        passwordHash: data.passwordHash,
        role: 'ORG_ADMIN',
        organizationId: data.organizationId,
        createdById: data.createdById,
      },
    });
    return this.mapUser(row);
  }

  async deleteOrgAdminUser(userId: string, organizationId: string): Promise<void> {
    await this.db.adminUser.deleteMany({
      where: { id: userId, organizationId, role: 'ORG_ADMIN' },
    });
  }

  async upsertCoupleUser(data: {
    eventId: string;
    organizationId: string | null;
    email: string;
    name: string;
    passwordHash: string;
    createdById: string;
  }): Promise<AdminUserEntity> {
    const row = await this.db.adminUser.upsert({
      where: { email: data.email },
      update: {
        name: data.name,
        passwordHash: data.passwordHash,
        role: 'COUPLE',
        organizationId: data.organizationId,
        assignedEventId: data.eventId,
      },
      create: {
        email: data.email,
        name: data.name,
        passwordHash: data.passwordHash,
        role: 'COUPLE',
        organizationId: data.organizationId,
        assignedEventId: data.eventId,
        createdById: data.createdById,
      },
    });
    return this.mapUser(row);
  }

  async deleteCoupleUser(userId: string, eventId: string): Promise<void> {
    await this.db.adminUser.deleteMany({
      where: { id: userId, assignedEventId: eventId, role: 'COUPLE' },
    });
  }

  async updateUser(
    id: string,
    data: {
      name?: string;
      email?: string;
      passwordHash?: string;
      mustChangePassword?: boolean;
      organizationId?: string | null;
      assignedEventId?: string | null;
    }
  ): Promise<AdminUserEntity> {
    const row = await this.db.adminUser.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.passwordHash !== undefined ? { passwordHash: data.passwordHash } : {}),
        ...(data.mustChangePassword !== undefined ? { mustChangePassword: data.mustChangePassword } : {}),
        ...(data.organizationId !== undefined ? { organizationId: data.organizationId } : {}),
        ...(data.assignedEventId !== undefined ? { assignedEventId: data.assignedEventId } : {}),
      },
      include: this.userInclude,
    });
    return this.mapUser(row);
  }

  async createUser(data: {
    email: string;
    name: string;
    passwordHash: string;
    role: string;
    mustChangePassword?: boolean;
    organizationId: string | null;
    assignedEventId: string | null;
    createdById: string;
  }): Promise<AdminUserEntity> {
    const row = await this.db.adminUser.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash: data.passwordHash,
        role: data.role,
        mustChangePassword: data.mustChangePassword ?? false,
        organizationId: data.organizationId,
        assignedEventId: data.assignedEventId,
        createdById: data.createdById,
      },
      include: this.userInclude,
    });
    return this.mapUser(row);
  }

  async deleteUser(id: string): Promise<void> {
    await this.db.adminUser.delete({ where: { id } });
  }
}

export class PrismaEventRepository implements IEventRepository {
  constructor(private readonly db: PrismaClient) {}

  private readonly eventInclude = {
    organization: { select: { name: true } },
  };

  async findAll(organizationId?: string): Promise<EventEntity[]> {
    const rows = await this.db.event.findMany({
      where: organizationId ? { organizationId } : undefined,
      include: this.eventInclude,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapEvent);
  }

  async findAllByOrganization(organizationId: string): Promise<EventEntity[]> {
    const rows = await this.db.event.findMany({
      where: { organizationId },
      include: this.eventInclude,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapEvent);
  }

  async findFeatured(): Promise<EventEntity | null> {
    const primary = await this.db.event.findFirst({
      where: { isActive: true, isPrimary: true },
      include: this.eventInclude,
      orderBy: { createdAt: 'desc' },
    });
    if (primary) return mapEvent(primary);
    const fallback = await this.db.event.findFirst({
      where: { isActive: true },
      include: this.eventInclude,
      orderBy: { createdAt: 'desc' },
    });
    return fallback ? mapEvent(fallback) : null;
  }

  async clearPrimaryExcept(eventId: string): Promise<void> {
    await this.db.event.updateMany({
      where: { id: { not: eventId } },
      data: { isPrimary: false },
    });
  }

  async findById(id: string): Promise<EventEntity | null> {
    const row = await this.db.event.findUnique({
      where: { id },
      include: this.eventInclude,
    });
    return row ? mapEvent(row) : null;
  }

  async findBySlug(slug: string): Promise<EventEntity | null> {
    const row = await this.db.event.findUnique({
      where: { slug },
      include: this.eventInclude,
    });
    return row ? mapEvent(row) : null;
  }

  async create(data: CreateEventInput): Promise<EventEntity> {
    const row = await this.db.event.create({
      data,
      include: this.eventInclude,
    });
    return mapEvent(row);
  }

  async update(id: string, data: UpdateEventInput): Promise<EventEntity> {
    const row = await this.db.event.update({
      where: { id },
      data,
      include: this.eventInclude,
    });
    return mapEvent(row);
  }

  async delete(id: string): Promise<void> {
    await this.db.event.delete({ where: { id } });
  }
}

const memberInclude = {
  include: { table: { select: { name: true } } },
  orderBy: [{ isPrimary: 'desc' as const }, { createdAt: 'asc' as const }],
};

export class PrismaGuestRepository implements IGuestRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByEvent(eventId: string): Promise<GuestGroupEntity[]> {
    const rows = await this.db.guestGroup.findMany({
      where: { eventId },
      include: { members: memberInclude },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapGuestGroup);
  }

  async findById(id: string): Promise<GuestGroupEntity | null> {
    const row = await this.db.guestGroup.findUnique({
      where: { id },
      include: { members: memberInclude },
    });
    return row ? mapGuestGroup(row) : null;
  }

  async findMemberById(memberId: string): Promise<(GuestMemberEntity & { eventId: string }) | null> {
    const row = await this.db.guestMember.findUnique({
      where: { id: memberId },
      include: {
        table: { select: { name: true } },
        group: { select: { eventId: true } },
      },
    });
    if (!row) return null;
    return {
      ...mapGuestMember(row),
      eventId: row.group.eventId,
    };
  }

  async findByToken(token: string): Promise<{ group: GuestGroupEntity; event: EventEntity } | null> {
    const row = await this.db.guestGroup.findUnique({
      where: { token },
      include: {
        members: memberInclude,
        event: true,
      },
    });
    if (!row) return null;
    return {
      group: mapGuestGroup(row),
      event: mapEvent(row.event),
    };
  }

  async create(data: CreateGuestGroupInput): Promise<GuestGroupEntity> {
    const row = await this.db.guestGroup.create({
      data: {
        eventId: data.eventId,
        token: data.token,
        groupName: data.groupName,
        category: data.category,
        email: data.email || null,
        phone: data.phone || null,
        maxGuests: data.maxGuests,
        members: {
          create: data.members,
        },
      },
      include: { members: memberInclude },
    });
    return mapGuestGroup(row);
  }

  async update(id: string, data: UpdateGuestGroupInput): Promise<GuestGroupEntity> {
    const row = await this.db.$transaction(async (tx) => {
      if (data.members) {
        const keepIds = data.members.map((m) => m.id).filter((x): x is string => Boolean(x));
        await tx.guestMember.deleteMany({
          where: {
            groupId: id,
            ...(keepIds.length > 0 ? { id: { notIn: keepIds } } : {}),
          },
        });

        for (const m of data.members) {
          if (m.id) {
            await tx.guestMember.update({
              where: { id: m.id },
              data: {
                fullName: m.fullName,
                isPrimary: m.isPrimary,
                isCompanionSlot: m.isCompanionSlot,
                attending: m.attending ?? null,
                ...(m.attending !== true ? { tableId: null, seatNumber: null } : {}),
              },
            });
          } else {
            await tx.guestMember.create({
              data: {
                groupId: id,
                fullName: m.fullName,
                isPrimary: m.isPrimary,
                isCompanionSlot: m.isCompanionSlot,
                attending: m.attending ?? null,
                tableId: m.tableId ?? null,
                seatNumber: m.seatNumber ?? null,
              },
            });
          }
        }
      }

      return tx.guestGroup.update({
        where: { id },
        data: {
          groupName: data.groupName,
          category: data.category,
          email: data.email,
          phone: data.phone,
          maxGuests: data.maxGuests,
          rsvpStatus: data.rsvpStatus,
          guestMessage: data.guestMessage,
        },
        include: { members: memberInclude },
      });
    });
    return mapGuestGroup(row);
  }

  async delete(id: string): Promise<void> {
    await this.db.guestGroup.delete({ where: { id } });
  }

  async markViewed(id: string): Promise<GuestGroupEntity> {
    const row = await this.db.guestGroup.update({
      where: { id },
      data: { rsvpStatus: 'VIEWED', viewedAt: new Date() },
      include: { members: memberInclude },
    });
    return mapGuestGroup(row);
  }

  async submitRsvp(data: SubmitGroupRsvpInput): Promise<GuestGroupEntity> {
    const row = await this.db.$transaction(async (tx) => {
      for (const member of data.members) {
        await tx.guestMember.update({
          where: { id: member.id },
          data: {
            fullName: member.fullName,
            attending: member.attending,
            ...(!member.attending ? { tableId: null, seatNumber: null } : {}),
          },
        });
      }

      return tx.guestGroup.update({
        where: { id: data.groupId },
        data: {
          rsvpStatus: data.rsvpStatus,
          guestMessage: data.guestMessage,
          respondedAt: new Date(),
        },
        include: { members: memberInclude },
      });
    });
    return mapGuestGroup(row);
  }
}

export class PrismaTableRepository implements ITableRepository {
  constructor(private readonly db: PrismaClient) {}

  private readonly tableInclude = {
    members: {
      include: { group: { select: { groupName: true, category: true } } },
    },
  };

  async findByEvent(eventId: string): Promise<EventTableEntity[]> {
    const rows = await this.db.eventTable.findMany({
      where: { eventId },
      include: this.tableInclude,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map(mapTable);
  }

  async findById(tableId: string): Promise<EventTableEntity | null> {
    const row = await this.db.eventTable.findUnique({
      where: { id: tableId },
      include: this.tableInclude,
    });
    return row ? mapTable(row) : null;
  }

  async create(data: {
    eventId: string;
    name: string;
    capacity: number;
    shape: TableShape;
    zone: string;
    sortOrder: number;
  }): Promise<EventTableEntity> {
    const row = await this.db.eventTable.create({
      data,
      include: this.tableInclude,
    });
    return mapTable(row);
  }

  async update(
    tableId: string,
    data: Partial<{
      name: string;
      capacity: number;
      shape: TableShape;
      zone: string;
      sortOrder: number;
    }>
  ): Promise<EventTableEntity> {
    const row = await this.db.eventTable.update({
      where: { id: tableId },
      data,
      include: this.tableInclude,
    });
    return mapTable(row);
  }

  async delete(tableId: string): Promise<void> {
    await this.db.$transaction(async (tx) => {
      await tx.guestMember.updateMany({
        where: { tableId },
        data: { tableId: null, seatNumber: null },
      });
      await tx.eventTable.delete({ where: { id: tableId } });
    });
  }

  async assignMember(
    memberId: string,
    tableId: string | null,
    seatNumber: number | null
  ): Promise<void> {
    await this.db.guestMember.update({
      where: { id: memberId },
      data: { tableId, seatNumber },
    });
  }
}

export class PrismaDispatchRepository implements IDispatchRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: CreateDispatchInput): Promise<MessageDispatchEntity> {
    const row = await this.db.messageDispatch.create({ data });
    return {
      ...row,
      channel: row.channel as DispatchChannel,
      status: row.status as DispatchStatus,
    };
  }

  async updateStatus(
    id: string,
    status: DispatchStatus,
    errorMessage?: string | null,
    sentAt?: Date | null
  ): Promise<MessageDispatchEntity> {
    const row = await this.db.messageDispatch.update({
      where: { id },
      data: {
        status,
        errorMessage: errorMessage ?? null,
        sentAt: sentAt ?? null,
      },
    });
    return {
      ...row,
      channel: row.channel as DispatchChannel,
      status: row.status as DispatchStatus,
    };
  }

  async findByEvent(eventId: string) {
    const rows = await this.db.messageDispatch.findMany({
      where: { eventId },
      include: { group: { select: { groupName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return rows.map((r) => ({
      id: r.id,
      eventId: r.eventId,
      groupId: r.groupId,
      groupName: r.group.groupName,
      channel: r.channel as DispatchChannel,
      recipient: r.recipient,
      subject: r.subject,
      messageBody: r.messageBody,
      status: r.status as DispatchStatus,
      errorMessage: r.errorMessage,
      sentAt: r.sentAt,
      createdAt: r.createdAt,
    }));
  }
}

export class PrismaWishRepository implements IWishRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByEvent(eventId: string, onlyApproved = false): Promise<WishMessageEntity[]> {
    return this.db.wishMessage.findMany({
      where: { eventId, ...(onlyApproved ? { isApproved: true } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: {
    eventId: string;
    authorName: string;
    message: string;
    isApproved: boolean;
  }): Promise<WishMessageEntity> {
    return this.db.wishMessage.create({ data });
  }

  async updateApproval(id: string, isApproved: boolean): Promise<WishMessageEntity> {
    return this.db.wishMessage.update({ where: { id }, data: { isApproved } });
  }

  async delete(id: string): Promise<void> {
    await this.db.wishMessage.delete({ where: { id } });
  }
}

export class PrismaMediaRepository implements IMediaRepository {
  constructor(private readonly db: PrismaClient) {}

  private map(row: any): MediaAssetEntity {
    return {
      ...row,
      mediaType: row.mediaType as MediaType,
      storageMode: row.storageMode as StorageMode,
      status: row.status as MediaStatus,
    };
  }

  async findByEvent(eventId: string, onlyApproved = false): Promise<MediaAssetEntity[]> {
    const rows = await this.db.mediaAsset.findMany({
      where: { eventId, ...(onlyApproved ? { status: 'APPROVED' } : {}) },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.map(r));
  }

  async findById(id: string): Promise<MediaAssetEntity | null> {
    const row = await this.db.mediaAsset.findUnique({ where: { id } });
    return row ? this.map(row) : null;
  }

  async create(data: Omit<MediaAssetEntity, 'id' | 'createdAt'>): Promise<MediaAssetEntity> {
    const row = await this.db.mediaAsset.create({ data });
    return this.map(row);
  }

  async updateStatus(id: string, status: MediaStatus): Promise<MediaAssetEntity> {
    const row = await this.db.mediaAsset.update({ where: { id }, data: { status } });
    return this.map(row);
  }

  async delete(id: string): Promise<void> {
    await this.db.mediaAsset.delete({ where: { id } });
  }
}
