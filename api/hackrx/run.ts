// File: api/hackrx/run.js
import fetch from 'node-fetch';
import { Readable } from 'stream';
import { Buffer } from 'buffer';
import { generateAnswerFlow } from '../../firebase/genkitLogic.js'; // <-- Adjust path to your Genkit logic

// Load environment variables
const HACKRX_TOKEN = process.env.HACKRX_TOKEN || 'hackrx-test-token-2025';

export default async function handler(req, res) {
  try {
    // Only POST allowed
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Check Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing Bearer token' });
    }
    const token = authHeader.split(' ')[1];
    if (token !== HACKRX_TOKEN) {
      return res.status(403).json({ error: 'Invalid Bearer token' });
    }

    // Parse request body
    const { documents, questions } = req.body;
    if (!documents || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Invalid request: Must include documents URL and questions array' });
    }

    // Download PDF from the provided URL
    const pdfResponse = await fetch(documents);
    if (!pdfResponse.ok) {
      return res.status(500).json({ error: 'Failed to download document' });
    }
    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');
    const pdfDataUri = `data:application/pdf;base64,${pdfBase64}`;

    // Process each question using your Firebase Genkit generateAnswerFlow
    const results = [];
    for (const question of questions) {
      const answer = await generateAnswerFlow({
        document: pdfDataUri,
        question: question
      });
      results.push({
        question,
        ...answer
      });
    }

    // Return HackRx submission format
    return res.status(200).json({
      document: documents,
      answers: results
    });

  } catch (err) {
    console.error('Error in /hackrx/run:', err);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
}
