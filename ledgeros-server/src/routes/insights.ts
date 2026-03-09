import { Router, Request, Response } from 'express';
import { supabase } from '../db/client';
import OpenAI from 'openai';

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// GET /api/insights/:companyId
// All insights for a company
router.get('/:companyId', async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('insights')
    .select('*')
    .eq('company_id', req.params.companyId)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// POST /api/insights/:companyId/generate
// Uses OpenAI to generate insights from stored financial + risk data
router.post('/:companyId/generate', async (req: Request, res: Response) => {
  const { companyId } = req.params;

  // 1. Gather all data for this company
  const [financialsResult, riskResult] = await Promise.all([
    supabase
      .from('financials')
      .select('*')
      .eq('company_id', companyId)
      .order('year', { ascending: true }),
    supabase
      .from('risk_signals')
      .select('*')
      .eq('company_id', companyId),
  ]);

  if (financialsResult.error) {
    return res.status(500).json({ error: financialsResult.error.message });
  }

  const financials = financialsResult.data;
  const riskSignals = riskResult.data ?? [];

  if (!financials || financials.length === 0) {
    return res.status(400).json({
      error: 'No financial data found. Upload financial statements first.',
    });
  }

  // 2. Build prompt
  const prompt = `
You are a financial analyst reviewing a private company for investment.

Financial data (all figures in thousands):
${JSON.stringify(financials, null, 2)}

Existing risk signals:
${JSON.stringify(riskSignals, null, 2)}

Generate 4–6 insights about this company. Return ONLY valid JSON array:
[
  {
    "type": "positive" | "warning" | "neutral",
    "title": "Short title (max 8 words)",
    "description": "One to two sentence explanation with specific numbers.",
    "confidence": 75,
    "data_source": "Financial Statements | Bank Statements | Contracts | Tax Documents"
  }
]

Rules:
- Be specific — reference actual numbers from the data
- Mix positive observations with warnings
- confidence should be between 70 and 95
- Do not add any text outside the JSON array
  `;

  // 3. Call OpenAI
  let generated: any[] = [];
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0].message.content ?? '{}';
    // GPT wraps arrays in an object when using json_object mode
    const parsed = JSON.parse(raw);
    generated = Array.isArray(parsed) ? parsed : parsed.insights ?? parsed.data ?? [];
  } catch (err: any) {
    return res.status(500).json({ error: `OpenAI error: ${err.message}` });
  }

  // 4. Persist to database
  const toInsert = generated.map((insight: any) => ({
    company_id: companyId,
    type: insight.type ?? 'neutral',
    title: insight.title ?? 'Insight',
    description: insight.description ?? '',
    confidence: insight.confidence ?? 80,
    data_source: insight.data_source ?? 'Financial Statements',
  }));

  const { data: saved, error: insertError } = await supabase
    .from('insights')
    .insert(toInsert)
    .select();

  if (insertError) return res.status(500).json({ error: insertError.message });
  return res.status(201).json(saved);
});

// DELETE /api/insights/:companyId
// Clear and regenerate — useful during dev
router.delete('/:companyId', async (req: Request, res: Response) => {
  const { error } = await supabase
    .from('insights')
    .delete()
    .eq('company_id', req.params.companyId);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ success: true });
});

export default router;