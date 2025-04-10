export enum CampaignStatus {
  Pending = 'pending',
  Active = 'active',
  Inactive = 'inactive'
}

export interface Campaign {
  id: number;
  name: string;
  goal: string;
  owner_id: number;
  status: CampaignStatus;
  created_at?: Date;
  updated_at?: Date;
}