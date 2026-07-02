'use client';

import { useMemo } from 'react';
import { useGetClothingLeadsQuery } from '@/entities/Lead';
import { MessagesScreen, leadToContact } from '@/widgets/MessagesScreen';

export default function ClothingMessagesPage() {
  const q = useGetClothingLeadsQuery(undefined, { pollingInterval: 60_000 });
  const buyers = useMemo(() => (q.data?.leads ?? []).map(leadToContact), [q.data]);

  return (
    <MessagesScreen
      sectionName="Одежда"
      backHref="/clothing"
      buyers={buyers}
      sellers={[]}
      isLoading={q.isLoading}
      isError={q.isError}
    />
  );
}
