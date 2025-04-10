import { Injectable } from "@nestjs/common";
import { Logger } from "@nestjs/common";

import { LeadRepository } from "./lead.repository";

interface GetLeadsParams {
  page: number;
  size: number;
  userId: number;
}

interface CreateLeadParams {
  email: string;
  firstName: string;
  lastName: string;
  userId: number;
}

interface GetTotalPagesParams {
  pageSize: number;
  userId: number;
}

@Injectable()
export class LeadService {
  private readonly logger = new Logger(LeadService.name);
  constructor(
    private readonly leadRepository: LeadRepository
  ) {}

  public async createLead(params: CreateLeadParams) {
    const { email, firstName, lastName, userId } = params;

    this.logger.log(`Creating lead for user ${userId} with email: ${email} and name: ${firstName} ${lastName}`);

    const existingLead = await this.leadRepository.findLeadByEmail({ email, userId });

    if (existingLead) {
      this.logger.log(`Lead with email ${email} already exists for user ${userId}`);
      
      throw new Error(`Lead with email ${email} already exists`);
    }

    await this.leadRepository.createLead(params);
  }

  public async getLeads(params: GetLeadsParams) {
    const { page, size, userId } = params;

    this.logger.log(`Getting leads for page: ${page} and size: ${size}`);

    return this.leadRepository.getLeads({page, size, userId});
  }

  public async getTotalPages(params: GetTotalPagesParams) {
    const { pageSize, userId } = params;
    const totalLeads = await this.leadRepository.getTotalLeads(userId);
    const totalPages = Math.ceil(totalLeads / pageSize);

    return totalPages;
  }
}