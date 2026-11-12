export type EventTheme = 'ROMANTIC_EDITORIAL' | 'BOTANICAL_GARDEN' | 'CLASSIC_NOCTURNE';
export type MediaProviderType = 'GOOGLE_PHOTOS' | 'GOOGLE_DRIVE' | 'HYBRID';
export type RsvpStatus = 'PENDING' | 'VIEWED' | 'CONFIRMED' | 'PARTIAL' | 'DECLINED';

export interface EventSectionsConfig {
  heroMusic: boolean;
  countdown: boolean;
  storyGallery: boolean;
  itinerary: boolean;
  dressCode: boolean;
  giftRegistry: boolean;
  faq: boolean;
  wishesWall: boolean;
  photoWall: boolean;
}

export interface EventThemeConfig {
  accentColor?: string;
  musicUrl?: string;
  coverImageUrl?: string;
  coverSubtitle?: string;
  moderatePhotos?: boolean;
  moderateWishes?: boolean;
}

export interface StoryItem {
  year: string;
  title: string;
  description: string;
}

export interface BankAccountItem {
  bank: string;
  accountType: string;
  accountNumber: string;
  holder: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface EventContentConfig {
  homeBadgeText?: string;
  homeDescription?: string;
  homeInviteLabel?: string;
  homePhotosLabel?: string;
  heroBadgeText?: string;
  openEnvelopeLabel?: string;
  countdownTitle?: string;
  welcomeText?: string;
  storyEyebrow?: string;
  storyTitle?: string;
  storyItems?: StoryItem[];
  galleryUrls?: string[];
  itineraryEyebrow?: string;
  itineraryTitle?: string;
  dressCodeEyebrow?: string;
  dressCodeTitle?: string;
  dressCodeNote?: string;
  dressCodePalette?: string[];
  giftTitle?: string;
  giftDescription?: string;
  bankAccounts?: BankAccountItem[];
  rsvpEyebrow?: string;
  rsvpTitle?: string;
  rsvpButtonLabel?: string;
  photoAlbumEyebrow?: string;
  photoAlbumTitle?: string;
  photoAlbumSubtitle?: string;
  wishesTitle?: string;
  faqTitle?: string;
  faqItems?: FaqItem[];
}

export interface WeddingEvent {
  id: string;
  slug: string;
  title: string;
  partnerOneName: string;
  partnerTwoName: string;
  eventDate: string;
  rsvpDeadline: string | null;
  ceremonyTitle: string;
  ceremonyTime: string;
  ceremonyAddress: string;
  ceremonyMapUrl: string;
  receptionTitle: string;
  receptionTime: string;
  receptionAddress: string;
  receptionMapUrl: string;
  theme: EventTheme;
  themeConfig: EventThemeConfig;
  sectionsConfig: EventSectionsConfig;
  contentConfig: EventContentConfig;
  driveFolderId: string | null;
  photosAlbumId: string | null;
  mediaProvider: MediaProviderType;
  photoPin?: string | null;
  requiresPhotoPin?: boolean;
  isPrimary: boolean;
  isActive: boolean;
  organizationId: string | null;
  organizationName?: string | null;
}

export type OrganizationType = 'DIRECT' | 'PLANNER';

export interface OrganizationItem {
  id: string;
  name: string;
  slug: string;
  type: OrganizationType;
  contactEmail: string | null;
  maxEvents: number;
  isActive: boolean;
  eventsCount: number;
  admins: Array<{ id: string; name: string; email: string }>;
  createdAt: string;
}

export interface GuestMember {
  id: string;
  groupId: string;
  fullName: string;
  isPrimary: boolean;
  isCompanionSlot: boolean;
  attending: boolean | null;
  tableId: string | null;
  seatNumber: number | null;
  tableName?: string | null;
}

export type TableShape = 'ROUND' | 'RECTANGULAR' | 'HEAD';

export interface TableAssignedMember {
  id: string;
  groupId: string;
  groupName: string;
  category: string;
  fullName: string;
  seatNumber: number | null;
}

export interface EventTable {
  id: string;
  eventId: string;
  name: string;
  capacity: number;
  shape: TableShape;
  zone: string;
  sortOrder: number;
  members: TableAssignedMember[];
}

export interface SeatingSummary {
  totalConfirmed: number;
  totalAssigned: number;
  unassignedConfirmed: number;
  totalTableCapacity: number;
  daysUntilEvent: number;
  isSeatingWindowOpen: boolean;
}

export interface UnassignedConfirmedMember {
  id: string;
  groupId: string;
  groupName: string;
  category: string;
  fullName: string;
  isPrimary: boolean;
  isCompanionSlot: boolean;
}

export interface AdminUserInfo {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string | null;
  organizationName?: string | null;
  organizationQuota?: { maxEvents: number; eventsCount: number } | null;
  assignedEventId: string | null;
}

export interface GuestGroup {
  id: string;
  eventId: string;
  token: string;
  groupName: string;
  category: string;
  email: string | null;
  phone: string | null;
  maxGuests: number;
  rsvpStatus: RsvpStatus;
  guestMessage: string | null;
  viewedAt: string | null;
  respondedAt: string | null;
  members: GuestMember[];
}

export interface RsvpStats {
  totalGroups: number;
  totalAllocatedSlots: number;
  confirmedGuests: number;
  declinedGuests: number;
  pendingGuests: number;
  groupsConfirmed: number;
  groupsPartial: number;
  groupsDeclined: number;
  groupsViewed: number;
  groupsPending: number;
  responseRatePercent: number;
  byCategory: Array<{
    category: string;
    allocated: number;
    confirmed: number;
    declined: number;
    pending: number;
  }>;
  timeline: Array<{
    date: string;
    confirmed: number;
    declined: number;
  }>;
}

export interface WishMessage {
  id: string;
  eventId: string;
  authorName: string;
  message: string;
  isApproved: boolean;
  createdAt: string;
}

export interface MediaAsset {
  id: string;
  eventId: string;
  uploaderName: string;
  caption: string | null;
  originalName: string;
  mimeType: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'OTHER';
  sizeBytes: number;
  driveFileId: string | null;
  driveWebUrl: string | null;
  photosMediaItemId: string | null;
  storageMode: 'GOOGLE_PHOTOS' | 'GOOGLE_DRIVE' | 'LOCAL_FALLBACK';
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  createdAt: string;
}

export interface DispatchLog {
  id: string;
  groupId: string;
  groupName: string;
  channel: 'WHATSAPP' | 'EMAIL';
  recipient: string;
  subject: string | null;
  messageBody: string;
  status: 'QUEUED' | 'SENT' | 'FAILED';
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
}

export interface WhatsAppState {
  status: 'DISCONNECTED' | 'CONNECTING' | 'QR_READY' | 'CONNECTED';
  qrDataUrl: string | null;
  connectedPhone: string | null;
  lastError: string | null;
}
