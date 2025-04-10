import { Module } from "@nestjs/common";

import { MessageService } from "./message.service";
import { SendEmailConsumer } from "./consumers/send-email.consumer";
import { GmailClientUtil } from "./utils/gmail-client.util";
import { CampaignModule } from "../campaign/campaign.module";
import { LeadModule } from "../lead/lead.module";
import { IntegrationTokenModule } from "../integrationToken/integration-token.module"; 
import { QueueModule } from "../queue/queue.module";
import { CampaignLeadModule } from "../campaign-leads/campaign-lead.module";
import { EventModule } from "../event/event.module";

@Module({
  imports: [CampaignModule, LeadModule, IntegrationTokenModule, QueueModule, CampaignLeadModule, EventModule],
  controllers: [],
  providers: [MessageService, SendEmailConsumer, GmailClientUtil],
  exports: [MessageService, SendEmailConsumer, GmailClientUtil],
})
export class MessageModule {}

