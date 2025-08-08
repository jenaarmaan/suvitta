// src/pages/api/webhook.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';

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
  
  try {
    const response = await fetch("https://api-sigma-orpin.vercel.app/api/webhook", {
        method: "POST",
        headers: { 
            "Content-Type": req.headers['content-type'] || 'application/json',
            "Authorization": authHeader,
        },
        body: req,
      });

      const data = await response.json();
      
      if(!response.ok) {
          return res.status(response.status).json(data);
      }
      
      return res.status(200).json(data);

  } catch (error: any) {
    console.error('Webhook proxy error:', error);
    return res.status(500).json({ error: 'An internal server error occurred.', details: error.message });
  }
}
