import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import i18n from '../../i18n';
import { baseUrl, ProviderTags } from '../constants';
import { RootState } from '../store';
import { CsrfResponse } from './usersApiSlice';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl,
    credentials: 'include',
    prepareHeaders: (headers, api) => {
      const state = api.getState() as RootState;
      const csrfQueryResponse = state.api?.queries?.['getCsrf(null)']?.data as CsrfResponse;
      const csrfTokenFromState = csrfQueryResponse?.token;

      headers.set('Accept-Language', i18n.language);

      // Get the CSRF token from the Redux store
      if (csrfTokenFromState) headers.set('X-CSRF-Token', csrfTokenFromState);

      return headers;
    },
    paramsSerializer(params) {
      return Object.keys(params)
        .map((key) => {
          if (key === 's') {
            return `s=${encodeURIComponent(params[key])}`;
          }

          if (key === 'join') {
            return params[key].map((j: string) => `join=${encodeURIComponent(j)}`).join('&');
          }

          // Custom param used on Dashboard
          if (key === 'campaignIds') {
            return params[key]?.map((j: string) => `campaignIds=${encodeURIComponent(j)}`).join('&');
          }

          // Custom param used on Campaign/:id(AddLeads)
          if (key === 'excludedCampaignIds') {
            if (Array.isArray(params[key])) {
              return params[key].map((j: string) => `excludedCampaignIds=${encodeURIComponent(j)}`).join('&');
            }

            return `excludedCampaignIds=${params[key]}`;
          }

          // Custom param used on CampaignBuilder leads/:leadsId
          if (key === 'leadsId') {
            return params[key].map((j: string) => `leadsId=${encodeURIComponent(j)}`).join('&');
          }

          return `${key}=${encodeURIComponent(params[key])}`;
        })
        .join('&');
    }
  }),
  tagTypes: Object.values(ProviderTags),
  endpoints: () => ({})
});
