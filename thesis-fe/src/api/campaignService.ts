import axios from "axios";

interface CampaignCreationData {
  campaignName: string;
  campaignDescription: string;
  splittedLinks: string[];
}

const API_BASE_URL = 'http://localhost:8001/campaign/create'
export const campaignService = {
  createCampaign: async (params: CampaignCreationData) => {
    const { campaignName, campaignDescription, splittedLinks } = params;
    const response = await axios.post(`${API_BASE_URL}`, {
      name: campaignName,
      goal: campaignDescription,
      urls: splittedLinks,
    });
    return response.data; // React Query prefers returning data only
  },
};

