import axios from "axios";
import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from '@nestjs/config';
import { Logger } from "@nestjs/common";
import { Buffer } from 'buffer';

import { CampaignCreationResponse, CampaignCreationStatus, CreateCampaignDto } from "./campaign.dto";
import { CampaignRepository } from "./campaign.repository";
import { CampaignLeadRepository } from "../campaign-leads/campaign-lead.repository";
import { QueueService } from "../queue/queue.service";
import { IntegrationTokenRepository } from "../integrationToken/integration-token.repository";
import { IntegrationTokenService } from "../integrationToken/integration-token.service";
import { EventRepository } from "../event/event.repository";
import { LeadRepository } from "../lead/lead.repository";
import { Campaign } from "./campaign.types";

export enum CampaignStatus {
  Active = 'active',
  Inactive = 'inactive'
};

export enum EmailGenerationQueueObjectType {
  Outgoing = 'outgoing',
  Reply = 'reply'
}

interface EmailGenerationQueueObject {
  campaign_id: number;
  lead_id: number;
  first_name: string;
  last_name: string;
  campaign_goal: string;
  type: EmailGenerationQueueObjectType;
  thread?: string;
  thread_id?: string;
  last_message?: string;
};

interface HistoryMessageAddedItem {
  message: {
    id: string;
    threadId: string;
  };
}

interface HistoryDetails {
  nextPageToken?: string;
  historyId: string;
  history: {
    id: string;
    messages: {
      id: string;
      threadId: string;
    }[];
    messagesAdded: HistoryMessageAddedItem[];
  }[];
}

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);

  private gmailApiUrl = 'https://gmail.googleapis.com'

  private readonly emailGenerationTopicName = 'email-generation';

  constructor(
    private configService: ConfigService,
    @Inject(CampaignRepository) private readonly campaignRepository: CampaignRepository,
    @Inject(CampaignLeadRepository) private readonly campaignLeadRepository: CampaignLeadRepository,
    @Inject(QueueService) private readonly queueService: QueueService,
    @Inject(IntegrationTokenRepository) private readonly integrationTokenRepository: IntegrationTokenRepository,
    @Inject(IntegrationTokenService) private readonly integrationTokenService: IntegrationTokenService,
    @Inject(EventRepository) private readonly eventRepository: EventRepository,
    @Inject(LeadRepository) private readonly leadRepository: LeadRepository,
  ) { }

  async createCampaign(createCampaignDto: { name: string, goal: string, owner_id: number, urls: string[] }): Promise<CampaignCreationResponse> {
    try {
      const { name, goal, urls, owner_id } = createCampaignDto;
      const saveCampaignToCoreDbRes = await this.campaignRepository.createCampaign({ name, goal, owner_id });
      const campaignId = saveCampaignToCoreDbRes.id;
      // FIXME: handle the case when receive error from the scrapping service
      const scrappingServiceAddress = this.configService.get<string>('SCRAPPING_SERVICE_ADDRESS');
      const scrappingServiceResponse = await axios.post(scrappingServiceAddress, {
        urls,
        campaign_id: campaignId
      });

      return saveCampaignToCoreDbRes;
    } catch (error) {
      console.log('error: ', error)

      return {
        status: CampaignCreationStatus.Error
      };
    }
    
  }

  async getAllCampaigns(): Promise<Campaign[]> {
    return this.campaignRepository.getAllCampaigns();
  }

  async getCampaigns(page: number, size: number): Promise<Campaign[]> {
    return this.campaignRepository.getCampaigns(page, size);
  }

  async getTotalPages(pageSize: number): Promise<number> {
    const totalCampaigns = await this.campaignRepository.getTotalCampaigns();
    const totalPages = Math.ceil(totalCampaigns / pageSize);

    return totalPages;
  }

  async getCampaign(campaignId: number): Promise<Campaign> {
    return this.campaignRepository.getCampaign(campaignId);
  }

  async moveCampaignLeadsToGenerationQueue(campaignId: number): Promise<void> {
    const campaignLeads = await this.campaignLeadRepository.getCampaignLeads(campaignId);

    for (const campaignLead of campaignLeads) {
      const emailGenerationQueueObject: EmailGenerationQueueObject = {
        campaign_id: campaignId,
        lead_id: campaignLead.lead_id,
        first_name: campaignLead.first_name,
        last_name: campaignLead.last_name,
        campaign_goal: campaignLead.campaign_goal,
        type: EmailGenerationQueueObjectType.Outgoing
      };

      await this.queueService.send(this.emailGenerationTopicName, emailGenerationQueueObject);
    }
  }

  async changeCampaignStatus(params: { campaignId: number, newStatus: CampaignStatus }): Promise<Campaign> {
    const { campaignId, newStatus } = params;

    if (newStatus === CampaignStatus.Active) {
      const activeCampaign = await this.campaignRepository.activate(campaignId);

      await this.moveCampaignLeadsToGenerationQueue(campaignId);

      return activeCampaign;
    }

    return this.campaignRepository.deactivate(campaignId);
  }

  public async handleReply(params: { userEmail: string, history_id: string }) {
    const { userEmail, history_id } = params;

    this.logger.log(`Received reply for user ${userEmail} with historyId: ${history_id}`);

    const integrationToken = await this.integrationTokenRepository.findByEmail(userEmail);
    const { refresh_token, history_id: integrationTokenHistoryId, expires_at } = integrationToken;
    let access_token = integrationToken.access_token;
    const shouldRefreshToken = !expires_at || !access_token || new Date(expires_at) < new Date();

    if (shouldRefreshToken) {
      const refreshTokenResponse = await this.integrationTokenService.refreshToken(refresh_token);
      const { access_token: newAccessToken, expires_in } = refreshTokenResponse;
      const expiresAt = new Date(Date.now() + expires_in * 1000);

      await this.integrationTokenRepository.updateAccessTokenAndExpiration(integrationToken.user_id, newAccessToken, expiresAt);

      access_token = newAccessToken;
    }

    let historyDetails = await this.getHistoryDetails({ email: userEmail, historyId: history_id, accessToken: access_token });

    console.log("History details: ", historyDetails);

    const newMessageIds = [];
    if (!historyDetails?.history) {
      this.logger.log(`No history details found for user ${userEmail} with historyId: ${history_id}`);

      return;
    }

    for (const entry of historyDetails?.history) {
      if (entry.messagesAdded) {
        for (const added of entry.messagesAdded) {
          newMessageIds.push(added.message.id);
        }
      }
    }

    const messagesDetails = [];

    for (const messageId of newMessageIds) {
      const messageDetails = await this.getMessageDetails({ email: userEmail, messageId, accessToken: access_token });

      console.log("Received message details: ", messageDetails);

      // Check that events with thread_id are present in the database
      // We need this check to reply only to the messages that were sent from the app
      const existingEvents = await this.eventRepository.getEventByThreadId(messageDetails.threadId);

      if (!existingEvents) {
        this.logger.error(`No events found for threadId ${messageDetails.threadId}. Skipping message.`);

        continue;
      }

      const firstExistingEvent = existingEvents[0];
      const { campaign_id, lead_id } = firstExistingEvent;
      const relatedCampaign = await this.campaignRepository.getCampaign(campaign_id);
      const campaignOwner = relatedCampaign.owner_id;
      const relatedLead = await this.leadRepository.findById({leadId: lead_id, userId: campaignOwner});

      const payload = messageDetails.payload;
      const headers = payload.headers;
      const body = this.extractBodyFromMessage(messageDetails);
      const replyData = {
        from: this.getHeader(headers, 'From'),
        to: this.getHeader(headers, 'To'),
        subject: this.getHeader(headers, 'Subject'),
        date: this.getHeader(headers, 'Date'),
        messageId: messageDetails.id,
        threadId: messageDetails.threadId,
        body
      };
      // TODO: save replyData to DB
      // FIXME: get the actual last message and not the whole thread
      const last_message = body;

      // Push data for the reply generation to the queue
      const replyGenerationQueueObject: EmailGenerationQueueObject = {
        campaign_id: existingEvents[0].campaign_id,
        lead_id: existingEvents[0].lead_id,
        first_name: relatedLead.first_name,
        last_name: relatedLead.last_name,
        campaign_goal: relatedCampaign.goal,
        thread: body,
        type: EmailGenerationQueueObjectType.Reply,
        last_message
      };

      await this.queueService.send(this.emailGenerationTopicName, replyGenerationQueueObject);

      //messagesDetails.push(messageDetails);
    }
    
  }

  private extractBodyFromMessage(message: any, preferHtml = false): string {
    const parts = message.payload?.parts || [];
  
    if (!parts || parts.length === 0) return '';
  
    const targetMime = preferHtml ? 'text/html' : 'text/plain';
  
    for (const part of parts) {
      if (part.mimeType === targetMime && part.body && part.body.data) {
        const decoded = this.decodeBase64Url(part.body.data);

        console.log("Decoded message: ", decoded);

        return decoded;
      }
    }
  
    // fallback: try any part with data
    for (const part of parts) {
      if (part.body && part.body.data) {
        const decoded = this.decodeBase64Url(part.body.data);

        console.log("Decoded message(2): ", decoded);

        return decoded;
      }
    }
  
    return '';
  }

  private getTheLatestMessageFromTheThread(thread: string): string {
    const parts = thread.split('\n\n');
    const lastPart = parts[parts.length - 1];

    return lastPart;
  }
  
  private decodeBase64Url(base64url: string): string {
    const fixed = base64url.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(fixed, 'base64').toString('utf-8');
  }

  private async getHistoryDetails(params: { email: string, historyId: string, accessToken: string, nextPageToken?: string }) {
    const { email, historyId, accessToken, nextPageToken } = params;

    try {
      this.logger.log(`Fetching history details for user ${email} with historyId: ${historyId}`);

      const url = `${this.gmailApiUrl}/gmail/v1/users/me/history?startHistoryId=${historyId}`;
      const requestOptions = {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          startHistoryId: historyId,
          pageToken: nextPageToken || ''
        }
      }
      const { data } = await axios.get(url, requestOptions);

      return data;
    } catch (error) {
      this.logger.error(`Error fetching history details for user ${email} with historyId: ${historyId}`, error);
    }
  }

  private async getMessageDetails(params: { email: string, messageId: string, accessToken: string }) {
    const { email, messageId, accessToken } = params;

    try {
      this.logger.log(`Fetching message details for user ${email} with messageId: ${messageId}`);

      const url = `${this.gmailApiUrl}/gmail/v1/users/me/messages/${messageId}?format=full`;
      const requestOptions = {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
      const { data } = await axios.get(url, requestOptions);

      return data;
    } catch (error) {
      this.logger.error(`Error fetching message details for user ${email} with messageId: ${messageId}`, error);

      return null;
    }
  }

  /**
   * Helper function to get the header value of a gmail message
   * @param headers
   * @param name
   * @returns
   */
  private getHeader (headers, name: string) {
    return headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value;
  }
}
