import { Inject, Injectable } from "@nestjs/common";

import { DatabaseService } from "../database/database.service";

interface CreateIntegrationTokenEntity {
  userId: number;
  integrationToken: string;
  refreshToken: string;
  expiresAt: Date;
}

interface IntegrationToken {
  id: number;
  user_id: number;
  access_token: string;
  refresh_token: string;
  expires_at?: Date;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class IntegrationTokenRepository {
  constructor(
    @Inject(DatabaseService)private readonly databaseService: DatabaseService
  ) {}

  async createOne(createIntegrationTokenEntity: CreateIntegrationTokenEntity) {
    const { userId, integrationToken, refreshToken, expiresAt } = createIntegrationTokenEntity;
    const query = `
      INSERT INTO integration_token (user_id, access_token, refresh_token, expires_at) VALUES ($1, $2, $3, $4) RETURNING id`;

    const result = await this.databaseService.runQuery(query, [userId, integrationToken, refreshToken, expiresAt]);
    const integrationTokenId = result.rows[0].id;

    return integrationTokenId; 
  }

  async findByUserId(userId: number | string) {
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
}