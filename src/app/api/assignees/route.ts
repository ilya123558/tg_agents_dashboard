import { NextRequest, NextResponse } from 'next/server';
import { sbSelect, sbUpsert, sbDelete, normalizeUsername, normalizeVertical, type DbAssignee } from '@/shared/lib/supabase-server';

/**
 * GET /api/assignees?vertical=electronics|clothing
 * → { assignees: { [author_username]: 'alexander' | 'anton' } }
 */
export async function GET(req: NextRequest) {
  const vertical = normalizeVertical(req.nextUrl.searchParams.get('vertical'));
  try {
    const rows = await sbSelect<DbAssignee>(
      'assignees',
      `vertical=eq.${vertical}&select=author_username,manager_id`,
    );
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
 * Body: { author: string, managerId: string | null, vertical?: 'electronics'|'clothing' }
 * Если managerId === null — снять назначение.
 */
export async function POST(req: NextRequest) {
  let body: { author?: string; managerId?: string | null; vertical?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }

  const author = normalizeUsername(body.author);
  const vertical = normalizeVertical(body.vertical);
  if (!author) {
    return NextResponse.json({ error: 'author required' }, { status: 400 });
  }

  try {
    if (body.managerId == null) {
      await sbDelete(
        'assignees',
        `author_username=eq.${encodeURIComponent(author)}&vertical=eq.${vertical}`,
      );
    } else {
      await sbUpsert('assignees', {
        author_username: author,
        vertical,
        manager_id: body.managerId,
        updated_at: new Date().toISOString(),
      }, 'author_username,vertical');
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
