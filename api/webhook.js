export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
  
    const { documents, questions } = req.body;
  
    if (!documents || !questions) {
      return res.status(400).json({ error: 'Missing documents or questions' });
    }
  
    const answers = questions.map((q, i) => ({
      question: q,
      answer: `Dummy answer ${i + 1}`
    }));
  
    return res.status(200).json({ answers });
  }
  