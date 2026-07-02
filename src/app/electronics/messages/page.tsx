'use client';

import { useMemo } from 'react';
import { useGetLeadsQuery } from '@/entities/Lead';
import { useGetSellersQuery } from '@/entities/Seller';
import { MessagesScreen, leadToContact, sellerToContact } from '@/widgets/MessagesScreen';

export default function MessagesPage() {
  const leadsQ = useGetLeadsQuery(undefined, { pollingInterval: 60_000 });
  const sellersQ = useGetSellersQuery(undefined, { pollingInterval: 60_000 });

  const buyers = useMemo(() => (leadsQ.data?.leads ?? []).map(leadToContact), [leadsQ.data]);
  const sellers = useMemo(() => (sellersQ.data?.sellers ?? []).map(sellerToContact), [sellersQ.data]);

  return (
    <MessagesScreen
      sectionName="Электроника"
      backHref="/electronics"
      buyers={buyers}
      sellers={sellers}
      isLoading={leadsQ.isLoading}
      isError={leadsQ.isError}
    />
  );
}
