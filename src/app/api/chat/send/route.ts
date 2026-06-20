import { NextRequest, NextResponse } from 'next/server';
import { sbInsert, normalizeUsername, normalizeVertical, type DbMessage } from '@/shared/lib/supabase-server';

/**
 * POST /api/chat/send
 * Body: { author: string, text: string, sentBy?: string, vertical?: 'electronics'|'clothing' }
 *
 * Вставляет в Supabase сообщение со status='pending' direction='out'.
 * Python воркер (chat_bridge.py) подхватит и реально отправит в Telegram.
 */
export async function POST(req: NextRequest) {
  let body: { author?: string; text?: string; sentBy?: string; vertical?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }

  const author = normalizeUsername(body.author);
  const text = (body.text ?? '').trim();
  const sentBy = body.sentBy ?? 'agent';
  const vertical = normalizeVertical(body.vertical);

  if (!author) {
    return NextResponse.json({ error: 'author required' }, { status: 400 });
  }
  if (!text) {
    return NextResponse.json({ error: 'text required' }, { status: 400 });
  }
  if (text.length > 4096) {
    return NextResponse.json({ error: 'text too long (max 4096)' }, { status: 400 });
  }

  try {
    const rows = await sbInsert<DbMessage>('messages', {
      author_username: author,
      vertical,
      direction: 'out',
      text,
      status: 'pending',
      sent_by: sentBy,
    });
    const message = rows[0] ?? null;
    return NextResponse.json({ message });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
