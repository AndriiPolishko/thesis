import axios from "axios";

import { baseApiUrl } from "../globals";

interface CampaignLeadCreationData {
  campaignId: number;
  leadIds: number[];
}

export const campaignLeadsService = {
  getCampaignLeads: async (campaignId: number) => {
    const getCampaignLeadsUrl = `${baseApiUrl}/campaign-lead/${campaignId}`;
    const response = await axios.get(getCampaignLeadsUrl);

    return response.data;
  },
  addCampaignLeads: async (params: CampaignLeadCreationData) => {
    const campaignLeadCreateUrl = `${baseApiUrl}/campaign-lead`;
    const { campaignId, leadIds } = params;
    const response = await axios.post(campaignLeadCreateUrl, {
      campaignId,
      leadIds }, 
      { withCredentials: true }
    );

    return response.data
  },
  removeCampaignLead: async (campaignLeadId: number) => {
    const removeCampaignLeadUrl = `${baseApiUrl}/campaign-lead/${campaignLeadId}`;
    const response = await axios.delete(removeCampaignLeadUrl, { withCredentials: true });

    return response.data;
  },
};
