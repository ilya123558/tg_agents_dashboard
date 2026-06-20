import { baseApi } from '@/shared/api';
import type { Lead, LeadStatus } from '../model/types';

export const carsLeadApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCarsLeads: builder.query<{ leads: Lead[] }, void>({
      query: () => '/cars-leads',
      providesTags: ['CarsLeads'],
    }),
    updateCarsLeadStatus: builder.mutation<{ ok: boolean }, { id: string; status: LeadStatus }>({
      query: ({ id, status }) => ({
        url: '/cars-leads',
        method: 'PATCH',
        body: { id, status },
      }),
      async onQueryStarted({ id, status }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          carsLeadApi.util.updateQueryData('getCarsLeads', undefined, (draft) => {
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

export const { useGetCarsLeadsQuery, useUpdateCarsLeadStatusMutation } = carsLeadApi;
