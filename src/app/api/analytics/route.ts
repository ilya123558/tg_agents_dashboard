import { NextRequest, NextResponse } from 'next/server';
import { sbSelect, normalizeVertical, type DbMessage, type DbAssignee, type DbConversation } from '@/shared/lib/supabase-server';

/**
 * GET /api/analytics
 *
 * Возвращает агрегированную статистику по чату для страницы /electronics/analytics:
 *   - totals (sent today/week/month/all, replies, reply_rate)
 *   - per_manager [{ id, sent, replied, assigned }]
 *   - timeseries [{ date, sent, replied }] за последние 14 дней
 *   - top_groups (топ диалогов по in_count)
 *
 * Никаких внешних зависимостей — только Supabase REST через service_role.
 */

export const dynamic = 'force-dynamic';

interface AnalyticsResponse {
  totals: {
    sent_today: number;
    sent_week: number;
    sent_month: number;
    sent_all: number;
    replies_all: number;
    reply_rate: number; // 0..1
    conversations: number;
    assigned: number;
  };
  per_manager: {
    id: string;
    sent: number;
    replied: number;
    assigned: number;
  }[];
  timeseries: {
    date: string; // 'YYYY-MM-DD'
    sent: number;
    replied: number;
  }[];
  top_responders: {
    author_username: string;
    in_count: number;
    out_count: number;
    last_at: string;
    assignee: string | null;
  }[];
}

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const vertical = normalizeVertical(req.nextUrl.searchParams.get('vertical'));
  try {
    // Тянем все сообщения за 35 дней — этого хватает на месячные метрики + 14-дневный график
    const cutoff = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString();
    const [messages, assignees, conversations] = await Promise.all([
      sbSelect<DbMessage>(
        'messages',
        `vertical=eq.${vertical}&created_at=gte.${encodeURIComponent(cutoff)}&select=id,direction,sent_by,status,created_at,author_username&order=created_at.desc&limit=10000`,
      ),
      sbSelect<DbAssignee>('assignees', `vertical=eq.${vertical}&select=author_username,manager_id`),
      sbSelect<DbConversation>('conversations', `vertical=eq.${vertical}&order=last_message_at.desc&limit=500`),
    ]);

    // Считаем «всё за всё время» отдельным быстрым селектом по count — Supabase REST
    // умеет head=true&count=exact, но это лишний хоп. Для агентского кейса хватит
    // данных за 35 дней — обычно это и есть всё.
    const sentMsgs = messages.filter((m) => m.direction === 'out' && m.status === 'sent');
    const inMsgs   = messages.filter((m) => m.direction === 'in');

    const today = startOfDay(new Date()).getTime();
    const weekAgo  = today - 6  * 24 * 60 * 60 * 1000;
    const monthAgo = today - 29 * 24 * 60 * 60 * 1000;

    const sentToday = sentMsgs.filter((m) => new Date(m.created_at).getTime() >= today).length;
    const sentWeek  = sentMsgs.filter((m) => new Date(m.created_at).getTime() >= weekAgo).length;
    const sentMonth = sentMsgs.filter((m) => new Date(m.created_at).getTime() >= monthAgo).length;

    // Reply rate: % уникальных собеседников, ответивших среди тех, кому отправили
    const sentAuthors    = new Set(sentMsgs.map((m) => m.author_username));
    const repliedAuthors = new Set(inMsgs.map((m) => m.author_username));
    const respondedSentAuthors = new Set(
      [...sentAuthors].filter((a) => repliedAuthors.has(a)),
    );
    const replyRate = sentAuthors.size > 0 ? respondedSentAuthors.size / sentAuthors.size : 0;

    // Per-manager статистика
    const assigneeMap = new Map<string, string>(); // author → manager
    for (const a of assignees) if (a.manager_id) assigneeMap.set(a.author_username, a.manager_id);

    const managerStats: Record<string, { sent: number; replied: number; assigned: number }> = {};
    const ensureManager = (id: string) => {
      if (!managerStats[id]) managerStats[id] = { sent: 0, replied: 0, assigned: 0 };
      return managerStats[id];
    };
    for (const m of sentMsgs) {
      if (m.sent_by && m.sent_by !== 'agent') ensureManager(m.sent_by).sent += 1;
    }
    for (const a of assigneeMap.values()) ensureManager(a).assigned += 1;
    for (const author of repliedAuthors) {
      const mgr = assigneeMap.get(author);
      if (mgr) ensureManager(mgr).replied += 1;
    }
    const per_manager = Object.entries(managerStats).map(([id, v]) => ({ id, ...v }));

    // Timeseries: 14 дней назад → сегодня
    const days: { date: string; sent: number; replied: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = startOfDay(new Date(Date.now() - i * 24 * 60 * 60 * 1000));
      days.push({ date: isoDay(d), sent: 0, replied: 0 });
    }
    const dayIdx: Record<string, number> = {};
    days.forEach((d, i) => { dayIdx[d.date] = i; });

    for (const m of sentMsgs) {
      const k = m.created_at.slice(0, 10);
      const i = dayIdx[k];
      if (i !== undefined) days[i].sent += 1;
    }
    for (const m of inMsgs) {
      const k = m.created_at.slice(0, 10);
      const i = dayIdx[k];
      if (i !== undefined) days[i].replied += 1;
    }

    // Top responders — топ диалогов по входящим
    const top_responders = [...conversations]
      .filter((c) => c.in_count > 0)
      .sort((a, b) => b.in_count - a.in_count)
      .slice(0, 8)
      .map((c) => ({
        author_username: c.author_username,
        in_count: c.in_count,
        out_count: c.out_count,
        last_at: c.last_message_at,
        assignee: c.assignee,
      }));

    const body: AnalyticsResponse = {
      totals: {
        sent_today: sentToday,
        sent_week: sentWeek,
        sent_month: sentMonth,
        sent_all: sentMsgs.length,
        replies_all: inMsgs.length,
        reply_rate: replyRate,
        conversations: conversations.length,
        assigned: assigneeMap.size,
      },
      per_manager,
      timeseries: days,
      top_responders,
    };

    return NextResponse.json(body);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
