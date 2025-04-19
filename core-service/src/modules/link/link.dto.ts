export interface CreateLinkDto {
  url: string;
  campaignId: number;
}

export enum LinkCreationStatus {
  Success = 'success',
  Error = 'error',
}

export enum LinkStatus {
  Pending = 'pending',
  Failed = 'failed',
  Scrapped = 'scrapped',
  CantBeScrapped = 'cant_be_scrapped',
}

export interface LinkCreationResponse {
  id?: number;
  status: LinkCreationStatus;
  errorText?: string;
}