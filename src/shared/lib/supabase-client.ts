'use client';

import { createClient } from '@supabase/supabase-js';

/**
 * Клиентский Supabase — используется ТОЛЬКО для realtime подписок.
 * Запись и чтение всё ещё ходят через /api/* (там service_role).
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (typeof window !== 'undefined' && (!URL || !KEY)) {
  console.error('[supabase-client] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY не заданы');
}

export const supabase = createClient(URL ?? '', KEY ?? '', {
  realtime: {
    params: { eventsPerSecond: 5 },
  },
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
