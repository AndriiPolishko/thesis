import { Body, Controller, Get, Post, Query } from "@nestjs/common";

import { LeadService } from "./lead.service";

interface CreateLeadBody {
  email: string;
  firstName?: string;
  lastName?: string;
}

interface Lead {
  fist_name: string;
  last_name: string;
  email: string;
  status: string;
}

@Controller("lead")
export class LeadController {
  constructor(
    private readonly leadService: LeadService
  ) {}

  @Post()
  async createLead(@Body() body: CreateLeadBody): Promise<void> {
    const { email, firstName, lastName } = body;
    
    await this.leadService.createLead({ email, firstName, lastName });
  }

  @Get()
  async getLeads(@Query('page') page: number, @Query('size') size: number): Promise<{ leads: Lead[], totalPages: number }> {
    const leads: Lead[] = await this.leadService.getLeads({ page, size });
    const totalPages = await this.leadService.getTotalPages(size);

    return {
      leads,
      totalPages
    }
  }
}