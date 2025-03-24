export enum LeadStatus {
  Active = 'active',
  Inactive = 'inactive'
}

export interface Lead {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  status: LeadStatus;
  created_at: Date;
  updated_at: Date;
}