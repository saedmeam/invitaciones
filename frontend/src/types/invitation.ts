export type EventTheme =
  | 'ROMANTIC_EDITORIAL'
  | 'MINIMAL_LUXURY'
  | 'BOTANICAL_GARDEN'
  | 'GOLDEN_GLAMOUR'
  | 'RUSTIC_CHIC'
  | 'NOCTURNE_ROYAL'
  | 'CLASSIC_NOCTURNE'
  | 'BURGUNDY_VELVET'
  | 'EMERALD_IMPERIAL'
  | 'LAVENDER_PROVENCE'
  | 'SAPPHIRE_SERENITY'
  | 'TERRACOTTA_SUNSET';
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
  spotifyPlaylist?: boolean;
}

export type ParticleEffectType =
  | 'AUTO'
  | 'ROSE_PETALS'
  | 'GOLD_SPARKLES'
  | 'BOTANICAL_LEAVES'
  | 'LAVENDER_PETALS'
  | 'CELESTIAL_SPARKLES'
  | 'NONE';

export type EventPlanTier = 'CLASSIC' | 'PREMIUM';

export type EnvelopeStyleType =
  | 'IVORY_GOLD_DECKLE'
  | 'MIDNIGHT_CELESTIAL'
  | 'EMERALD_BOTANIC'
  | 'BURGUNDY_ROYAL'
  | 'ONYX_MINIMAL_GOLD'
  | 'BLUSH_ROSE_GOLD';

export type EnvelopeFlapType = 'EURO_TRIANGLE' | 'BARONIAL_ROUND' | 'DIAMOND_PEAK';

export interface EventThemeConfig {
  planTier?: EventPlanTier;
  accentColor?: string;
  musicUrl?: string;
  spotifyPlaylistUrl?: string;
  coverImageUrl?: string;
  coverSubtitle?: string;
  moderatePhotos?: boolean;
  moderateWishes?: boolean;
  waxSealMonogram?: string;
  waxSealColor?: string;
  envelopeStyle?: EnvelopeStyleType;
  envelopeFlap?: EnvelopeFlapType;
  coverImageFit?: 'cover' | 'contain' | 'auto';
  particleEffect?: ParticleEffectType;
  backgroundClean?: boolean;
  backgroundImageUrl?: string;
  backgroundOpacity?: number;
  backgroundBlur?: number;
  backgroundFixed?: boolean;
  showDressCodePalette?: boolean;
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
  dressCodeShowPalette?: boolean;
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
  spotifyPlaylistTitle?: string;
  spotifyPlaylistEyebrow?: string;
  spotifyPlaylistSubtitle?: string;
  spotifyPlaylistUrl?: string;
  spotifySuggestSongUrl?: string;
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
  driveFolderUrl?: string | null;
  photosAlbumId: string | null;
  photosAlbumUrl?: string | null;
  mediaProvider: MediaProviderType;
  googleClientId?: string | null;
  googleClientSecret?: string | null;
  googleAccountEmail?: string | null;
  googleRefreshToken?: string | null;
  photoPin?: string | null;
  requiresPhotoPin?: boolean;
  isPrimary: boolean;
  isActive: boolean;
  organizationId: string | null;
  organizationName?: string | null;
  organizationType?: OrganizationType | null;
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
  mustChangePassword?: boolean;
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
