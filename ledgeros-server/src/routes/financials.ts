import { Router, Request, Response } from 'express';
import { supabase } from '../db/client';

const router = Router();

// GET /api/financials/:companyId
// Returns all normalized financial rows for a company
router.get('/:companyId', async (req: Request, res: Response) => {
  const { companyId } = req.params;

  const { data, error } = await supabase
    .from('financials')
    .select('*')
    .eq('company_id', companyId)
    .order('year', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// GET /api/financials/:companyId/summary
// Returns key metrics derived from latest year
router.get('/:companyId/summary', async (req: Request, res: Response) => {
  const { companyId } = req.params;

  const { data, error } = await supabase
    .from('financials')
    .select('*')
    .eq('company_id', companyId)
    .order('year', { ascending: false })
    .limit(2);

  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length === 0) return res.json(null);

  const latest = data[0];
  const prior = data[1] ?? null;

  const revenueGrowth =
    prior && prior.revenue
      ? (((latest.revenue - prior.revenue) / prior.revenue) * 100).toFixed(1)
      : null;

  return res.json({
    year: latest.year,
    revenue: latest.revenue,
    ebitda: latest.ebitda,
    ebitda_margin: latest.ebitda_margin,
    gross_margin_pct: latest.gross_margin_pct,
    revenue_growth_pct: revenueGrowth,
  });
});

// GET /api/financials/:companyId/cashflow
// Returns a simple 12-month cash flow forecast (base / downside / stress)
router.get('/:companyId/cashflow', async (req: Request, res: Response) => {
  const { companyId } = req.params;
  const scenario = (req.query.scenario as string) ?? 'base';

  const { data, error } = await supabase
    .from('financials')
    .select('revenue, ebitda')
    .eq('company_id', companyId)
    .order('year', { ascending: false })
    .limit(1);

  if (error) return res.status(500).json({ error: error.message });

  const baseMonthly = data?.[0] ? (data[0].ebitda / 12) * 1000 : 65;

  const multipliers: Record<string, number> = {
    base: 1,
    downside: 0.75,
    stress: 0.5,
  };
  const growth: Record<string, number> = {
    base: 0.03,
    downside: 0.01,
    stress: -0.02,
  };

  const mult = multipliers[scenario] ?? 1;
  const monthlyGrowth = growth[scenario] ?? 0.03;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const forecast = months.map((month, i) => ({
    month,
    value: Math.round(baseMonthly * mult * Math.pow(1 + monthlyGrowth, i)),
  }));

  return res.json({ scenario, forecast });
});

// POST /api/financials/:companyId
// Manually upsert a financial year (useful for testing without a PDF)
router.post('/:companyId', async (req: Request, res: Response) => {
  const { companyId } = req.params;
  const { year, revenue, cogs, opex, ebitda } = req.body;

  if (!year || !revenue) {
    return res.status(400).json({ error: 'year and revenue are required' });
  }

  const grossMargin = revenue - (cogs ?? 0);
  const normalizedEbitda = ebitda ?? grossMargin - (opex ?? 0);

  const { data, error } = await supabase
    .from('financials')
    .upsert({
      company_id: companyId,
      year,
      revenue,
      cogs: cogs ?? 0,
      gross_margin: grossMargin,
      opex: opex ?? 0,
      ebitda: normalizedEbitda,
      ebitda_margin: revenue ? (normalizedEbitda / revenue) * 100 : 0,
      gross_margin_pct: revenue ? (grossMargin / revenue) * 100 : 0,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json(data);
});

export default router;