import axios from "axios";

import { baseApiUrl } from "../globals";

interface CampaignLeadCreationData {
  campaignId: number;
  leadId: number;
}

export const campaignLeadsService = {
  getCampaignLeads: async (campaignId: number) => {
    const getCampaignLeadsUrl = `${baseApiUrl}/campaign-lead/${campaignId}`;
    const response = await axios.get(getCampaignLeadsUrl);

    return response.data;
  },
  createCampaignLead: async (params: CampaignLeadCreationData) => {
    const campaignLeadCreateUrl = `${baseApiUrl}/campaign-lead/lead`;
    const { campaignId, leadId } = params;
    const response = await axios.post(campaignLeadCreateUrl, {
      campaignId,
      leadId
    });

    return response.data
  }
};
