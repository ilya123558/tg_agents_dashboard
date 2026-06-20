import { NextRequest, NextResponse } from 'next/server';
import { sbSelect, normalizeUsername, normalizeVertical, type DbMessage } from '@/shared/lib/supabase-server';

/**
 * GET /api/chat/messages?author=username&vertical=electronics|clothing
 * → история переписки с пользователем в указанной вертикали.
 */
export async function GET(req: NextRequest) {
  const author = normalizeUsername(req.nextUrl.searchParams.get('author'));
  const vertical = normalizeVertical(req.nextUrl.searchParams.get('vertical'));
  if (!author) {
    return NextResponse.json({ error: 'author param required' }, { status: 400 });
  }
  try {
    const rows = await sbSelect<DbMessage>(
      'messages',
      `author_username=eq.${encodeURIComponent(author)}&vertical=eq.${vertical}&order=created_at.asc`,
    );
    return NextResponse.json({ messages: rows });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
