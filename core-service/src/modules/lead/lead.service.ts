import { Injectable } from "@nestjs/common";

import { LeadRepository } from "./lead.repository";

@Injectable()
export class LeadService {
  constructor(
    private readonly leadRepository: LeadRepository
  ) {}

  public async createLead(params: {email: string, links: string[]}) {
    const { email, links } = params;

    console.log(`Creating lead with email: ${email} and links: ${links}`);

    await this.leadRepository.createLead({ email, links });
  }
}