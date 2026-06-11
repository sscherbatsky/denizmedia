import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateWithLocalLLM, embedTextLocal } from "@/lib/ai/local";
import fs from 'fs/promises';
import path from 'path';
import util from 'util';
import { execFile } from 'child_process';
const execFileP = util.promisify(execFile);

function simpleResponder(input: string) {
  const t = input.trim().toLowerCase();
  const jokes = [
    'Neden bilgisayar denize girdi? Çünkü dalga geçiyordu!',
    'Bilgisayar neden aç kalmaz? Çünkü her zaman byte alır!',
    'Programcı neden doğada gezinmeyi sever? Çünkü ağaçlarda recursion var!' 
  ];
  const films = ['The Matrix', 'Inception', 'Interstellar', 'Ayla', 'G.O.R.A.'];
  const greetings = ['Merhaba! Nasıl yardımcı olabilirim?', 'Selam! Nasılsın?', 'Hey! Bir şey sorabilir misin?'];

  if (/^(hi|hello|selam|merhaba|sağol|hey)\b/.test(t)) return greetings[Math.floor(Math.random() * greetings.length)];
  if (t.includes('nasıl') && t.includes('sin')) return ['İyiyim, teşekkürler — ya sen?', 'Gayet iyiyim, sen nasılsın?'][Math.floor(Math.random()*2)];
  if (t.includes('adın') || t.includes('isim')) return 'Ben DenizBot — bana istediğini öğretebilirsin.';
  if (t.includes('şaka') || t.includes('komik')) return jokes[Math.floor(Math.random() * jokes.length)];
  if (t.includes('film')) return `Şunu izleyebilirsin: ${films[Math.floor(Math.random() * films.length)]}`;
  if (t.includes('öneri') || t.includes('tavsiye')) return 'Ne tür önerisi istersin? (film, kitap, yemek)';
  if (t.length < 5) return 'Kısa oldu — örnekler: "Nasılsın?", "Bana bir şaka söyle", "Film önerisi ver". Hangisini istersin?';
  // fallback: more engaging prompt for teaching
  return `Güzel bir giriş: "${input.slice(0, 120)}". Bunu daha iyi öğrenmemi istersen "öğret" komutuyla bana örnekler verebilirsin.`;
}

export async function POST(req: Request) {
  const parsed = await req.json().catch(() => ({} as any));
  const text = (parsed?.text || '').toString();

  try {
    if (!text || typeof text !== 'string') {
      // allow image-only requests (OCR)
      const maybeImage = (parsed?.imageBase64 || '').toString();
      if (!maybeImage) return NextResponse.json({ error: 'Metin veya görsel gerekli' }, { status: 400 });
    }

    // If an image was provided as base64, try OCR (best-effort using tesseract CLI)
    let ocrText = '';
    const imageBase64 = (parsed?.imageBase64 || '') as string;
    if (imageBase64) {
      try {
        const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
        await fs.mkdir(uploadsDir, { recursive: true });
        const m = imageBase64.match(/^data:(.+);base64,(.+)$/);
        const b = Buffer.from(m ? m[2] : imageBase64, 'base64');
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
        const filePath = path.join(uploadsDir, filename);
        await fs.writeFile(filePath, b);
        try {
          const { stdout } = await execFileP('tesseract', [filePath, 'stdout']);
          ocrText = (stdout || '').toString().trim();
        } catch (e) {
          // tesseract may not be installed; ignore and continue
          console.error('OCR failed (tesseract):', (e as any)?.message || e);
        }
      } catch (e) {
        console.error('Image handling error:', (e as any)?.message || e);
      }
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;

    const lower = (text || '').trim().toLowerCase();
    const effectiveText = (text && text.trim()) ? text.trim() : (ocrText || '');

    // Identity answers forced to Deniz Bozkurt
    if (/seni\s+yaratan|yaratın|yaratıc(ı|in)|baban\s+kim|bu\s+siteyi\s+kim|yaratıcı\s+kim/i.test(lower)) {
      return NextResponse.json({ reply: 'Deniz Bozkurt' });
    }

    // Correction attempt: "hayır yanlış biliyorsun doğrusu: <doğru cevap>"
    const corrMatch = lower.match(/hayır\s+yanlış[\s\S]*doğru(?:su)?:\s*(.+)$/i);
    if (corrMatch) {
      const newText = corrMatch[1]?.trim();
      // get client IP heuristically
      const headers = (req as any).headers || (req as Request).headers;
      const xf = typeof headers.get === 'function' ? headers.get('x-forwarded-for') : undefined;
      const xr = typeof headers.get === 'function' ? headers.get('x-real-ip') : undefined;
      const clientIp = (xf && xf.split(',')[0].trim()) || xr || '127.0.0.1';
      const adminIp = process.env.ADMIN_IP || process.env.ADMIN_IPS?.split(',')[0]?.trim();
      if (adminIp && clientIp === adminIp) {
        // Admin allowed to edit: update most recent pair (DB or local fallback)
        try {
          const last = await prisma.botPair.findFirst({ orderBy: { createdAt: 'desc' } });
          if (last) {
            const updated = await prisma.botPair.update({ where: { id: last.id }, data: { replyText: newText.slice(0, 240) } });
            // Also update local file if exists
            try {
              const file = path.join(process.cwd(), 'data', 'local_bot_pairs.json');
              const content = await fs.readFile(file, 'utf8').catch(() => '[]');
              const arr = JSON.parse(content || '[]');
              if (arr && arr.length) {
                arr[arr.length - 1].replyText = newText;
                await fs.writeFile(file, JSON.stringify(arr, null, 2), 'utf8');
              }
            } catch (e) {}
            return NextResponse.json({ reply: 'Öğrenilmiş bilgi güncellendi (admin).' });
          }
        } catch (e) {
          // DB not available -> try local file
          try {
            const file = path.join(process.cwd(), 'data', 'local_bot_pairs.json');
            const content = await fs.readFile(file, 'utf8').catch(() => '[]');
            const arr = JSON.parse(content || '[]');
            if (arr && arr.length) {
              arr[arr.length - 1].replyText = newText;
              await fs.writeFile(file, JSON.stringify(arr, null, 2), 'utf8');
              return NextResponse.json({ reply: 'Yerelde saklanan son öğrenme güncellendi (admin).' });
            }
          } catch (e2) {}
        }
        return NextResponse.json({ reply: 'Güncellenecek öğe bulunamadı.' });
      } else {
        return NextResponse.json({ reply: 'Bunu değiştiremezsin. Sadece admin (izinli IP) düzeltebilir.' });
      }
    }

    // Teach command: detect 'öğret' anywhere, accept both "öğret <payload>" and "öğret: <payload>"
    const teachMatch = effectiveText.match(/öğret(?:[:\s]+)([\s\S]+)/i);
    if (teachMatch) {
      const payload = (teachMatch[1] || '').trim();
      // Accept common separators: =>, ->, ||, =
      const parts = payload.split(/=>|->|\|\||=/).map((p: string) => p.trim()).filter(Boolean);
      let userText = '';
      let replyText = '';
      if (parts.length >= 2) {
        userText = parts[0].slice(0, 240);
        replyText = parts[1].slice(0, 240);
      } else {
        const single = (parts[0] || '').trim();
        // Try natural-language forms like: "seni sikerim demek hakarettir"
        const demekMatch = single.match(/^(.+?)\s+demek(?:tir|dir|ti?r|ki)?\s+(.+)$/i)
          || single.match(/^(.+?)\s+demek(?:\s+ki)?\s+(.+)$/i)
          || single.match(/^(.+?)\s+anlam(?:ı|i|dir)?\s+(.+)$/i);
        if (demekMatch) {
          userText = demekMatch[1].trim().slice(0, 240);
          replyText = demekMatch[2].trim().slice(0, 240);
        } else {
          // Fallback: if the payload looks like two tokens, use first token as trigger
          // and the rest as reply. Otherwise teach the whole payload as both trigger
          // and reply (previous behavior).
          const tokens = single.split(/\s+/).filter(Boolean);
          if (tokens.length >= 2) {
            userText = tokens.shift()!.slice(0, 240);
            replyText = tokens.join(' ').slice(0, 240);
          } else {
            userText = single.slice(0, 240);
            replyText = single.slice(0, 240);
          }
        }
      }
      // Determine client IP and admin list
      const headers = (req as any).headers || (req as Request).headers;
      const xf = typeof headers.get === 'function' ? headers.get('x-forwarded-for') : undefined;
      const xr = typeof headers.get === 'function' ? headers.get('x-real-ip') : undefined;
      const clientIp = (xf && xf.split(',')[0].trim()) || xr || '127.0.0.1';
      const adminList = (process.env.ADMIN_IPS || process.env.ADMIN_IP || '').split(',').map(s=>s.trim()).filter(Boolean);

      // Check if this trigger already exists (DB first, then local file). If exists, only admin can overwrite.
      try {
        const existingDb = await prisma.botPair.findFirst({ where: { userText: { equals: userText, mode: 'insensitive' } } });
        if (existingDb) {
          if (!adminList.includes(clientIp)) {
            return NextResponse.json({ reply: `Bu zaten öğrenilmiş: "${existingDb.replyText}". Sadece admin değiştirebilir.` , pair: { userText: existingDb.userText, replyText: existingDb.replyText } });
          } else {
            // admin: update DB
            try {
              const upd = await prisma.botPair.update({ where: { id: existingDb.id }, data: { replyText: replyText } });
              return NextResponse.json({ reply: 'Tamam — güncellendi.', pair: { userText: upd.userText, replyText: upd.replyText } });
            } catch (e) {
              // fall through to local fallback update
            }
          }
        }
      } catch (e) {
        // DB may be unavailable — proceed to check local file
      }

      // Local file check
      try {
        const file = path.join(process.cwd(), 'data', 'local_bot_pairs.json');
        const existingContent = await fs.readFile(file, 'utf8').catch(()=>'[]');
        const arr = JSON.parse(existingContent || '[]');
        const norm = (s:string)=>(s||'').trim().toLowerCase();
        const foundIndex = arr.findIndex((p:any)=>norm(p.userText) === norm(userText));
        if (foundIndex !== -1) {
          const found = arr[foundIndex];
          if (!adminList.includes(clientIp)) {
            return NextResponse.json({ reply: `Bu zaten öğrenilmiş: "${found.replyText}". Sadece admin değiştirebilir.`, pair: { userText: found.userText, replyText: found.replyText } });
          } else {
            // admin: update local file
            arr[foundIndex].replyText = replyText;
            await fs.writeFile(file, JSON.stringify(arr, null, 2), 'utf8');
            return NextResponse.json({ reply: 'Tamam — güncellendi.', pair: { userText: arr[foundIndex].userText, replyText: arr[foundIndex].replyText } });
          }
        }
      } catch (e) {
        // ignore local file errors for existence check
      }
        try {
          const created = await prisma.botPair.create({ data: { userText, replyText, authorId: userId } });
          try {
            const emb = await embedTextLocal(userText);
            if (emb && emb.length) {
              await prisma.embedding.create({ data: { model: 'local', vector: emb, source: 'botpair', sourceId: created.id } });
            }
          } catch (e) {}
          return NextResponse.json({ reply: 'Tamam — öğrendim. Bundan sonra bunu hatırlayıp cevap vereceğim.', pair: { userText, replyText }, ocrText: ocrText || undefined });
        } catch (e) {
        // DB write failed, try robust local persist and return helpful debug info if it fails
        try {
          const dataDir = path.join(process.cwd(), 'data');
          await fs.mkdir(dataDir, { recursive: true });
          const file = path.join(dataDir, 'local_bot_pairs.json');
          let arr: Array<{ userText: string; replyText: string; authorId?: string | null }> = [];
          try {
            const existing = await fs.readFile(file, 'utf8').catch(() => '[]');
            arr = JSON.parse(existing || '[]');
            if (!Array.isArray(arr)) arr = [];
          } catch (readErr) {
            arr = [];
          }
          arr.push({ userText, replyText, authorId: userId });
          try {
            await fs.writeFile(file, JSON.stringify(arr, null, 2), 'utf8');
            return NextResponse.json({ reply: 'Tamam — öğrendim. Bundan sonra bunu hatırlayıp cevap vereceğim.', pair: { userText, replyText }, storedLocal: true, ocrText: ocrText || undefined });
          } catch (fsErr) {
            // If writing to filesystem fails (e.g., platform is read-only), return the learned pair
            // so the client can persist it locally. Do not treat this as fatal.
            return NextResponse.json({ reply: 'Tamam — öğrendim. Bundan sonra bunu hatırlayıp cevap vereceğim.', pair: { userText, replyText }, storedLocal: false, ocrText: ocrText || undefined });
          }
        } catch (fsErrOuter) {
          // Log the error but return the learned pair so client can store it locally.
          console.error('Teach fallback error:', fsErrOuter);
          return NextResponse.json({ reply: 'Tamam — öğrendim. Bundan sonra bunu hatırlayıp cevap vereceğim.', pair: { userText, replyText }, storedLocal: false, ocrText: ocrText || undefined });
        }
      }
    }

    // First, attempt to generate a reply from a local LLM endpoint (user can run one locally).
    const localReply = await generateWithLocalLLM({ prompt: effectiveText, timeoutMs: 2500 });
    if (localReply) {
      try {
        await prisma.botPair.create({ data: { userText: (effectiveText||'').slice(0, 240), replyText: localReply.slice(0, 240), authorId: userId } });
      } catch (e) {}
      return NextResponse.json({ reply: localReply, ocrText: ocrText || undefined });
    }

    // Load local fallback pairs (if any)
    let localPairs: Array<{ userText: string; replyText: string }> = [];
    try {
      const file = path.join(process.cwd(), 'data', 'local_bot_pairs.json');
      const content = await fs.readFile(file, 'utf8').catch(() => '[]');
      localPairs = JSON.parse(content || '[]');
    } catch (e) {
      localPairs = [];
    }

    // Try exact match against local pairs
    const norm = (s: string) => s.trim().toLowerCase();
    const exactLocal = localPairs.find((p) => norm(p.userText) === norm(effectiveText || text));
    if (exactLocal) return NextResponse.json({ reply: exactLocal.replyText });

    // Query DB for exact or containing matches
    try {
      const exactDb = await prisma.botPair.findFirst({ where: { userText: { equals: effectiveText || text, mode: 'insensitive' } } });
      if (exactDb) return NextResponse.json({ reply: exactDb.replyText });
    } catch (e) {}

    // Substring matching in DB
    let reply = '';
    try {
      const key = ((effectiveText || text).split(" ")[0] || (effectiveText || text)).slice(0, 80);
      const candidates = await prisma.botPair.findMany({ where: { userText: { contains: key, mode: 'insensitive' } }, orderBy: { createdAt: 'desc' }, take: 10 });
      if (candidates.length > 0) reply = candidates[0].replyText;
    } catch (e) {
      // ignore DB errors
    }

    // If still no reply, try local substring match
    if (!reply) {
      const sub = localPairs.find((p) => norm(p.userText).includes(norm(effectiveText || text)) || norm(effectiveText || text).includes(norm(p.userText)));
      if (sub) reply = sub.replyText;
    }

    // Fallbacks
    if (!reply) {
      try {
        const any = await prisma.botPair.findMany({ take: 20 });
        if (any.length > 0) reply = any[Math.floor(Math.random() * any.length)].replyText;
      } catch (e) {}
    }
    if (!reply) reply = simpleResponder(text || '');

    // Try to persist this interaction as an example (best-effort)
    try {
      await prisma.botPair.create({ data: { userText: (effectiveText||'').slice(0, 240), replyText: reply.slice(0, 240), authorId: userId } });
    } catch (e) {}

    return NextResponse.json({ reply, ocrText: ocrText || undefined });
  } catch (err: any) {
    console.error('Bot message handler error:', err?.message || err);
    const reply = simpleResponder(text || '');
    return NextResponse.json({ reply });
  }
}
