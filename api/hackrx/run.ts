// File: api/hackrx/run.ts
import { generateAnswer } from '@/ai/flows/generate-answer';
import { z } from 'zod';

export const config = {
  runtime: 'edge', // use 'nodejs' if Genkit Edge isn't working
};

const schema = z.object({
  documentUrl: z.string().url(),
  queries: z.array(z.string()),
});

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const authHeader = req.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== process.env.HACKRX_TOKEN) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return new Response(JSON.stringify(parsed.error), { status: 400 });
  }

  const { documentUrl, queries } = parsed.data;

  try {
    const response = await fetch(documentUrl);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mimeType = response.headers.get('content-type') || 'application/pdf';
    const documentDataUri = `data:${mimeType};base64,${base64}`;

    const answers = await Promise.all(
      queries.map(async (question) => {
        const result = await generateAnswer({ documentDataUri, question });
        return { question, ...result };
      })
    );

    return new Response(JSON.stringify({ answers }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error(err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
