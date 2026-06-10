import fetch from 'node-fetch';

type GenOpts = {
  prompt: string;
  history?: Array<{role: string; content: string}>;
  timeoutMs?: number;
};

export async function generateWithLocalLLM(opts: GenOpts): Promise<string | null> {
  const url = process.env.LOCAL_LLM_URL || 'http://127.0.0.1:8000/generate';
  const body = { prompt: opts.prompt, history: opts.history || [] };
  const timeout = opts.timeoutMs ?? 3000;

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(id);
    if (!res.ok) return null;
    const j = await res.json();
    return j.reply || (typeof j === 'string' ? j : null);
  } catch (err) {
    return null;
  }
}

export async function embeddingsAvailable(): Promise<boolean> {
  return !!process.env.LOCAL_EMBEDDING_URL;
}

export async function embedTextLocal(text: string): Promise<number[] | null> {
  const url = process.env.LOCAL_EMBEDDING_URL || 'http://127.0.0.1:8001/embed';
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
    if (!res.ok) return null;
    const j = await res.json();
    return j.embedding || null;
  } catch (e) {
    return null;
  }
}

export default { generateWithLocalLLM, embedTextLocal, embeddingsAvailable };
