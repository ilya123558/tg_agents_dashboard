'use client';

import { useMemo } from 'react';
import { useGetStroyLeadsQuery } from '@/entities/Lead';
import { MessagesScreen, leadToContact } from '@/widgets/MessagesScreen';

export default function StroyMessagesPage() {
  const q = useGetStroyLeadsQuery(undefined, { pollingInterval: 60_000 });
  const buyers = useMemo(() => (q.data?.leads ?? []).map(leadToContact), [q.data]);

  return (
    <MessagesScreen
      sectionName="Стройка"
      backHref="/stroy"
      buyers={buyers}
      sellers={[]}
      isLoading={q.isLoading}
      isError={q.isError}
    />
  );
}
