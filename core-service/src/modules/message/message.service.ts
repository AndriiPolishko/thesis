import { Injectable } from "@nestjs/common";

import { IntegrationTokenRepository } from "../integrationToken/integration-token.repository";
import { CampaignRepository } from "../campaign/campaign.repository";
import { GmailClientUtil } from "./utils/gmail-client.util";
import { LeadRepository } from "../lead/lead.repository";

@Injectable()
export class MessageService {
  constructor(
    private readonly tokenRepo: IntegrationTokenRepository,
    private readonly campaignRepo: CampaignRepository,
    private readonly gmailUtil: GmailClientUtil,
    private readonly leadRepo: LeadRepository,
  ) {}

  async handleSendEmailMessage(payload: {
    campaign_id: string;
    lead_id: string;
    to_email: string;
    subject: string;
    body: string;
  }) {
    const campaign = await this.campaignRepo.findById(payload.campaign_id);
    const lead = await this.leadRepo.findById(payload.lead_id);
    const leadEmail = lead.email;
    const userId = campaign.owner_id;

    let token = await this.tokenRepo.findByUserId(userId);

    // TODO: Add a check before refreshing the token
    const refreshed = await this.gmailUtil.refreshAccessToken(token.refresh_token);
    const { accessToken, refreshToken, expiresAt } = refreshed;

    console.log('refreshed', refreshed);

    token = await this.tokenRepo.updateToken(userId, accessToken, refreshToken, expiresAt);

    await this.gmailUtil.sendEmail({
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      to: leadEmail,
      subject: payload.subject,
      body: payload.body,
    });

    // Optional: mark email as sent
  }
}
