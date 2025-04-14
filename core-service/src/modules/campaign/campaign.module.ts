import { Module } from "@nestjs/common";
import { CampaignService } from "./campaign.service";
import { CampaignController } from "./campaign.controller";
import { CampaignRepository } from "./campaign.repository";
import { DatabaseModule } from "../database/database.module";
import { LinkModule } from "../link/link.module";
import { CampaignLeadModule } from "../campaign-leads/campaign-lead.module";
import { QueueModule } from "../queue/queue.module";
import { IntegrationTokenModule } from "../integrationToken/integration-token.module";
import { EventModule } from "../event/event.module"; 
import { LeadModule } from "../lead/lead.module";
import { UserModule } from "../user/user.module";

@Module({
  imports: [DatabaseModule, LinkModule, CampaignLeadModule, QueueModule, IntegrationTokenModule, EventModule, LeadModule, UserModule],
  controllers: [CampaignController],
  exports: [CampaignService, CampaignRepository],
  providers: [CampaignService, CampaignRepository]
})
export class CampaignModule {}
