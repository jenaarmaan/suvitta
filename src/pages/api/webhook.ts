// src/pages/api/webhook.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import { generateAnswer } from '@/ai/flows/generate-answer';

// Disable Next.js body parsing to allow formidable to handle the stream
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Authorization Check
  const token = process.env.HACKRX_TOKEN;
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${token}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 2. Method Check
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 3. Parse Form Data
  const form = formidable({});
  
  try {
    const [fields, files] = await form.parse(req);

    let documentBuffer: Buffer;
    let mimeType = 'application/octet-stream'; // Default MIME type

    // 4. Handle Document Input (File vs. URL)
    if (files.document) {
      const file = files.document[0];
      documentBuffer = fs.readFileSync(file.filepath);
      mimeType = file.mimetype || mimeType;
    } else if (fields.documentUrl && typeof fields.documentUrl[0] === 'string') {
      const resp = await fetch(fields.documentUrl[0]);
      if (!resp.ok) {
        return res.status(400).json({ error: `Failed to fetch document from URL: ${resp.statusText}` });
      }
      documentBuffer = Buffer.from(await resp.arrayBuffer());
      mimeType = resp.headers.get('content-type') || mimeType;
    } else {
      return res.status(400).json({ error: 'Request must contain either a "document" file upload or a "documentUrl" field.' });
    }

    // 5. Handle Questions Input
    const questionsField = fields.queries;
    if (!questionsField || !questionsField[0]) {
      return res.status(400).json({ error: 'Missing "queries" field with a JSON array of questions.' });
    }
    
    let questions: string[];
    try {
        // The field is a stringified JSON array
        questions = JSON.parse(questionsField[0]);
        if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error("Queries must be a non-empty array.");
        }
    } catch (e) {
        return res.status(400).json({ error: 'Invalid "queries" field. It must be a non-empty JSON array of strings.' });
    }

    // 6. Process with Genkit Flow
    const documentDataUri = `data:${mimeType};base64,${documentBuffer.toString('base64')}`;

    const answers = await Promise.all(
      questions.map(async (question) => {
        const result = await generateAnswer({ documentDataUri, question });
        return { question, ...result };
      })
    );
    
    // 7. Return Response
    return res.status(200).json({ answers });

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ error: 'An internal server error occurred.', details: error.message });
  }
}