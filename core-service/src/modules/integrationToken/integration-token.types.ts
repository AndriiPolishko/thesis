export interface CreateIntegrationTokenEntity {
  userId: number;
  access_token: string;
  refreshToken: string;
  email: string;
  webhookExpiresAt: Date;
  expiresAt: Date;
  history_id: string;
}

export interface IntegrationToken {
  id: number;
  user_id: number;
  access_token: string;
  refresh_token: string;
  expires_at?: Date;
  email: string;
  webhook_expires_at?: Date;
  history_id: string;
  created_at: Date;
  updated_at: Date;
}