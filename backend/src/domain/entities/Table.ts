export type TableShape = 'ROUND' | 'RECTANGULAR' | 'HEAD';

export interface TableAssignedMember {
  id: string;
  groupId: string;
  groupName: string;
  category: string;
  fullName: string;
  seatNumber: number | null;
}

export interface EventTableEntity {
  id: string;
  eventId: string;
  name: string;
  capacity: number;
  shape: TableShape;
  zone: string;
  sortOrder: number;
  members: TableAssignedMember[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SeatingSummaryDto {
  totalConfirmed: number;
  totalAssigned: number;
  unassignedConfirmed: number;
  totalTableCapacity: number;
  daysUntilEvent: number;
  isSeatingWindowOpen: boolean;
}
