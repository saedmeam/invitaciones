import { EventEntity } from '../entities/Event';
import { GuestGroupEntity, GuestMemberEntity, RsvpStatus } from '../entities/Guest';
import {
  AdminUserEntity,
  DispatchChannel,
  DispatchStatus,
  MediaAssetEntity,
  MediaStatus,
  MessageDispatchEntity,
  WishMessageEntity,
} from '../entities/MediaAndDispatch';
import { EventTableEntity, TableShape } from '../entities/Table';
import { OrganizationEntity, OrganizationType } from '../entities/Organization';

export interface IOrganizationRepository {
  findAll(): Promise<OrganizationEntity[]>;
  findById(id: string): Promise<OrganizationEntity | null>;
  findBySlug(slug: string): Promise<OrganizationEntity | null>;
  create(data: {
    name: string;
    slug: string;
    type: OrganizationType;
    contactEmail?: string | null;
    maxEvents: number;
  }): Promise<OrganizationEntity>;
  update(
    id: string,
    data: Partial<{
      name: string;
      type: OrganizationType;
      contactEmail: string | null;
      maxEvents: number;
      isActive: boolean;
    }>
  ): Promise<OrganizationEntity>;
  delete(id: string): Promise<void>;
}

export interface IAdminUserRepository {
  findAll(): Promise<AdminUserEntity[]>;
  findByEmail(email: string): Promise<AdminUserEntity | null>;
  findById(id: string): Promise<AdminUserEntity | null>;
  findCoupleUsersByEvent(eventId: string, createdById?: string): Promise<AdminUserEntity[]>;
  upsertOrgAdminUser(data: {
    organizationId: string;
    email: string;
    name: string;
    passwordHash: string;
    createdById: string;
  }): Promise<AdminUserEntity>;
  deleteOrgAdminUser(userId: string, organizationId: string): Promise<void>;
  upsertCoupleUser(data: {
    eventId: string;
    organizationId: string | null;
    email: string;
    name: string;
    passwordHash: string;
    createdById: string;
  }): Promise<AdminUserEntity>;
  deleteCoupleUser(userId: string, eventId: string): Promise<void>;
}

export interface CreateEventInput {
  slug: string;
  title: string;
  partnerOneName: string;
  partnerTwoName: string;
  eventDate: Date;
  rsvpDeadline?: Date | null;
  ceremonyTitle?: string;
  ceremonyTime?: string;
  ceremonyAddress?: string;
  ceremonyMapUrl?: string;
  receptionTitle?: string;
  receptionTime?: string;
  receptionAddress?: string;
  receptionMapUrl?: string;
  theme?: string;
  themeConfig?: string;
  sectionsConfig?: string;
  contentConfig?: string;
  driveFolderId?: string | null;
  photosAlbumId?: string | null;
  mediaProvider?: string;
  photoPin?: string | null;
  isPrimary?: boolean;
  organizationId?: string | null;
  ownerId: string;
}

export interface UpdateEventInput extends Partial<Omit<CreateEventInput, 'ownerId'>> {
  isActive?: boolean;
}

export interface IEventRepository {
  findAll(organizationId?: string): Promise<EventEntity[]>;
  findAllByOrganization(organizationId: string): Promise<EventEntity[]>;
  findFeatured(): Promise<EventEntity | null>;
  findById(id: string): Promise<EventEntity | null>;
  findBySlug(slug: string): Promise<EventEntity | null>;
  create(data: CreateEventInput): Promise<EventEntity>;
  update(id: string, data: UpdateEventInput): Promise<EventEntity>;
  clearPrimaryExcept(eventId: string): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface CreateGuestGroupInput {
  eventId: string;
  token: string;
  groupName: string;
  category: string;
  email?: string | null;
  phone?: string | null;
  maxGuests: number;
  members: Array<{
    fullName: string;
    isPrimary: boolean;
    isCompanionSlot: boolean;
  }>;
}

export interface UpdateGuestGroupInput {
  groupName?: string;
  category?: string;
  email?: string | null;
  phone?: string | null;
  maxGuests?: number;
  rsvpStatus?: RsvpStatus;
  guestMessage?: string | null;
  members?: Array<{
    id?: string;
    fullName: string;
    isPrimary: boolean;
    isCompanionSlot: boolean;
    attending?: boolean | null;
    tableId?: string | null;
    seatNumber?: number | null;
  }>;
}

export interface SubmitGroupRsvpInput {
  groupId: string;
  rsvpStatus: RsvpStatus;
  guestMessage?: string | null;
  members: Array<{
    id: string;
    fullName: string;
    attending: boolean;
  }>;
}

export interface IGuestRepository {
  findByEvent(eventId: string): Promise<GuestGroupEntity[]>;
  findById(id: string): Promise<GuestGroupEntity | null>;
  findMemberById(memberId: string): Promise<(GuestMemberEntity & { eventId: string }) | null>;
  findByToken(token: string): Promise<{ group: GuestGroupEntity; event: EventEntity } | null>;
  create(data: CreateGuestGroupInput): Promise<GuestGroupEntity>;
  update(id: string, data: UpdateGuestGroupInput): Promise<GuestGroupEntity>;
  delete(id: string): Promise<void>;
  markViewed(id: string): Promise<GuestGroupEntity>;
  submitRsvp(data: SubmitGroupRsvpInput): Promise<GuestGroupEntity>;
}

export interface ITableRepository {
  findByEvent(eventId: string): Promise<EventTableEntity[]>;
  findById(tableId: string): Promise<EventTableEntity | null>;
  create(data: {
    eventId: string;
    name: string;
    capacity: number;
    shape: TableShape;
    zone: string;
    sortOrder: number;
  }): Promise<EventTableEntity>;
  update(
    tableId: string,
    data: Partial<{
      name: string;
      capacity: number;
      shape: TableShape;
      zone: string;
      sortOrder: number;
    }>
  ): Promise<EventTableEntity>;
  delete(tableId: string): Promise<void>;
  assignMember(memberId: string, tableId: string | null, seatNumber: number | null): Promise<void>;
}

export interface CreateDispatchInput {
  eventId: string;
  groupId: string;
  channel: DispatchChannel;
  recipient: string;
  subject?: string | null;
  messageBody: string;
  status: DispatchStatus;
  errorMessage?: string | null;
  sentAt?: Date | null;
}

export interface IDispatchRepository {
  create(data: CreateDispatchInput): Promise<MessageDispatchEntity>;
  updateStatus(
    id: string,
    status: DispatchStatus,
    errorMessage?: string | null,
    sentAt?: Date | null
  ): Promise<MessageDispatchEntity>;
  findByEvent(eventId: string): Promise<Array<MessageDispatchEntity & { groupName: string }>>;
}

export interface IWishRepository {
  findByEvent(eventId: string, onlyApproved?: boolean): Promise<WishMessageEntity[]>;
  create(data: {
    eventId: string;
    authorName: string;
    message: string;
    isApproved: boolean;
  }): Promise<WishMessageEntity>;
  updateApproval(id: string, isApproved: boolean): Promise<WishMessageEntity>;
  delete(id: string): Promise<void>;
}

export interface IMediaRepository {
  findByEvent(eventId: string, onlyApproved?: boolean): Promise<MediaAssetEntity[]>;
  findById(id: string): Promise<MediaAssetEntity | null>;
  create(data: Omit<MediaAssetEntity, 'id' | 'createdAt'>): Promise<MediaAssetEntity>;
  updateStatus(id: string, status: MediaStatus): Promise<MediaAssetEntity>;
  delete(id: string): Promise<void>;
}
