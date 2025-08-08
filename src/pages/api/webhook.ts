// src/pages/api/webhook.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Method Check
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Authorization Check
  const authHeader = req.headers.authorization;
  // Note: The token is hardcoded as per the user's instructions.
  // In a real-world scenario, this should be in an environment variable.
  if (!authHeader || authHeader !== `Bearer hackrx-test-token-2025`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { documents, questions } = req.body;

    // 3. Input Validation
    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({ error: 'Missing or invalid `documents` array.' });
    }
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ error: 'Missing or invalid `questions` array.' });
    }

    // 4. Proxy to Firebase Cloud Function
    // IMPORTANT: Replace with your actual Firebase Cloud Function trigger URL.
    const firebaseFunctionUrl = 'https://<YOUR-FIREBASE-REGION>-<YOUR-FIREBASE-PROJECT>.cloudfunctions.net/generateAnswerFlow';
    
    // As per the example, we take the first document and first question.
    // This can be adjusted if the backend is designed to handle more.
    const firebaseResponse = await fetch(firebaseFunctionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentUrl: documents[0],
        question: questions[0],
      }),
    });

    // 5. Handle Response
    if (!firebaseResponse.ok) {
        const errorData = await firebaseResponse.text();
        console.error('Firebase function error response:', errorData);
        return res.status(firebaseResponse.status).json({
             error: 'Error from backend service.',
             details: errorData 
        });
    }

    const data = await firebaseResponse.json();
    
    // The example returns a single answer object. If the backend returns an array,
    // this structure should be adjusted. Assuming the backend returns the full
    // expected answer structure for a single question.
    const finalResponse = {
        answers: [{
            question: questions[0],
            ...data
        }]
    };
    
    return res.status(200).json(finalResponse);

  } catch (err) {
    const error = err instanceof Error ? err.message : 'An unknown error occurred.';
    console.error('Webhook proxy error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error });
  }
}
