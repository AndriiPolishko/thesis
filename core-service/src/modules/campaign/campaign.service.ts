import { Inject, Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { Kafka } from 'kafkajs';
import { ConfigService } from '@nestjs/config';

import { Campaign, CampaignCreationResponse, CampaignCreationStatus, CreateCampaignDto } from "./campaign.dto";
import { CampaignRepository } from "./campaign.repository";
import { LinkRepository } from "../link/link.repository";

@Injectable()
export class CampaignService implements OnModuleInit, OnModuleDestroy {
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
      
      for (const url of urls) {
        // TODO: Handle errors
        const createLinkRes = await this.linkRepository.createLink({ url, campaignId });
        const createdLinkId = createLinkRes.id;

        const message = JSON.stringify({ id: createdLinkId, url, campaignId });

        await this.urlProducer.send({
          topic: 'urls',
          messages: [{ value: message }],
        });

        console.log('Message sent to Kafka');
      }

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
}
