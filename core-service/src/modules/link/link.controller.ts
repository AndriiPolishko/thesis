import { Controller, Get, Inject, Request, UseGuards } from "@nestjs/common";

import { LinkService } from "./link.service";
import { AuthGuard } from "@nestjs/passport";

@Controller("link")
export class LinkController {

  constructor(
    @Inject(LinkService) private readonly linkService: LinkService
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('/:campaignId')
  async getCampaignLinks(@Request() req) {
    const { campaignId } = req.params;
    const campaignLinks = await this.linkService.getCampaignLinks(campaignId);
    
    return { links: campaignLinks };
  }
}