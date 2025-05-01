import axios from "axios";

import { baseApiUrl } from "../globals";

interface CampaignCreationData {
  campaignName: string;
  campaignDescription: string;
  splittedLinks: string[];
  campaignSystemPrompt: string;
}

interface GetCampaignsParams {
  page: number;
  size: number;
}

export enum CampaignStatus {
  Pending = 'pending',
  Active = 'active',
  Inactive = 'inactive',
}
export const campaignService = {
  createCampaign: async (params: CampaignCreationData) => {
    const campaignCreateUrl = `${baseApiUrl}/campaign/create`
    const { campaignName, campaignDescription, splittedLinks, campaignSystemPrompt } = params;
    const response = await axios.post(campaignCreateUrl, {
      name: campaignName,
      goal: campaignDescription,
      urls: splittedLinks,
      campaignSystemPrompt
    }, { withCredentials: true });

    return response.data;
  },
  // Refetch on activate of any campaign
  getCampaigns: async (params: GetCampaignsParams) => {
    const getCampaignsUrl = `${baseApiUrl}/campaign`
    const { page, size } = params;
    const response = await axios.get(getCampaignsUrl, {
      withCredentials: true,
      params: {
        page,
        size,
      },
    });

    return response.data;
  },
  getCampaignById: async (campaignId: number) => {
    const getCampaignByIdUrl = `${baseApiUrl}/campaign/${campaignId}`
    const response = await axios.get(getCampaignByIdUrl, { withCredentials: true });

    return response.data;
  },
  changeCampaignStatus: async (params: { campaignId: number, newStatus: CampaignStatus }) => {
    const { campaignId, newStatus } = params;
    const activateCampaignUrl = `${baseApiUrl}/campaign/change-status/${campaignId}`
    const response = await axios.patch(activateCampaignUrl, {
      newStatus
    }, { withCredentials: true });

    // Returns the status 
    return response.data;
  },
  removeCampaign: async (campaignId: number) => {
    const removeCampaignUrl = `${baseApiUrl}/campaign/${campaignId}`
    const response = await axios.delete(removeCampaignUrl, { withCredentials: true });

    return response.data;
  },
}

