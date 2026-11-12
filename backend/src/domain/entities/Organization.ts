export type OrganizationType = 'DIRECT' | 'PLANNER';

export interface OrganizationAdminSummary {
  id: string;
  name: string;
  email: string;
}

export interface OrganizationEntity {
  id: string;
  name: string;
  slug: string;
  type: OrganizationType;
  contactEmail: string | null;
  maxEvents: number;
  isActive: boolean;
  eventsCount: number;
  admins: OrganizationAdminSummary[];
  createdAt: Date;
  updatedAt: Date;
}
