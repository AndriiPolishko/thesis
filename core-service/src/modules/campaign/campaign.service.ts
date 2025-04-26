import axios from "axios";
import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from '@nestjs/config';
import { Logger } from "@nestjs/common";
import { Buffer } from 'buffer';

import { CampaignCreationResponse, CampaignCreationStatus, CreateCampaignDto } from "./campaign.dto";
import { CampaignRepository } from "./campaign.repository";
import { CampaignLeadRepository } from "../campaign-leads/campaign-lead.repository";
import { IntegrationTokenRepository } from "../integrationToken/integration-token.repository";
import { IntegrationTokenService } from "../integrationToken/integration-token.service";
import { EventRepository } from "../event/event.repository";
import { LeadRepository } from "../lead/lead.repository";
import { Campaign } from "./campaign.types";
import { UserRepository } from '../user/user.repository'
import { EventType } from "../event/event.types";
import { MessageGenerationProducer } from "../queue/producers/message-generation.producer";
import { LinkRepository } from "../link/link.repository";
import { LinkCreationStatus, LinkStatus } from "../link/link.dto";
import { EmailType } from "../global/email-type-enum";
import { LeadStatus } from "../lead/lead.types";
import { CampaignLeadStatus } from "../campaign-leads/campaign-lead.types";

export enum CampaignStatus {
  Active = 'active',
  Inactive = 'inactive',
  Pending = 'pending'
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
  message_id?: string;
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

  private readonly openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');

  private readonly chatCompletionsUrl = 'https://api.openai.com/v1/chat/completions';

  private readonly messageGenerationGroupId = 'message_generation_group_id';

  constructor(
    private configService: ConfigService,
    @Inject(CampaignRepository) private readonly campaignRepository: CampaignRepository,
    @Inject(CampaignLeadRepository) private readonly campaignLeadRepository: CampaignLeadRepository,
    @Inject(IntegrationTokenRepository) private readonly integrationTokenRepository: IntegrationTokenRepository,
    @Inject(IntegrationTokenService) private readonly integrationTokenService: IntegrationTokenService,
    @Inject(EventRepository) private readonly eventRepository: EventRepository,
    @Inject(LeadRepository) private readonly leadRepository: LeadRepository,
    @Inject(UserRepository) private readonly userRepository: UserRepository,
    @Inject(MessageGenerationProducer) private readonly messageGenerationProducer: MessageGenerationProducer,
    @Inject(LinkRepository) private readonly linkRepository: LinkRepository,
  ) { }

  async createCampaign(createCampaignDto: { name: string, goal: string, owner_id: number, urls: string[] }): Promise<CampaignCreationResponse> {
    try {
      const { name, goal, urls, owner_id } = createCampaignDto;
      const saveCampaignToCoreDbRes = await this.campaignRepository.createCampaign({ name, goal, owner_id });
      const campaignId = saveCampaignToCoreDbRes.id;
      // Create links. The default status is "pending". 
      // In case we successfully scrape the link, status changes to "scrapped". In case scrapping service fails, status changes to "failed". In case link can't be scrapped, status changes to "can't scrapped".
      const linkIdUrlMaps = await this.createLinks(campaignId, urls);
      const linkIds = linkIdUrlMaps.map(link => link.linkId);
      const scrappingServiceAddress = this.configService.get<string>('SCRAPPING_SERVICE_ADDRESS');

      console.log('reqest data: ', {
        link_id_url_maps_str: JSON.stringify(linkIdUrlMaps),
        campaign_id: Number(campaignId)
      });

      const scrappingServiceResponse = await axios.post(scrappingServiceAddress, {
        link_id_url_maps_str: JSON.stringify(linkIdUrlMaps),
        campaign_id: Number(campaignId)
      });

      if (scrappingServiceResponse.status.toString()[0] !== '2') {
        this.logger.error(`Error from scrapping service: ${scrappingServiceResponse.data}. Campaign ID: ${campaignId}, link IDs: ${linkIds}. Setting link statuses to "failed"`,
          urls
        );
        
        for (const linkId of linkIds) {
          await this.linkRepository.updateLinkStatus(linkId, LinkStatus.Failed);
        }
      }

      return saveCampaignToCoreDbRes;
    } catch (error) {
      console.log('error: ', error)

      return {
        status: CampaignCreationStatus.Error
      };
    }
  }

  async createLinks(campaignId: number, urls: string[]) {
    const linkIdUrlMaps: {linkId: number, linkUrl: string}[] = [];
    for (const url of urls) {
      const link = await this.linkRepository.createLink({ url, campaignId });

      if (link.status === LinkCreationStatus.Error) {
        this.logger.error(`Error creating link for campaign ${campaignId}: ${link.errorText}`);
      } else {
        this.logger.log(`Link created successfully for campaign ${campaignId}: ${link.id}`);

        linkIdUrlMaps.push({
          linkId: link.id,
          linkUrl: url
        });
      }
    }

    return linkIdUrlMaps;
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
    const campaign = await this.campaignRepository.getCampaign(campaignId);

    if (campaign.status === CampaignStatus.Pending) {
      const links = await this.linkRepository.getLinksByCampaignId(campaignId);

      // Check if none of the links is in "pending" status
      const allLinksScrapped = links.every(link => link.status !== LinkStatus.Pending);
      if (allLinksScrapped) {
        // Update the campaign status to "inactive"
        await this.campaignRepository.deactivate(campaignId);
        campaign.status = CampaignStatus.Inactive;
      }
    }

    return campaign
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

      await this.messageGenerationProducer.produce(emailGenerationQueueObject, this.messageGenerationGroupId);
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

  public async handleIncoming(params: { userEmail: string, history_id: string }) {
    const { userEmail, history_id } = params;
    const user = await this.userRepository.findOneByEmail(userEmail);
    const userId = user.id;

    this.logger.log(`Received incoming for user ${userEmail} with id ${userId} with historyId: ${history_id}`);

    const integrationToken = await this.integrationTokenRepository.findByEmail(userEmail);
    const { refresh_token, history_id: startHistoryId, expires_at } = integrationToken;
    let access_token = integrationToken.access_token;
    // TODO: move to the separate function for token refresh
    const shouldRefreshToken = !expires_at || !access_token || new Date(expires_at) < new Date();

    if (shouldRefreshToken) {
      const refreshTokenResponse = await this.integrationTokenService.refreshToken(refresh_token);
      const { access_token: newAccessToken, expires_in } = refreshTokenResponse;
      const expiresAt = new Date(Date.now() + expires_in * 1000);

      await this.integrationTokenRepository.updateAccessTokenAndExpiration(integrationToken.user_id, newAccessToken, expiresAt);

      access_token = newAccessToken;
    }

    let historyDetails = await this.getHistoryDetails({ email: userEmail, historyId: startHistoryId, accessToken: access_token });

    console.log("History details: ", historyDetails);

    const newMessageIds = [];

    // Important: Update the stored history ID even if there are no changes
    if (historyDetails && historyDetails.historyId) {
      await this.integrationTokenRepository.updateHistoryId(integrationToken.id, historyDetails.historyId);
      this.logger.log(`Updated historyId to ${historyDetails.historyId} for user ${userEmail}`);
    }

    if (!historyDetails?.history) {
      this.logger.log(`No history details found for user ${userEmail} with id ${userId} with historyId: ${history_id}. Skipping...`);

      return;
    }

    this.logger.log(`Start processing ${historyDetails?.history.length} history details for user ${userEmail} with id ${userId} with historyId: ${history_id}`);

    for (const entry of historyDetails?.history) {
      if (entry.messagesAdded) {
        for (const added of entry.messagesAdded) {
          newMessageIds.push(added.message.id);
        }
      }
    }

    if (newMessageIds.length === 0) {
      this.logger.log(`No new messages found for user ${userEmail} with id ${userId} with historyId: ${history_id}. Skipping...`);

      return;
    }

    this.logger.log(`Found ${newMessageIds.length} new messages for user ${userEmail} with id ${userId} with historyId: ${history_id}`);

    for (const messageId of newMessageIds) {
      const messageDetails = await this.getMessageDetails({ email: userEmail, messageId, accessToken: access_token });

      console.log("Received message details: ", messageDetails);

      // Check that events with thread_id are present in the database
      // We need this check to reply only to the messages that were sent from the app
      // TODO: NOTE: maybe problem is here
      const existingEvents = await this.eventRepository.getEventByThreadId(messageDetails.threadId);

      if (!existingEvents) {
        this.logger.error(`No events found for threadId ${messageDetails.threadId}. Skipping message.`);

        continue;
      }

      const payload = messageDetails.payload;
      const headers = payload.headers;
      const fromEmail = this.getHeader(headers, 'From');

      if (fromEmail.includes(userEmail)) {
        this.logger.log(`Skipping self-sent message from ${fromEmail}`);

        continue;
      }

      const lastEventFromTheThread = existingEvents[existingEvents.length - 1];
      const { campaign_id, lead_id, campaign_lead_id } = lastEventFromTheThread;
      const relatedCampaign = await this.campaignRepository.getCampaign(campaign_id);
      const campaignOwner = relatedCampaign.user_id;
      const relatedLead = await this.leadRepository.findById({leadId: lead_id, userId: campaignOwner});
      const threadId = messageDetails.threadId;
      const body = this.extractBodyFromMessage(messageDetails);
      const messageIdHeader = headers.find(h => h.name.toLowerCase() === 'message-id')?.value;
      const lastMessageLlmOutput = await this.getTheLastMessageFromTheThread(body, lastEventFromTheThread.body);
      const lastMessage = this.formatTheLastMessage(lastMessageLlmOutput);
      const detectedEmailType = await this.detectEmailType(lastMessage);
      const maxCategory = this.getMaxCategory(detectedEmailType);

      const incomingData = {
        from: this.getHeader(headers, 'From'),
        to: this.getHeader(headers, 'To'),
        subject: this.getHeader(headers, 'Subject'),
        message_id: messageIdHeader,
        thread_id: threadId,
        body,
        type: maxCategory as unknown as EventType,
        lead_id,
        campaign_id,
        campaign_lead_id
      };

      this.logger.log(`Saving incoming message to the database for user ${userId}`);

      await this.eventRepository.createEvent(incomingData);

      if (maxCategory === EmailType["Opt-out"]) {
        this.logger.log(`Detected opt-out email for user ${userId}. Marking lead as opt-out`);
        
        await this.leadRepository.updateLeadStatus(lead_id, LeadStatus.OptOut);
        await this.campaignLeadRepository.updateStatus(campaign_lead_id, CampaignLeadStatus.Closed);

        return;
      }

      if (maxCategory === EmailType["Booked"]) {
        this.logger.log(`Detected booked email for user ${userId}. Marking campaign lead as booked`);

        await this.campaignLeadRepository.updateStatus(campaign_lead_id, CampaignLeadStatus.Booked);

        return;
      }

      // Push data for the reply generation to the queue
      const replyGenerationQueueObject: EmailGenerationQueueObject = {
        campaign_id: existingEvents[0].campaign_id,
        lead_id: existingEvents[0].lead_id,
        first_name: relatedLead.first_name,
        last_name: relatedLead.last_name,
        campaign_goal: relatedCampaign.goal,
        thread: body,
        thread_id: threadId,
        type: EmailGenerationQueueObjectType.Reply,
        message_id: messageIdHeader,
        last_message: lastMessage
      };

      await this.messageGenerationProducer.produce(replyGenerationQueueObject, this.messageGenerationGroupId);
    }
  }

  private formatTheLastMessage(llmOutout: string): string {
    const regex = /<highest_message>(.*?)<\/highest_message>/s;
    const match = llmOutout.match(regex);

    if (match && match[1]) {
      return match[1].trim();
    }

    return '';
  }

  /**
   * Extract the last message from the email thread using LLM
   * @param emailThread 
   * @returns The last message from the email thread
   */
  private async getTheLastMessageFromTheThread(emailThread: string, previousThread: string): Promise<string> {
    const response = await axios.post(this.chatCompletionsUrl, {
      model: 'gpt-4.1-mini-2025-04-14',
      messages: [
        {
          role: 'system',
          content: `
You are a email thread analizator. As input you accept the two email threads <current_thread> and <previous_thread>.
You need to output the messages that appear in the <current_thread> and don't appear in the <previous_thread>. Output that difference in the <diff> tag.
Then based on the semantic context inside <diff>, get the highest message from the email thread inside <diff>

Your output should have the following form:
<diff>
...message that present in the <current_thread> but not in <previous_thread>...
</diff>

<highest_message>
...highest message inside <diff>...
<highest_message>
`
        },
        {
          role: 'user',
          content: `
<current_thread>
${emailThread}
</current_thread>

<previous_thread>
${previousThread}
</previous_thread>
`
        }
      ],
      temperature: 0.9,
      top_p: 1,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`
      }
    });

    const classification = response.data.choices[0].message.content.trim().toLowerCase();

    return classification;
  }

  /**
   * Detects the type of email based on its content using LLM.
   * @param email
   * @returns String with the type and percentage that indicated the confidence of the type
   * @example "incoming: 80%, booked: 10%, opt-out: 10%"
   */
  private async detectEmailType(email: string): Promise<string> {
    const response = await axios.post(this.chatCompletionsUrl, {
      model: 'gpt-4.1-mini-2025-04-14',
      messages: [
        {
          role: 'system',
          content: `
You are an assistant that analyzes the possibility that email falls into one of the following categories: incoming, booked, opt-out. Your output ALWAYS follows this format: "incoming: <percentage>%, booked: <percentage>%, opt-out: <percentage>%". The sum of all percentages should be 100%.

Messages that show intent to meet, book a call or other intents to engage with the product should be marked as booked.
Messages that ask to unsubscribe, cancel or other ways to ask not to message them should be marked as opt-out
          `
        },
        {
          role: 'user',
          content: `<email>${email}</email>`
        }
      ]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`
      }
    });

    const classification = response.data.choices[0].message.content.trim().toLowerCase();

    return classification;
  }

  /**
   * Extracts the maximum category from the classification string.
   * @param input
   * @returns
   */
  private getMaxCategory(input: string): EmailType {
    const regex = /([\w-]+):\s*([\d.]+)%/g;
    let match: RegExpExecArray | null;
    let maxKey: string | null = null;
    let maxValue = -Infinity;
  
    while ((match = regex.exec(input)) !== null) {
      const key = match[1];
      const value = parseFloat(match[2]);
      if (value > maxValue) {
        maxValue = value;
        maxKey = key;
      }
    }
  
    return maxKey as EmailType;
  }

  private extractBodyFromMessage(message: any, preferHtml = false): string {
    const payload = message.payload;
  
    // First, check if the top-level body has content (no parts)
    if (payload.body?.data) {
      const decoded = this.decodeBase64Url(payload.body.data);
      console.log("Decoded message (top-level):", decoded);
      return decoded;
    }
  
    const parts = payload.parts || [];
    if (!parts || parts.length === 0) return '';
  
    const targetMime = preferHtml ? 'text/html' : 'text/plain';
  
    // Try to find preferred MIME type
    for (const part of parts) {
      if (part.mimeType === targetMime && part.body?.data) {
        const decoded = this.decodeBase64Url(part.body.data);
        console.log("Decoded message (preferred MIME):", decoded);
        return decoded;
      }
    }
  
    // Fallback: any part with data
    for (const part of parts) {
      if (part.body?.data) {
        const decoded = this.decodeBase64Url(part.body.data);
        console.log("Decoded message (fallback part):", decoded);
        return decoded;
      }
    }
  
    return '';
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
