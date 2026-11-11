export type EventTheme = 'ROMANTIC_EDITORIAL' | 'BOTANICAL_GARDEN' | 'CLASSIC_NOCTURNE';
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
  photosAlbumId: string | null;
  mediaProvider: MediaProviderType;
  photoPin: string | null;
  isPrimary: boolean;
  isActive: boolean;
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
