import { NextRequest, NextResponse } from 'next/server';
import { sbSelect, normalizeUsername, type DbMessage } from '@/shared/lib/supabase-server';

/**
 * GET /api/chat/messages?author=username
 * → возвращает всю историю переписки с этим пользователем, отсортировано по времени.
 */
export async function GET(req: NextRequest) {
  const author = normalizeUsername(req.nextUrl.searchParams.get('author'));
  if (!author) {
    return NextResponse.json({ error: 'author param required' }, { status: 400 });
  }
  try {
    const rows = await sbSelect<DbMessage>(
      'messages',
      `author_username=eq.${encodeURIComponent(author)}&order=created_at.asc`,
    );
    return NextResponse.json({ messages: rows });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
