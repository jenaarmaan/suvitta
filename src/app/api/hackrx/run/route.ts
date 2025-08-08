
import { NextRequest, NextResponse } from 'next/server';
import formidable from 'formidable';
import fs from 'fs';
import fetch from 'node-fetch';
import { generateAnswerFlow } from '../../../../../firebase/genkitLogic.js';

// This function handles the POST request
export async function POST(req: NextRequest) {
  // 1. Authorization Check
  const token = process.env.HACKRX_TOKEN || 'hackrx-test-token-2025';
  const authHeader = req.headers.get('authorization');
  if (!authHeader || authHeader !== `Bearer ${token}`) {
    return NextResponse.json({ error: 'Unauthorized: Invalid or missing Bearer token' }, { status: 401 });
  }

  // formidable can't process the NextRequest directly, we need the underlying stream
  // @ts-ignore
  const form = formidable({ multiples: false });

  try {
    const { fields, files } = await new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
        form.parse(req as any, (err, fields, files) => {
            if (err) {
                reject(err);
            }
            resolve({ fields, files });
        });
    });

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
        return NextResponse.json({ error: 'Invalid document URL provided.' }, { status: 400 });
      }
      const response = await fetch(docUrl);
      if (!response.ok) {
        return NextResponse.json({ error: `Failed to download document from URL: ${docUrl}` }, { status: 500 });
      }
      const arrayBuffer = await response.arrayBuffer();
      documentBuffer = Buffer.from(arrayBuffer);
      documentMimeType = response.headers.get('content-type') || 'application/pdf';
    } else {
      return NextResponse.json({ error: 'Missing document source. Provide either a file upload named `document` or a `documents` URL.' }, { status: 400 });
    }

    // 4. Handle Questions
    const questionsStr = fields.questions?.[0] || '[]';
    let questions;
    try {
      questions = JSON.parse(questionsStr);
      if (!Array.isArray(questions) || questions.length === 0) {
        return NextResponse.json({ error: '`questions` must be a non-empty array.' }, { status: 400 });
      }
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON in `questions` field.' }, { status: 400 });
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
    return NextResponse.json({ answers }, { status: 200 });

  } catch (e: unknown) {
    console.error('Error processing request:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
