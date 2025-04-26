import axios from "axios";

import { baseApiUrl } from "../globals";

export const linkService = {
  getLinksByCampaignId: async (campaignId: number) => {
    const getLinksUrl = `${baseApiUrl}/link/${campaignId}`;
    const response = await axios.get(getLinksUrl, {
      withCredentials: true
    });

    return response.data;
  }
}