import axios from 'axios';
import { Inject, Logger } from '@nestjs/common';
import { Injectable } from "@nestjs/common";
import { gmail_v1, google } from 'googleapis';

import { EventRepository } from 'src/modules/event/event.repository';
import { EventType } from 'src/modules/event/event.types';
import { CampaignLeadRepository } from 'src/modules/campaign-leads/campaign-lead.repository';
import { CampaignLeadStatus } from 'src/modules/campaign-leads/campaign-lead.types';
import { GeneratedEmailMessage } from 'src/modules/queue/queue.types'
import { LeadRepository } from 'src/modules/lead/lead.repository';

interface SendEmailParams {
  access_token: string;
  refresh_token: string;
  payload: GeneratedEmailMessage;
  from_email: string;
  campaignLeadId: number;
  integrationTokenId: number;
}

interface SendOutgoingParams {
  to: string;
  subject: string;
  body: string;
  from_email: string;
  campaignLeadId: number;
  lead_id: number;
  campaign_id: number;
  integrationTokenId: number;
  gmail: gmail_v1.Gmail;
}

interface SendReplyParams {
  to: string;
  subject: string;
  body: string;
  thread_id: string;
  message_id: string;
  from_email: string;
  campaignLeadId: number;
  lead_id: number;
  campaign_id: number;
  integrationTokenId: number;
  gmail: gmail_v1.Gmail;
}

@Injectable()
export class GmailClientUtil {
  private readonly logger = new Logger(GmailClientUtil.name);

  constructor(
    @Inject(EventRepository) private readonly eventRepository: EventRepository,
    @Inject(CampaignLeadRepository) private readonly campaignLeadRepo: CampaignLeadRepository,
    @Inject(LeadRepository) private readonly leadRepository: LeadRepository,
  ){}

  async refreshAccessToken(refreshToken: string) {
    try {
      const params = {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }
      const res = await axios.post('https://oauth2.googleapis.com/token', null, {
        params
      });
  
      return {
        accessToken: res.data.access_token,
        refreshToken: refreshToken,
        expiresAt: new Date(Date.now() + res.data.expires_in * 1000),
      };
    } catch (error) {
      this.logger.error('Error refreshing token', {
        error
      });
    }
    
  }

  async sendEmail(params: SendEmailParams) {
    const { access_token, payload, from_email, campaignLeadId, integrationTokenId } = params;
    const { subject, body, thread_id, campaign_id, lead_id, message_id } = payload;

    try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token
    });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const recepient = await this.leadRepository.findById(lead_id);
    const to_email = recepient.email;

    if (thread_id) {
      this.logger.log(`Found thread_id ${thread_id} in payload. Sending reply to ${to_email} from ${from_email}`);

      await this.sendReply({
        to: to_email ,
        subject,
        body,
        thread_id,
        message_id: message_id,
        from_email,
        gmail,
        campaignLeadId,
        campaign_id,
        lead_id,
        integrationTokenId
      });

      return;
    }

    this.logger.log(`Sending outgoing email to ${to_email} from ${from_email}`);

    await this.sendOutgoing({ to: to_email, subject, body, gmail, from_email, campaignLeadId, campaign_id, lead_id, integrationTokenId });
    } catch (error) {
      this.logger.error('Error sending email', { error });
    }
  }

  async sendOutgoing(params: SendOutgoingParams) {
    const { to, subject, body, gmail, from_email, campaignLeadId, campaign_id, lead_id, integrationTokenId } = params;

    try {
      const encodedMessage = Buffer.from([
        `To: ${to}`,
        `Subject: ${subject}`,
        `Content-Type: text/html; charset=UTF-8`,
        ``,
        body
      ].join('\n')).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

      this.logger.log(`Sending outgoing email to ${to} from ${from_email}`);
  
      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });

      const thread_id = response.data.threadId;
      const message_id = response.data.id;

      await this.eventRepository.createEvent({
        from: from_email,
        to,
        type: EventType.Outgoing,
        body,
        subject,
        thread_id,
        lead_id,
        campaign_id,
        campaign_lead_id: campaignLeadId,
        message_id
      });

      // Save event to the database
      this.logger.log(`Saving event for outgoing email to ${to} from ${from_email}`, {
        thread_id,
        message_id,
        campaignLeadId,
        campaign_id,
        lead_id,
        subject,
        body
      });
      await this.eventRepository.createEvent({ from: from_email, to, type: EventType.Outgoing, body, subject, thread_id, lead_id, campaign_id, campaign_lead_id: campaignLeadId, message_id });

      // Change status of the campaign lead
      await this.campaignLeadRepo.updateStatus(campaignLeadId, CampaignLeadStatus.Engaged);

    }
    catch (error) {
      this.logger.error('Error sending outgoing message', { error });
    }
  }

  async sendReply(params: SendReplyParams) {
    const { to, subject, body, thread_id, message_id, gmail, campaignLeadId } = params;

    try {
      const headers = [
        `To: ${to}`,
        `Subject: ${subject}`,
        'Content-Type: text/plain; charset="UTF-8"',
        `In-Reply-To: ${message_id}`,
        `References: ${message_id}`
      ];
      const rawMessage = [
        ...headers,
        '',
        body
      ].join('\n');
      const base64Encoded = Buffer.from(rawMessage)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      const payload: any = {
        raw: base64Encoded,
        threadId: thread_id,
      };
    
      await gmail.users.messages.send({
        userId: 'me',
        requestBody: payload,
      });

      this.logger.log(`Reply sent to ${to} with thread_id ${thread_id} and message_id ${message_id}`);

      await this.eventRepository.createEvent({
        from: params.from_email,
        to,
        type: EventType.Reply,
        body,
        subject,
        thread_id,
        lead_id: params.lead_id,
        campaign_id: params.campaign_id,
        campaign_lead_id: params.campaignLeadId,
        message_id
      });

      // Change status of the campaign lead
      //await this.campaignLeadRepo.updateStatus(campaignLeadId, CampaignLeadStatus.AwaitingReply);
    } catch (error) {
      this.logger.error('Error sending reply', { error });
    }
  }
}
