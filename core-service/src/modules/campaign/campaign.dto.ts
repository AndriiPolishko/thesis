

export interface CreateCampaignDto {
  name: string;
  goal: string;
  urls: string[];
}

export interface CreateCampaignEntity {
  name: string;
  goal: string;
  owner_id: number;
}

export enum CampaignCreationStatus {
  Success = 'success',
  Error = 'error'
}

export interface CampaignCreationResponse {
  status: CampaignCreationStatus;
  id?: number;
  errorText?: string;
}