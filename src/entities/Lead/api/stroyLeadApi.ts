import { baseApi } from '@/shared/api';
import type { Lead, LeadStatus } from '../model/types';

export const stroyLeadApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStroyLeads: builder.query<{ leads: Lead[] }, void>({
      query: () => '/stroy-leads',
      providesTags: ['StroyLeads'],
    }),
    updateStroyLeadStatus: builder.mutation<{ ok: boolean }, { id: string; status: LeadStatus }>({
      query: ({ id, status }) => ({
        url: '/stroy-leads',
        method: 'PATCH',
        body: { id, status },
      }),
      async onQueryStarted({ id, status }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          stroyLeadApi.util.updateQueryData('getStroyLeads', undefined, (draft) => {
            const lead = draft.leads.find((l) => l.id === id);
            if (lead) lead.status = status;
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),
  }),
});

export const { useGetStroyLeadsQuery, useUpdateStroyLeadStatusMutation } = stroyLeadApi;
