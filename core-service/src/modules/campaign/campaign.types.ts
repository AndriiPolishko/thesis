export enum CampaignStatus {
  Pending = 'pending',
  Active = 'active',
  Inactive = 'inactive'
}

export interface Campaign {
  id: number;
  name: string;
  goal: string;
  user_id: number;
  status: CampaignStatus;
  campaign_system_prompt: string;
  created_at?: Date;
  updated_at?: Date;
}