import { Inject, Logger } from "@nestjs/common";
import { Injectable } from "@nestjs/common";

import { IntegrationTokenRepository } from "../integrationToken/integration-token.repository";
import { CampaignRepository } from "../campaign/campaign.repository";
import { GmailClientUtil } from "./utils/gmail-client.util";
import { LeadRepository } from "../lead/lead.repository";
import { CampaignLeadRepository } from "../campaign-leads/campaign-lead.repository";
import {GeneratedEmailMessage } from '../queue/queue.types'
import { LeadStatus } from "../lead/lead.types";

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

  async handleSendEmailMessage(payload: GeneratedEmailMessage) {
    const { campaign_id, lead_id } = payload;
    try {
      const campaign = await this.campaignRepo.findById(campaign_id);
      const userId = campaign.user_id;
      const lead = await this.leadRepo.findById(lead_id);

      if (!lead || lead.status === LeadStatus.OptOut) {
        this.logger.error(`Lead ${lead_id} is not valid or opted out. Skipping send email`);

        return;
      }

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
