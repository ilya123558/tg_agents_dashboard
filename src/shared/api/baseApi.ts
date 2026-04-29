import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      // Add authorization token here if needed
      // const token = getToken();
      // if (token) {
      //   headers.set('Authorization', `Bearer ${token}`);
      // }
      return headers;
    },
  }),
  tagTypes: ['Users', 'Leads', 'Sellers'],
  endpoints: () => ({}),
});
