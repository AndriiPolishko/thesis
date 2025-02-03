import { Controller, Post } from "@nestjs/common";

@Controller("campaign")
export class CampaignController {
  constructor() {}

  @Post('create')
  createCampaign(): string {
    return "createCampaign";
  }
}