'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ClothingSellerRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/clothing'); }, [router]);
  return null;
}
