import { NextResponse } from 'next/server';
import QUOTES from '@/lib/ataturk-data';

export async function GET() {
  try {
    const now = Date.now();
    const hourIndex = Math.floor(now / 1000 / 3600) % QUOTES.length;
    const quote = QUOTES[hourIndex];
    return NextResponse.json({ quote, hourIndex });
  } catch (err) {
    return NextResponse.json({ error: 'Atatürk sözleri bulunamadı' }, { status: 500 });
  }
}
