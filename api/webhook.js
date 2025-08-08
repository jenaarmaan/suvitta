export default async function handler(req, res) {
  const token = process.env.HACKRX_TOKEN;

  // Authorization check
  if (req.headers.authorization !== `Bearer ${token}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { documents, questions } = req.body;

  if (!documents || !questions) {
    return res.status(400).json({ error: 'Missing documents or questions' });
  }

  // Example: Replace this with actual Gemini logic later
  const answers = questions.map((q, i) => ({
    question: q,
    answer: `Dummy answer ${i + 1}`
  }));

  return res.status(200).json({ answers });
}
