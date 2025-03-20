import { Injectable } from "@nestjs/common";
import { Logger } from "@nestjs/common";

import { LeadRepository } from "./lead.repository";

interface GetLeadsParams {
  page: number;
  size: number;
}

@Injectable()
export class LeadService {
  private readonly logger = new Logger(LeadService.name);
  constructor(
    private readonly leadRepository: LeadRepository
  ) {}

  public async createLead(params: {email: string, firstName?: string, lastName?: string}) {
    const { email, firstName, lastName } = params;

    this.logger.log(`Creating lead with email: ${email} and name: ${firstName} ${lastName}`);

    await this.leadRepository.createLead({ email, firstName, lastName });
  }

  public async getLeads(params: GetLeadsParams) {
    const { page, size } = params;

    this.logger.log(`Getting leads for page: ${page} and size: ${size}`);

    return this.leadRepository.getLeads(page, size);
  }

  public async getTotalPages(pageSize: number) {
    const totalLeads = await this.leadRepository.getTotalLeads();
    const totalPages = Math.ceil(totalLeads / pageSize);

    return totalPages;
  }
}