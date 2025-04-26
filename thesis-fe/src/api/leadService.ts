import axios from 'axios';

import { baseApiUrl } from '../globals';

interface LeadCreationData {
  firstName: string;
  lastName: string;
  email: string;
}

interface GetLeadsParams {
  page: number;
  size: number;
  campaignId?: number;
}

export const leadService = {
  createLead: async (params: LeadCreationData) => {
    const leadCreationUrl = `${baseApiUrl}/lead`;
    const { firstName, lastName, email } = params;
    const response = await axios.post(leadCreationUrl, {
      firstName,
      lastName,
      email,
    }, 
    { withCredentials: true });

    return response.data;
  },
  getLeads: async (params: GetLeadsParams) => {
    const getLeadsUrl = `${baseApiUrl}/lead`
    const { page, size, campaignId } = params;
    const response = await axios.get(getLeadsUrl, {
      withCredentials: true,
      params: {
        page,
        size,
        campaignId
      },
    });

    return response.data;
  }
}