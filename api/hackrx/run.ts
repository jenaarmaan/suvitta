
import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import fetch from 'node-fetch';
import { generateAnswerFlow } from '../../firebase/genkitLogic.js';

export const config = {
  api: { bodyParser: false } // Disable body parser for file uploads
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Method Check
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Authorization Check
  const token = process.env.HACKRX_TOKEN || 'hackrx-test-token-2025';
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${token}`) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing Bearer token' });
  }

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Formidable parsing error:', err);
      return res.status(500).json({ error: 'Error parsing form data.' });
    }

    try {
      let documentBuffer;
      let documentMimeType = 'application/octet-stream';
      const file = files.document?.[0];
      const documentsField = fields.documents?.[0];


      // 3. Handle Document Source (Upload or URL)
      if (file) {
        documentBuffer = fs.readFileSync(file.filepath);
        documentMimeType = file.mimetype || 'application/octet-stream';
      } else if (documentsField) {
        const docUrl = documentsField;
         if (typeof docUrl !== 'string' || !docUrl.startsWith('http')) {
           return res.status(400).json({ error: 'Invalid document URL provided.' });
         }
        const response = await fetch(docUrl);
        if (!response.ok) {
          return res.status(500).json({ error: `Failed to download document from URL: ${docUrl}` });
        }
        const arrayBuffer = await response.arrayBuffer();
        documentBuffer = Buffer.from(arrayBuffer);
        documentMimeType = response.headers.get('content-type') || 'application/pdf';
      } else {
        return res.status(400).json({ error: 'Missing document source. Provide either a file upload named `document` or a `documents` URL.' });
      }

      // 4. Handle Questions
      const questionsStr = fields.questions?.[0] || '[]';
      let questions;
      try {
        questions = JSON.parse(questionsStr);
         if (!Array.isArray(questions) || questions.length === 0) {
          return res.status(400).json({ error: '`questions` must be a non-empty array.' });
        }
      } catch (e) {
         return res.status(400).json({ error: 'Invalid JSON in `questions` field.' });
      }


      // 5. Process with Genkit Flow
      const documentDataUri = `data:${documentMimeType};base64,${documentBuffer.toString('base64')}`;
      const answers = [];

      for (const question of questions) {
        const result = await generateAnswerFlow({
          documentDataUri: documentDataUri,
          question: question,
        });
        answers.push({
          question: question,
          ...result
        });
      }

      // 6. Return Final Response
      return res.status(200).json({ answers });

    } catch (e: unknown) {
      console.error('Error processing request:', e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      return res.status(500).json({ error: 'Internal Server Error', details: errorMessage });
    }
  });
}
