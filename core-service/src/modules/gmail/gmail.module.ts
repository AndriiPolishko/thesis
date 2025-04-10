import { Module } from "@nestjs/common";

import { GmailController } from "./gmail.controller";
import { CampaignModule } from "../campaign/campaign.module";

@Module({
  controllers: [GmailController],
  imports: [CampaignModule]
})
export class GmailModule {}