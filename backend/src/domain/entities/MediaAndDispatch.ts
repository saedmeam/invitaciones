export type DispatchChannel = 'WHATSAPP' | 'EMAIL';
export type DispatchStatus = 'QUEUED' | 'SENT' | 'FAILED';

export interface MessageDispatchEntity {
  id: string;
  eventId: string;
  groupId: string;
  channel: DispatchChannel;
  recipient: string;
  subject: string | null;
  messageBody: string;
  status: DispatchStatus;
  errorMessage: string | null;
  sentAt: Date | null;
  createdAt: Date;
}

export interface WishMessageEntity {
  id: string;
  eventId: string;
  authorName: string;
  message: string;
  isApproved: boolean;
  createdAt: Date;
}

export type MediaType = 'IMAGE' | 'VIDEO' | 'OTHER';
export type StorageMode = 'GOOGLE_PHOTOS' | 'GOOGLE_DRIVE' | 'LOCAL_FALLBACK';
export type MediaStatus = 'APPROVED' | 'PENDING' | 'REJECTED';

export interface MediaAssetEntity {
  id: string;
  eventId: string;
  uploaderName: string;
  caption: string | null;
  originalName: string;
  mimeType: string;
  mediaType: MediaType;
  sizeBytes: number;
  driveFileId: string | null;
  driveWebUrl: string | null;
  photosMediaItemId: string | null;
  localFallbackPath: string | null;
  storageMode: StorageMode;
  status: MediaStatus;
  createdAt: Date;
}

export interface AdminUserEntity {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: string;
  assignedEventId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
