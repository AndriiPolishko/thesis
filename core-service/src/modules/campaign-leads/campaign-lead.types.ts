import { Lead, LeadStatus } from "../lead/lead.types";

export enum CampaignLeadStatus {
  New = 'new',
  Engaged = 'engaged',
  Booked = 'booked',
  Closed = 'closed'
}

export interface CampaignLead {
  id: number;
  campaign_id: number;
  lead_id: number;
  status: CampaignLeadStatus;
  created_at: Date;
  updated_at: Date;
}

export interface CampaignLeadJoinLead extends CampaignLead, Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'status'> {
  lead_status: LeadStatus;
  lead_created_at: Date;
  lead_updated_at: Date;
  campaign_goal: string;
  campaign_system_prompt: string;
}

export interface AddCampaignLeadsBody {
  campaignId: number;
  leadIds: number[];
}

export interface AddCampaignLeadsParams {
  userId: number;
  campaignId: number;
  leadIds: number[];
}