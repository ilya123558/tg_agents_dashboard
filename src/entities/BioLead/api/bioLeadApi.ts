import { baseApi } from '@/shared/api/baseApi';
import type { BioLead, BioLeadStatus } from '../model/types';

interface BioLeadsResponse {
  leads: BioLead[];
}

export const bioLeadApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getBioLeads: build.query<BioLeadsResponse, void>({
      query: () => '/bio-leads',
      providesTags: ['BioLeads'],
    }),
    updateBioLeadStatus: build.mutation<void, { id: string; status: BioLeadStatus }>({
      query: ({ id, status }) => ({
        url: '/bio-leads',
        method: 'PATCH',
        body: { id, status },
      }),
      async onQueryStarted({ id, status }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          bioLeadApi.util.updateQueryData('getBioLeads', undefined, (draft) => {
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

export const { useGetBioLeadsQuery, useUpdateBioLeadStatusMutation } = bioLeadApi;
