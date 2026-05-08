import { baseApi } from '@/shared/api/baseApi';
import type { EcoLead, EcoLeadStatus } from '../model/types';

interface EcoLeadsResponse {
  leads: EcoLead[];
}

export const ecoLeadApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getEcoLeads: build.query<EcoLeadsResponse, void>({
      query: () => '/ecopulse-leads',
      providesTags: ['EcoLeads'],
    }),
    updateEcoLeadStatus: build.mutation<void, { id: string; status: EcoLeadStatus }>({
      query: ({ id, status }) => ({
        url: '/ecopulse-leads',
        method: 'PATCH',
        body: { id, status },
      }),
      async onQueryStarted({ id, status }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          ecoLeadApi.util.updateQueryData('getEcoLeads', undefined, (draft) => {
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

export const { useGetEcoLeadsQuery, useUpdateEcoLeadStatusMutation } = ecoLeadApi;
