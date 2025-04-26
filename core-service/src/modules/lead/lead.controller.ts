import { Body, Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";

import { LeadService } from "./lead.service";
import { Lead
  
 } from "./lead.types";
import { AuthGuard } from "@nestjs/passport";
interface CreateLeadBody {
  email: string;
  firstName?: string;
  lastName?: string;
}

@Controller("lead")
export class LeadController {
  constructor(
    private readonly leadService: LeadService
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async createLead(@Req() req, @Body() body: CreateLeadBody): Promise<void> {
    const userId = req?.user?.id;
    const { email, firstName, lastName } = body;
    
    await this.leadService.createLead({ email, firstName, lastName, userId });
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getLeads(@Req() req, @Query('page') page: number, @Query('size') size: number, @Query('campaignId') campaignId?: number): Promise<{ leads: Lead[], totalPages: number }> {
    const userId: number = req?.user?.id;
    const leads: Lead[] = await this.leadService.getLeads({ page, size, userId, campaignId });
    const totalPages = await this.leadService.getTotalPages({pageSize: size, userId});

    return {
      leads,
      totalPages
    }
  }
}