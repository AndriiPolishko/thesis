import { Body, Controller, Post } from "@nestjs/common";

import { LeadService } from "./lead.service";

interface CreateLeadBody {
  email: string;
  links: string[];
}

@Controller("lead")
export class LeadController {
  constructor(
    private readonly leadService: LeadService
  ) {}

  @Post('create')
  async createLead(@Body() body: CreateLeadBody) {    
    const { email, links } = body;
    
    await this.leadService.createLead({ email, links });
  }
}