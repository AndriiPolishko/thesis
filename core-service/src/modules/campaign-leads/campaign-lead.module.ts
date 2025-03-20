import { Module } from "@nestjs/common";

import { CampaignLeadController } from "./campaign-lead.controller";
import { CampaignLeadRepository } from "./campaign-lead.repository";
import { CampaignLeadService } from "./campaign-lead.service";
import { DatabaseModule } from "../database/database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [CampaignLeadController],
  providers: [CampaignLeadRepository, CampaignLeadService],
  exports: [CampaignLeadRepository, CampaignLeadService]
})
export class CampaignLeadModule {}