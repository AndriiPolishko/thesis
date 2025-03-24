import axios from "axios";
import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from '@nestjs/config';
import { Logger } from "@nestjs/common";

import { Campaign, CampaignCreationResponse, CampaignCreationStatus, CreateCampaignDto } from "./campaign.dto";
import { CampaignRepository } from "./campaign.repository";
import { CampaignLeadRepository } from "../campaign-leads/campaign-lead.repository";
import { QueueService } from "../queue/queue.service";

export enum CampaignStatus {
  Active = 'active',
  Inactive = 'inactive'
};

interface EmailGenerationQueueObject {
  campaign_id: number;
  lead_id: number;
  first_name: string;
  last_name: string;
  campaign_goal: string;
};

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);

  private readonly emailGenerationTopicName = 'email-generation';

  constructor(
    private configService: ConfigService,
    @Inject(CampaignRepository) private readonly campaignRepository: CampaignRepository,
    @Inject(CampaignLeadRepository) private readonly campaignLeadRepository: CampaignLeadRepository,
    @Inject(QueueService) private readonly queueService: QueueService
  ) { }

  async createCampaign(createCampaignDto: CreateCampaignDto): Promise<CampaignCreationResponse> {
    try {
      const { name, goal, urls } = createCampaignDto;
      const saveCampaignToCoreDbRes = await this.campaignRepository.createCampaign({ name, goal });
      const campaignId = saveCampaignToCoreDbRes.id;
      const scrappingServiceAddress = this.configService.get<string>('SCRAPPING_SERVICE_ADDRESS');
      const scrappingServiceResponse = await axios.post(scrappingServiceAddress, {
        urls,
        campaign_id: campaignId
      });

      this.logger.log(scrappingServiceResponse)

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
        campaign_goal: campaignLead.campaign_goal
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
}
