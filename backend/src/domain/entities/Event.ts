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

export type ParticleEffectType =
  | 'AUTO'
  | 'ROSE_PETALS'
  | 'GOLD_SPARKLES'
  | 'BOTANICAL_LEAVES'
  | 'LAVENDER_PETALS'
  | 'CELESTIAL_SPARKLES'
  | 'NONE';

export interface EventThemeConfig {
  accentColor?: string;
  musicUrl?: string;
  spotifyPlaylistUrl?: string;
  coverImageUrl?: string;
  coverSubtitle?: string;
  moderatePhotos?: boolean;
  moderateWishes?: boolean;
  waxSealMonogram?: string;
  waxSealColor?: string;
  coverImageFit?: 'cover' | 'contain' | 'auto';
  particleEffect?: ParticleEffectType;
  backgroundClean?: boolean;
  backgroundImageUrl?: string;
  backgroundOpacity?: number;
  backgroundBlur?: number;
  backgroundFixed?: boolean;
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
}

export interface EventEntity {
  id: string;
  slug: string;
  title: string;
  partnerOneName: string;
  partnerTwoName: string;
  eventDate: Date;
  rsvpDeadline: Date | null;
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
  googleAccountEmail?: string | null;
  googleRefreshToken?: string | null;
  googleClientId?: string | null;
  googleClientSecret?: string | null;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpSecure?: boolean | null;
  smtpUser?: string | null;
  smtpPass?: string | null;
  smtpFromName?: string | null;
  photoPin: string | null;
  isPrimary: boolean;
  isActive: boolean;
  organizationId: string | null;
  organizationName?: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_SECTIONS_CONFIG: EventSectionsConfig = {
  heroMusic: true,
  countdown: true,
  storyGallery: true,
  itinerary: true,
  dressCode: true,
  giftRegistry: true,
  faq: true,
  wishesWall: true,
  photoWall: true,
};
