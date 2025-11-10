import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { transcript, redact } = req.body as { transcript: string; redact?: boolean };
    if (!transcript) return res.status(400).json({ error: 'Missing transcript' });

    const cleaned = redact ? transcript.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[redacted-email]').replace(/\+?\d[\d\s()-]{6,}/g, '[redacted-phone]') : transcript;

    if (!OPENAI_API_KEY) {
      return res.status(200).json({
        title: 'Meeting Summary (Demo)',
        summary: 'Demo summary produced without an API key. Add OPENAI_API_KEY to enable real summaries.',
        agenda: ['Kickoff', 'Updates', 'Next Steps'],
        discussion: [{ topic: 'Timeline', notes: ['Reviewed milestones','Adjusted dates'] }],
        decisions: ['Adopt Brief33 for minutes'],
        actions: [{ id: '1', task: 'Email recap', owner: 'Me', due: '2025-11-20', status: 'pending' }]
      });
    }

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    const prompt = `You are a meeting summariser. Return strict JSON with fields: title, summary, agenda[], discussion[{topic,notes[]}], decisions[], actions[{id,task,owner,due,status}]. Transcript: ${cleaned}`;

    const resp = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2
    });

    const json = JSON.parse(resp.choices[0].message.content || '{}');
    res.status(200).json(json);
  } catch (e:any) {
    res.status(500).json({ error: e?.message || 'summarise-failed' });
  }
}
