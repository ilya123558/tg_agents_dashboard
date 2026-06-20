import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ sellers: [] });
}

export async function PATCH() {
  return NextResponse.json({ ok: false }, { status: 404 });
}
