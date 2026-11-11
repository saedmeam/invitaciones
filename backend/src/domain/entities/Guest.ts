export type RsvpStatus = 'PENDING' | 'VIEWED' | 'CONFIRMED' | 'PARTIAL' | 'DECLINED';

export interface GuestMemberEntity {
  id: string;
  groupId: string;
  fullName: string;
  isPrimary: boolean;
  isCompanionSlot: boolean;
  attending: boolean | null;
  tableId: string | null;
  seatNumber: number | null;
  tableName?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GuestGroupEntity {
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
  viewedAt: Date | null;
  respondedAt: Date | null;
  members: GuestMemberEntity[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RsvpStatsDto {
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
