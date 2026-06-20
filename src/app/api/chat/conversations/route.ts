import { NextRequest, NextResponse } from 'next/server';
import { sbSelect, normalizeVertical, type DbConversation } from '@/shared/lib/supabase-server';

/**
 * GET /api/chat/conversations?vertical=electronics|clothing
 * → агрегированный список диалогов для указанной вертикали.
 */
export async function GET(req: NextRequest) {
  const vertical = normalizeVertical(req.nextUrl.searchParams.get('vertical'));
  try {
    const rows = await sbSelect<DbConversation>(
      'conversations',
      `vertical=eq.${vertical}&order=last_message_at.desc&limit=500`,
    );
    return NextResponse.json({ conversations: rows });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
