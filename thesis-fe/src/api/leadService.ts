import axios from 'axios';

interface LeadCreationData {
  firstName: string;
  lastName: string;
  email: string;
}

interface GetLeadsParams {
  page: number;
  size: number;
}

const baseUrl = 'http://localhost:8001';
export const leadService = {
  createLead: async (params: LeadCreationData) => {
    const leadCreationUrl = `${baseUrl}/lead`;
    const { firstName, lastName, email } = params;
    const response = await axios.post(leadCreationUrl, {
      firstName,
      lastName,
      email,
    });

    return response.data;
  },
  getLeads: async (params: GetLeadsParams) => {
    const getLeadsUrl = `${baseUrl}/lead`
    const { page, size } = params;
    const response = await axios.get(getLeadsUrl, {
      params: {
        page,
        size,
      },
    });

    return response.data; // React Query prefers returning data only
  }
}