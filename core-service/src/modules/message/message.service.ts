import { Inject, Logger } from "@nestjs/common";
import { Injectable } from "@nestjs/common";

import { IntegrationTokenRepository } from "../integrationToken/integration-token.repository";
import { CampaignRepository } from "../campaign/campaign.repository";
import { GmailClientUtil } from "./utils/gmail-client.util";
import { LeadRepository } from "../lead/lead.repository";
import { CampaignLeadRepository } from "../campaign-leads/campaign-lead.repository";

export interface SendEmailMessagePayload {
  campaign_id: number;
  lead_id: number;
  to_email: string;
  subject: string;
  body: string;
  thread_id?: string;
  message_id?: string;
}

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);

  constructor(
    private readonly tokenRepo: IntegrationTokenRepository,
    private readonly campaignRepo: CampaignRepository,
    private readonly gmailUtil: GmailClientUtil,
    private readonly leadRepo: LeadRepository,
    @Inject(CampaignLeadRepository) private readonly campaignLeadRepo: CampaignLeadRepository,
  ) {}

  async handleSendEmailMessage(payload: SendEmailMessagePayload) {
    const { campaign_id, lead_id, to_email } = payload;
    try {
      const campaign = await this.campaignRepo.findById(campaign_id);
      const userId = campaign.owner_id;

      let token = await this.tokenRepo.findByUserId(userId);

      if (!token) {
        this.logger.error(`No integration token found for campaign ${campaign_id} with owner ${userId}. Skipping send email`);

        return;
      }

      const campaignLead = await this.campaignLeadRepo.findByCampaignIdAndLeadId(campaign_id, lead_id);

      if (!campaignLead) {
        this.logger.error(`No campaign lead found for campaign ${campaign_id} and lead ${lead_id}. Skipping send email`);

        return;
      }

      const from_email = token.email;

      // TODO: Add a check before refreshing the token
      const refreshed = await this.gmailUtil.refreshAccessToken(token.refresh_token);
      const { accessToken, refreshToken, expiresAt} = refreshed;

      token = await this.tokenRepo.updateToken(userId, accessToken, refreshToken, expiresAt);

      await this.gmailUtil.sendEmail({
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        payload,
        from_email,
        campaignLeadId: campaignLead.id,
        integrationTokenId: token.id
      });
      }
    catch (error) {
      this.logger.error(`Error sending email for campaign ${campaign_id} and lead ${lead_id}: ${error.message}`, error);
    }
  }
}
