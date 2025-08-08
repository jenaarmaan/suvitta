export default async function handler(req, res) {
  const token = process.env.HACKRX_TOKEN;

  // ✅ Authorization check
  if (req.headers.authorization !== `Bearer ${token}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // ✅ Only POST allowed
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { documents, questions } = req.body;

    if (!documents || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'Missing or invalid documents/questions' });
    }

    // 📄 Here you’d integrate with your retrieval + LLM pipeline:
    // For now, dummy answers to keep endpoint alive
    const answers = questions.map((q, i) => {
      return `Dummy answer ${i + 1} for: ${q}`;
    });

    return res.status(200).json({ answers });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
