import { Inject, Injectable } from "@nestjs/common";
import { Logger } from "@nestjs/common";

import { DatabaseService } from '../database/database.service';
import { LinkCreationResponse, LinkCreationStatus, CreateLinkDto, LinkStatus } from "./link.dto";

@Injectable()
export class LinkRepository {
  private readonly logger = new Logger(LinkRepository.name);

  constructor(
    @Inject(DatabaseService) private readonly databaseService: DatabaseService
  ) {}

  async createLink(createLinkDto: CreateLinkDto): Promise<LinkCreationResponse> {
    const { url, campaignId } = createLinkDto;
    const query = `
      INSERT INTO link (url, campaign_id) VALUES ($1, $2) RETURNING id`;

    try {
      const result = await this.databaseService.runQuery(query, [url, campaignId]);
      const linkId = Number(result.rows[0].id);

      return {
        id: linkId,
        status: LinkCreationStatus.Success
      };
    } catch (error) {
      this.logger.log('error on link creation : ', error)

      return {
        status: LinkCreationStatus.Error,
        errorText: error.message
      };
    }
  }

  async updateLinkStatus(linkId: number, status: LinkStatus): Promise<void> {
    const query = `
      UPDATE link SET status = $1 WHERE id = $2`;

    try {
      await this.databaseService.runQuery(query, [status, linkId]);

      this.logger.log(`Link with ID ${linkId} updated to status: ${status}`);
    }
    catch (error) {
      this.logger.error(`Error updating link with ID ${linkId}: ${error.message}`);
    }
  }
}
