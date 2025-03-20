import axios from "axios";
import { Inject, Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { Kafka } from 'kafkajs';
import { ConfigService } from '@nestjs/config';
import { Logger } from "@nestjs/common";

import { Campaign, CampaignCreationResponse, CampaignCreationStatus, CreateCampaignDto } from "./campaign.dto";
import { CampaignRepository } from "./campaign.repository";
import { LinkRepository } from "../link/link.repository";

@Injectable()
export class CampaignService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CampaignService.name);

  private readonly kafka;

  private readonly urlProducer;

  private readonly brokerAddress;

  constructor(
    private configService: ConfigService,
    @Inject(CampaignRepository) private readonly campaignRepository: CampaignRepository,
    @Inject(LinkRepository) private readonly linkRepository: LinkRepository
  ) {
    this.brokerAddress = this.configService.get<string>('KAFKA_BROKER_ADDRESS');

    this.kafka = new Kafka({
      clientId: 'nextjs-producer',
      brokers: [this.brokerAddress],
    });

    this.urlProducer = this.kafka.producer();
  }

  async onModuleInit() {
    await this.urlProducer.connect();

    console.log("Kafka Producer Connected");
  }

  async onModuleDestroy() {
    await this.urlProducer.disconnect();

    console.log("Kafka Producer Disconnected");
  }

  async createCampaign(createCampaignDto: CreateCampaignDto): Promise<CampaignCreationResponse> {
    try {
      const { name, goal, urls } = createCampaignDto;
      const saveCampaignToCoreDbRes = await this.campaignRepository.createCampaign({ name, goal });
      const campaignId = saveCampaignToCoreDbRes.id;
      const scrappingServiceResponse = await axios.post('http://127.0.0.1:5003/scrape', {
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
}
