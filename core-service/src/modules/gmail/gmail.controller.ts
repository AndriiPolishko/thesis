import { Body, Controller, Post, Inject, Res } from "@nestjs/common";
import { Response } from "express";
import { Logger } from "@nestjs/common";

import { CampaignService } from "../campaign/campaign.service";

@Controller("gmail")
export class GmailController {
  private readonly logger = new Logger(GmailController.name);

  constructor(
    @Inject(CampaignService) private readonly campaignService: CampaignService
  ) {}

  @Post('webhook')
  async handleWebhook(@Body() body: any, @Res() res: Response): Promise<void> {
    try {
      const { message } = body;

      const data = JSON.parse(
        Buffer.from(message.data, 'base64').toString('utf-8')
      );
    
      const { emailAddress, historyId } = data;
      
      res.status(200).send();

      await this.campaignService.handleIncoming({ userEmail: emailAddress, history_id: historyId });

    } catch (error) {
      this.logger.error('Error handling webhook', error);
    }
  }
  
}