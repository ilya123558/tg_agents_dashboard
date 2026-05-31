import { NextResponse } from 'next/server';
import { sbSelect, type DbConversation } from '@/shared/lib/supabase-server';

/**
 * GET /api/chat/conversations
 * → агрегированный список диалогов из VIEW public.conversations:
 *   автор + последнее сообщение + кол-во + assignee.
 */
export async function GET() {
  try {
    const rows = await sbSelect<DbConversation>(
      'conversations',
      'order=last_message_at.desc&limit=500',
    );
    return NextResponse.json({ conversations: rows });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
