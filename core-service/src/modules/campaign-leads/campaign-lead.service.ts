import { Injectable } from "@nestjs/common";
import { Logger } from "@nestjs/common";

import { CampaignLeadRepository } from "./campaign-lead.repository";
import { AddCampaignLeadsParams } from "./campaign-lead.types";

@Injectable()
export class CampaignLeadService {
  private readonly logger = new Logger(CampaignLeadService.name);

  constructor(
    private readonly campaignLeadRepository: CampaignLeadRepository
  ) {}

  public async getCampaignLeads(campaignId: number) {
    const campaignLeads = await this.campaignLeadRepository.getCampaignLeads(campaignId);

    return campaignLeads;
  }

  public async addCampaignLeads(params: AddCampaignLeadsParams) {
    const { userId, campaignId, leadIds } = params;

    try {
      for (const leadId of leadIds) {
        try {
          const existingCampaignLead = await this.campaignLeadRepository.findByCampaignIdAndLeadId(campaignId, leadId);

          if (existingCampaignLead) {
            this.logger.error(`Campaign lead already exists for campaignId: ${campaignId} and leadId: ${leadId}`);
    
            continue;
          }
    
          const newCampaignLead = await this.campaignLeadRepository.addCampaignLead({ userId, campaignId, leadId });
    
          this.logger.log(`Success on creating new campaign lead ${newCampaignLead.id} added for campaignId: ${campaignId} and leadId: ${leadId}`);
        } catch (error) {
          this.logger.error(`Error on creating new campaign lead for campaignId: ${campaignId} and leadId: ${leadId}`, error);
        }
      }

      return { status: 'ok' };
    } catch (error) {
      this.logger.error(`Error on creating new campaign lead for campaignId: ${campaignId}`, leadIds, error);

      return {status: 'error'};
    }
  }

  public async removeCampaignLead({ userId, campaignLeadId }: { userId: number; campaignLeadId: number }) {
    try {
      const result = await this.campaignLeadRepository.removeCampaignLead(campaignLeadId);

      return result;
    } catch (error) {
      this.logger.error(`Error on removing campaign lead ${campaignLeadId}`, error);

      return { status: 'error' };
    }
  }
}