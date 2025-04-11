import axios from "axios";

import { baseApiUrl } from "../globals";

export const eventService = {
  getEvents: async (campaignId: number) => {
    const getEventsUrl = `${baseApiUrl}/event`;
    const response = await axios.get(getEventsUrl, {
      withCredentials: true,
      params: {
        campaignId,
      },
    });

    return response.data;
  },
}