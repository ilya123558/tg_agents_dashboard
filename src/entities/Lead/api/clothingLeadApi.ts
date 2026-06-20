import { baseApi } from '@/shared/api';
import type { Lead, LeadStatus } from '../model/types';

export const clothingLeadApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getClothingLeads: builder.query<{ leads: Lead[] }, void>({
      query: () => '/clothing-leads',
      providesTags: ['ClothingLeads'],
    }),
    updateClothingLeadStatus: builder.mutation<{ ok: boolean }, { id: string; status: LeadStatus }>({
      query: ({ id, status }) => ({
        url: '/clothing-leads',
        method: 'PATCH',
        body: { id, status },
      }),
      async onQueryStarted({ id, status }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          clothingLeadApi.util.updateQueryData('getClothingLeads', undefined, (draft) => {
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

export const { useGetClothingLeadsQuery, useUpdateClothingLeadStatusMutation } = clothingLeadApi;
