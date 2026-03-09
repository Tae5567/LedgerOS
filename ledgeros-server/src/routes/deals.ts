// server/src/routes/deals.ts
import { Router, Request, Response } from 'express';
import { supabase } from '../db/client';

const router = Router();

// ---------------------------------------------------------------------------
// GET /api/deals
// Returns deals scoped to a specific investor (via ?investor_id=)
// If no investor_id, returns all (for backwards compat / admin)
// ---------------------------------------------------------------------------
router.get('/', async (req: Request, res: Response) => {
  const { investor_id } = req.query;

  let query = supabase
    .from('deals')
    .select(`
      id, valuation_low, valuation_high, risk_score, status, created_at, investor_id,
      companies (
        id, name, industry,
        financials ( year, revenue, ebitda_margin ),
        risk_signals ( severity )
      )
    `)
    .order('created_at', { ascending: false });

  if (investor_id) {
    query = query.eq('investor_id', investor_id as string);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// ---------------------------------------------------------------------------
// GET /api/deals/discover
// All companies that have completed docs — visible to any investor to request
// Excludes companies the investor already has a deal for
// ---------------------------------------------------------------------------
router.get('/discover', async (req: Request, res: Response) => {
  const { investor_id } = req.query;

  // Get all companies with their financials
  const { data: companies, error: compErr } = await supabase
    .from('companies')
    .select(`id, name, industry, created_at, financials ( year, revenue, ebitda_margin, ebitda )`);

  if (compErr) return res.status(500).json({ error: compErr.message });

  // Get all company IDs that have at least one completed document
  const { data: completedDocs, error: docErr } = await supabase
    .from('documents')
    .select('company_id')
    .eq('status', 'completed');

  if (docErr) return res.status(500).json({ error: docErr.message });

  const companiesWithDocs = new Set((completedDocs ?? []).map((d: any) => d.company_id));
  const withDocs = (companies ?? []).filter((c: any) => companiesWithDocs.has(c.id));

  if (!investor_id) return res.json(withDocs);

  // Exclude companies this investor already has a deal for
  const { data: existingDeals } = await supabase
    .from('deals')
    .select('company_id')
    .eq('investor_id', investor_id as string);

  const alreadyAdded = new Set((existingDeals ?? []).map((d: any) => d.company_id));
  const available = withDocs.filter((c: any) => !alreadyAdded.has(c.id));

  return res.json(available);
});

// ---------------------------------------------------------------------------
// POST /api/deals/request
// Investor requests access to a company — creates a deal record
// ---------------------------------------------------------------------------
router.post('/request', async (req: Request, res: Response) => {
  const { investor_id, company_id } = req.body;

  if (!investor_id || !company_id) {
    return res.status(400).json({ error: 'investor_id and company_id are required' });
  }

  // Check not already requested
  const { data: existing } = await supabase
    .from('deals')
    .select('id, status')
    .eq('investor_id', investor_id)
    .eq('company_id', company_id)
    .limit(1);

  if (existing && existing.length > 0) {
    return res.status(409).json({ error: 'Already requested', deal: existing[0] });
  }

  // Pull latest financials to auto-compute valuation
  const { data: fins } = await supabase
    .from('financials')
    .select('revenue, ebitda, ebitda_margin')
    .eq('company_id', company_id)
    .order('year', { ascending: false })
    .limit(1);

  const revenue = Number(fins?.[0]?.revenue) || 0;
  const margin  = Number(fins?.[0]?.ebitda_margin) || 0;
  const evMult  = margin > 20 ? 4.5 : margin > 10 ? 3.5 : 2.5;
  const mid     = revenue * evMult;
  const low     = mid ? Math.round(mid * 0.8) : null;
  const high    = mid ? Math.round(mid * 1.2) : null;
  const risk    = mid ? parseFloat(Math.max(3, Math.min(9, 10 - margin / 5)).toFixed(1)) : null;

  const { data: deal, error } = await supabase
    .from('deals')
    .insert({
      company_id,
      investor_id,
      valuation_low:  low,
      valuation_high: high,
      risk_score:     risk,
      status:         fins?.length ? 'ready' : 'needs-documents',
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json(deal);
});

// ---------------------------------------------------------------------------
// GET /api/deals/:id
// ---------------------------------------------------------------------------
router.get('/:id', async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('deals')
    .select(`
      id, valuation_low, valuation_high, risk_score, status, created_at, investor_id,
      companies (
        id, name, industry,
        financials (*),
        risk_signals (*),
        insights (*)
      )
    `)
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Deal not found' });
  return res.json(data);
});

// ---------------------------------------------------------------------------
// PATCH /api/deals/:id
// ---------------------------------------------------------------------------
router.patch('/:id', async (req: Request, res: Response) => {
  const { valuation_low, valuation_high, risk_score, status } = req.body;
  const updates: Record<string, any> = {};
  if (valuation_low  !== undefined) updates.valuation_low  = valuation_low;
  if (valuation_high !== undefined) updates.valuation_high = valuation_high;
  if (risk_score     !== undefined) updates.risk_score     = risk_score;
  if (status         !== undefined) updates.status         = status;

  if (!Object.keys(updates).length) return res.status(400).json({ error: 'No fields to update' });

  const { data, error } = await supabase.from('deals').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

export default router;