import { Inject, Injectable } from "@nestjs/common";

import { DatabaseService } from '../database/database.service';
import { LinkCreationResponse, LinkCreationStatus, CreateLinkDto } from "./link.dto";

@Injectable()
export class LinkRepository {
  constructor(
    @Inject(DatabaseService) private readonly databaseService: DatabaseService
  ) {}

  async createLink(createLinkDto: CreateLinkDto): Promise<LinkCreationResponse> {
    try {
      const { url, campaignId } = createLinkDto;
      const query = `
        INSERT INTO link (url, campaign_id) VALUES ($1, $2) RETURNING id`;

      const result = await this.databaseService.runQuery(query, [url, campaignId]);
      const linkId = Number(result.rows[0].id);

      return {
        id: linkId,
        status: LinkCreationStatus.Success
      };
    } catch (error) {
      console.log('error: ', error)

      return {
        status: LinkCreationStatus.Error,
        errorText: error.message
      };
    }
  }
}
