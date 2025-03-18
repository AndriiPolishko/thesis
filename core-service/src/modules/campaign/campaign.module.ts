import { Module } from "@nestjs/common";
import { CampaignService } from "./campaign.service";
import { CampaignController } from "./campaign.controller";
import { CampaignRepository } from "./campaign.repository";
import { DatabaseModule } from "../database/database.module";
import { LinkModule } from "../link/link.module";

@Module({
  imports: [DatabaseModule, LinkModule],
  controllers: [CampaignController],
  exports: [CampaignService],
  providers: [CampaignService, CampaignRepository]
})
export class CampaignModule {}
