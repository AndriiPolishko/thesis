export interface CreateLinkDto {
  url: string;
  campaignId: number;
}

export enum LinkCreationStatus {
  Success = 'success',
  Error = 'error',
}

export interface LinkCreationResponse {
  id?: number;
  status: LinkCreationStatus;
  errorText?: string;
}