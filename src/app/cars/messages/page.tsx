'use client';

import { useMemo } from 'react';
import { useGetCarsLeadsQuery } from '@/entities/Lead';
import { MessagesScreen, leadToContact } from '@/widgets/MessagesScreen';

export default function CarsMessagesPage() {
  const q = useGetCarsLeadsQuery(undefined, { pollingInterval: 60_000 });
  const buyers = useMemo(() => (q.data?.leads ?? []).map(leadToContact), [q.data]);

  return (
    <MessagesScreen
      sectionName="Машины"
      backHref="/cars"
      buyers={buyers}
      sellers={[]}
      isLoading={q.isLoading}
      isError={q.isError}
    />
  );
}
