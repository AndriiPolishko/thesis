import { Inject, Injectable } from "@nestjs/common";

import { DatabaseService } from "../database/database.service";
import { CreateIntegrationTokenEntity, IntegrationToken } from "./integration-token.types";



@Injectable()
export class IntegrationTokenRepository {
  constructor(
    @Inject(DatabaseService)private readonly databaseService: DatabaseService
  ) {}

  async createOne(createIntegrationTokenEntity: CreateIntegrationTokenEntity) {
    const { userId, access_token, refreshToken, expiresAt, email, webhookExpiresAt, history_id } = createIntegrationTokenEntity;
    const query = `
      INSERT INTO integration_token (user_id, access_token, refresh_token, expires_at, email, webhook_expires_at, history_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`;

    const result = await this.databaseService.runQuery(query, [userId, access_token, refreshToken, expiresAt, email, webhookExpiresAt, history_id]);
    const integrationToken = result.rows[0];

    return integrationToken; 
  }

  async findByUserId(userId: number | string): Promise<IntegrationToken | null> {
    const query = `
      SELECT * FROM integration_token WHERE user_id = $1`;

    const result = await this.databaseService.runQuery(query, [userId]);
    const integrationToken = result.rows[0];

    return integrationToken;
  }

  async updateToken(userId: number | string, access_token: string, refresh_token: string, expires_at): Promise<IntegrationToken> {
    const query = `
      UPDATE integration_token SET access_token = $2, refresh_token = $3, expires_at = $4 WHERE user_id = $1 RETURNING *`;

    const result = await this.databaseService.runQuery(query, [userId, access_token, refresh_token, expires_at]);
    const integrationToken = result.rows[0];

    return integrationToken
  }

  async findByEmail(email: string): Promise<IntegrationToken> {
    const query = `
      SELECT * FROM integration_token WHERE email = $1`;

    const result = await this.databaseService.runQuery(query, [email]);
    const integrationToken = result.rows[0];

    return integrationToken;
  }

  async updateAccessTokenAndExpiration(integrationTokenId: number, accessToken: string, expiresAt: Date): Promise<IntegrationToken> {
    const query = `
      UPDATE integration_token SET access_token = $2, expires_at = $3 WHERE id = $1 RETURNING *`;

    const result = await this.databaseService.runQuery(query, [integrationTokenId, accessToken, expiresAt]);
    const updatedIntegrationToken = result.rows[0];

    return updatedIntegrationToken;
  }

  async updateHistoryId(integrationTokenId: number, historyId: string): Promise<IntegrationToken> {
    const query = `
      UPDATE integration_token SET history_id = $2 WHERE id = $1 RETURNING *`;

    const result = await this.databaseService.runQuery(query, [integrationTokenId, historyId]);
    const updatedIntegrationToken = result.rows[0];

    return updatedIntegrationToken;
  }
}