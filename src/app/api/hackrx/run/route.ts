// src/app/api/hackrx/run/route.ts
import pdf from 'pdf-parse';
import { NextResponse } from 'next/server';

type RequestBody = {
  documents: string | string[]; // single URL or array
  questions: string[];
};

function splitSentences(text: string) {
  // crude but effective sentence splitter
  const matches = text.match(/[^\.!\?]+[\.!\?]*/g);
  if (!matches) return [text];
  return matches.map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

function simpleBestSentenceMatch(question: string, sentences: string[]) {
  const qtoks = (question || '')
    .toLowerCase()
    .match(/\b[a-z0-9]{3,}\b/g) || [];

  if (!qtoks.length) return { sentence: sentences[0] || '', score: 0 };

  let bestIdx = 0;
  let bestScore = 0;
  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i].toLowerCase();
    let score = 0;
    for (const t of qtoks) {
      if (s.includes(t)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return { sentence: sentences[bestIdx] || '', score: bestScore };
}

function extractAmount(sentence: string) {
  if (!sentence) return undefined;
  // look for INR / Rs / ₹ or plain numbers
  const m = sentence.match(/(?:₹|Rs\.?|INR)?\s*([0-9]{1,3}(?:[,\s][0-9]{3})*(?:\.\d+)?)/i);
  if (!m) return undefined;
  const num = m[1].replace(/[,\s]/g, '');
  const parsed = Number(num);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = process.env.HACKRX_TOKEN || 'hackrx-test-token-2025';

    if (!authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: RequestBody = await req.json().catch(() => ({} as any));
    const { documents, questions } = body;

    if (!documents || !questions || !Array.isArray(questions)) {
      return NextResponse.json({ error: 'Missing documents or questions' }, { status: 400 });
    }

    // pick first document URL (this endpoint supports 1 doc quickly)
    const docUrl = Array.isArray(documents) ? documents[0] : documents;

    // fetch document
    const resp = await fetch(docUrl);
    if (!resp.ok) {
      return NextResponse.json({ error: 'Failed to fetch document', status: resp.status }, { status: 400 });
    }

    const contentType = (resp.headers.get('content-type') || '').toLowerCase();
    const arr = await resp.arrayBuffer();
    const buffer = Buffer.from(arr);

    let text = '';

    if (contentType.includes('pdf') || /\.pdf(\?|$)/i.test(docUrl)) {
      try {
        const data = await pdf(buffer as Buffer);
        text = data && (data.text || data.ntext) ? (data.text || data.ntext) : '';
      } catch (err) {
        console.error('pdf-parse error', err);
        text = buffer.toString('utf-8');
      }
    } else {
      // fallback: treat resource as text
      text = buffer.toString('utf-8');
    }

    if (!text) text = '';

    const sentences = splitSentences(text);
    const answers = questions.map((q: string) => {
      const { sentence, score } = simpleBestSentenceMatch(q, sentences);
      if (score === 0) {
        // fallback: return top snippet
        const snippet = text.slice(0, 500) + (text.length > 500 ? '...' : '');
        return { question: q, answer: `No exact clause found. Document snippet: ${snippet}`, clauseQuote: '', amount: undefined };
      }
      const amount = extractAmount(sentence);
      return { question: q, answer: sentence, clauseQuote: sentence, amount: amount ?? undefined };
    });

    return NextResponse.json({ answers }, { status: 200 });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
