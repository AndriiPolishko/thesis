import axios from "axios";

interface CampaignCreationData {
  campaignName: string;
  campaignDescription: string;
  splittedLinks: string[];
}

interface GetCampaignsParams {
  page: number;
  size: number;
}

const baseUrl = 'http://localhost:8001'
export const campaignService = {
  createCampaign: async (params: CampaignCreationData) => {
    const campaignCreateUrl = `${baseUrl}/campaign/create`
    const { campaignName, campaignDescription, splittedLinks } = params;
    const response = await axios.post(campaignCreateUrl, {
      name: campaignName,
      goal: campaignDescription,
      urls: splittedLinks,
    });
    return response.data; // React Query prefers returning data only
  },
  getCampaigns: async (params: GetCampaignsParams) => {
    const getCampaignsUrl = `${baseUrl}/campaign`
    const { page, size } = params;
    const response = await axios.get(getCampaignsUrl, {
      params: {
        page,
        size,
      },
    });

    return response.data; // React Query prefers returning data only
  }
}

