import { NextResponse } from 'next/server';
import QURAN_VERSES from '@/lib/quran-data';

export async function GET() {
  try {
    const now = Date.now();
    const hourIndex = Math.floor(now / 1000 / 3600) % QURAN_VERSES.length;
    const verse = QURAN_VERSES[hourIndex];
    return NextResponse.json({ verse, hourIndex });
  } catch (err) {
    return NextResponse.json({ error: 'Kuran verisi bulunamadı' }, { status: 500 });
  }
}
