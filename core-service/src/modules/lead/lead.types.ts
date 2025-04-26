export enum LeadStatus {
  Active = 'active',
  Closed = 'closed'
}

export interface Lead {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  status: LeadStatus;
  user_id: number;
  created_at: Date;
  updated_at: Date;
}