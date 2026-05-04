import { NextResponse } from 'next/server';

const NOTION_API_KEY     = process.env.NOTION_API_KEY!;
const NOTION_DATABASE_ID = process.env.NOTION_CLOTHING_DATABASE_ID!;

async function fetchAll() {
  const results: any[] = [];
  let cursor: string | undefined;

  do {
    const body: Record<string, any> = {
      page_size: 100,
      sorts: [{ property: 'Дата', direction: 'descending' }],
    };
    if (cursor) body.start_cursor = cursor;

    const res = await fetch(
      `https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        ...(cursor ? {} : { next: { revalidate: 60 } }),
      }
    );

    const data = await res.json();
    results.push(...(data.results ?? []));
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  return results;
}

export async function GET() {
  try {
    const pages = await fetchAll();

    const leads = pages.map((page: any) => {
      const p = page.properties;
      return {
        id:       page.id,
        text:     p['Текст']?.title?.[0]?.plain_text ?? '',
        group:    p['Группа']?.rich_text?.[0]?.plain_text ?? '',
        date:     p['Дата']?.date?.start ?? null,
        link:     p['Ссылка на сообщение']?.url ?? null,
        author:   p['Автор']?.url ?? null,
        comment:  p['Комментарий AI']?.rich_text?.[0]?.plain_text ?? '',
        status:   p['Статус']?.select?.name ?? 'новый',
        category: p['Категория']?.select?.name ?? '',
        products: p['Товары']?.rich_text?.[0]?.plain_text ?? '',
      };
    });

    return NextResponse.json({ leads });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch clothing leads' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, status } = await req.json();
    const res = await fetch(`https://api.notion.com/v1/pages/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ properties: { Статус: { select: { name: status } } } }),
    });
    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err }, { status: res.status });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
