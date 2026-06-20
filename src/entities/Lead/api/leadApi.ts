import { baseApi } from '@/shared/api';
import type { Lead, LeadStatus } from '../model/types';

export const leadApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLeads: builder.query<{ leads: Lead[] }, void>({
      query: () => '/leads',
      providesTags: ['Leads'],
    }),
    updateLeadStatus: builder.mutation<{ ok: boolean }, { id: string; status: LeadStatus }>({
      query: ({ id, status }) => ({
        url: '/leads',
        method: 'PATCH',
        body: { id, status },
      }),
      // Optimistic update — UI меняется сразу, не ждёт ответа Notion
      async onQueryStarted({ id, status }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          leadApi.util.updateQueryData('getLeads', undefined, (draft) => {
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

export const { useGetLeadsQuery, useUpdateLeadStatusMutation } = leadApi;
