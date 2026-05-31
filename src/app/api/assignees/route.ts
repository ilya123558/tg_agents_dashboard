import { NextRequest, NextResponse } from 'next/server';
import { sbSelect, sbUpsert, sbDelete, normalizeUsername, type DbAssignee } from '@/shared/lib/supabase-server';

/**
 * GET /api/assignees
 * → { assignees: { [author_username]: 'alexander' | 'anton' } }
 */
export async function GET() {
  try {
    const rows = await sbSelect<DbAssignee>('assignees', 'select=author_username,manager_id');
    const map: Record<string, string> = {};
    for (const r of rows) {
      if (r.manager_id) map[r.author_username] = r.manager_id;
    }
    return NextResponse.json({ assignees: map });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

/**
 * POST /api/assignees
 * Body: { author: string, managerId: string | null }
 * Если managerId === null — снять назначение.
 */
export async function POST(req: NextRequest) {
  let body: { author?: string; managerId?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }

  const author = normalizeUsername(body.author);
  if (!author) {
    return NextResponse.json({ error: 'author required' }, { status: 400 });
  }

  try {
    if (body.managerId == null) {
      await sbDelete('assignees', `author_username=eq.${encodeURIComponent(author)}`);
    } else {
      await sbUpsert('assignees', {
        author_username: author,
        manager_id: body.managerId,
        updated_at: new Date().toISOString(),
      }, 'author_username');
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
