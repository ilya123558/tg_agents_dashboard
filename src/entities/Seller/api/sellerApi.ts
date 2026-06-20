import { baseApi } from '@/shared/api';
import type { Seller, SellerStatus } from '../model/types';

export const sellerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSellers: builder.query<{ sellers: Seller[] }, void>({
      query: () => '/sellers',
      providesTags: ['Sellers'],
    }),
    updateSellerStatus: builder.mutation<{ ok: boolean }, { id: string; status: SellerStatus }>({
      query: ({ id, status }) => ({
        url: '/sellers',
        method: 'PATCH',
        body: { id, status },
      }),
      async onQueryStarted({ id, status }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          sellerApi.util.updateQueryData('getSellers', undefined, (draft) => {
            const seller = draft.sellers.find((s) => s.id === id);
            if (seller) seller.status = status;
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

export const { useGetSellersQuery, useUpdateSellerStatusMutation } = sellerApi;
