import { Inject, Injectable } from "@nestjs/common";

import { DatabaseService } from "../database/database.service";

interface CreateIntegrationTokenEntity {
  userId: number;
  integrationToken: string;
  refreshToken: string;
  expiresAt: Date;
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
}