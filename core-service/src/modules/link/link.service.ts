import { Inject, Injectable } from "@nestjs/common";

import { LinkRepository } from "./link.repository";

@Injectable()
export class LinkService {
  constructor(
    @Inject(LinkRepository) private readonly linkRepository: LinkRepository
  ) {}

  async getCampaignLinks(campaignId: number) {
    const campaignLinks = await this.linkRepository.getCampaignLinks(campaignId);

    return campaignLinks;
  }
}