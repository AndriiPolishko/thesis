import axios from 'axios';
import { Inject, Logger } from '@nestjs/common';
import { Injectable } from "@nestjs/common";
import { gmail_v1, google } from 'googleapis';

import { SendEmailMessagePayload } from '../message.service';
import { EventRepository } from 'src/modules/event/event.repository';
import { EventType } from 'src/modules/event/event.types';
import { IntegrationTokenRepository } from 'src/modules/integrationToken/integration-token.repository';

interface SendEmailParams {
  access_token: string;
  refresh_token: string;
  payload: SendEmailMessagePayload;
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
  // TODO: move it up
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
    @Inject(IntegrationTokenRepository) private readonly integrationTokenRepository: IntegrationTokenRepository,
  ){}

  // TODO: move it out of this class
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
    const { access_token, refresh_token, payload, from_email, campaignLeadId, integrationTokenId } = params;
    const { to_email, subject, body, thread_id, campaign_id, lead_id, message_id } = payload;

    try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token,
      // refresh_token, // optional but good
      // expiry_date: Date.now() + 3600 * 1000, // optional but good
    });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    if (thread_id) {
      this.logger.log(`Found thread_id ${thread_id} in payload. Sending reply to ${to_email} from ${from_email}`);

      await this.sendReply({
        // TODO: remove after testing
        to: to_email || 'andrii.polishko@ucu.edu.ua',
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

    await this.sendOutgoing({ to: to_email || 'andrii.polishko@ucu.edu.ua', subject, body, gmail, from_email, campaignLeadId, campaign_id, lead_id, integrationTokenId });
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
    }
    catch (error) {
      this.logger.error('Error sending outgoing message', { error });
    }
  }

  async sendReply(params: SendReplyParams) {
    const { to, subject, body, thread_id, message_id, gmail } = params;

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
    } catch (error) {
      this.logger.error('Error sending reply', { error });
    }
  }
}
