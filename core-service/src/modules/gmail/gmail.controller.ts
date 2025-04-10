import { Body, Controller, Post, Inject } from "@nestjs/common";

import { CampaignService } from "../campaign/campaign.service";

@Controller("gmail")
export class GmailController {
  constructor(
    @Inject(CampaignService) private readonly campaignService: CampaignService
  ) {}

  @Post('webhook')
  async handleWebhook(@Body() body: any) {
    try {
      const { message } = body;

      const data = JSON.parse(
        Buffer.from(message.data, 'base64').toString('utf-8')
      );
    
      const { emailAddress, historyId } = data;
      console.log(`Received message for user ${emailAddress} with historyId: ${historyId}`);

      await this.campaignService.handleReply({ userEmail: emailAddress, history_id: historyId });
    } catch (error) {
      console.error('Error processing webhook:', error);
    }
  }
  
}