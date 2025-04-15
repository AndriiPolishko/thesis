import { forwardRef, Module } from "@nestjs/common";

import { MessageService } from "./message.service";
import { GmailClientUtil } from "./utils/gmail-client.util";
import { CampaignModule } from "../campaign/campaign.module";
import { LeadModule } from "../lead/lead.module";
import { IntegrationTokenModule } from "../integrationToken/integration-token.module"; 
import { QueueModule } from "../queue/queue.module";
import { CampaignLeadModule } from "../campaign-leads/campaign-lead.module";
import { EventModule } from "../event/event.module";

@Module({
  imports: [LeadModule, forwardRef(()=>(CampaignModule)), IntegrationTokenModule, forwardRef(()=>(QueueModule)) , CampaignLeadModule, EventModule],
  controllers: [],
  providers: [MessageService, GmailClientUtil],
  exports: [MessageService, GmailClientUtil],
})
export class MessageModule {}

