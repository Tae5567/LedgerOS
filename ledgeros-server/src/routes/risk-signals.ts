// server/src/routes/risk-signals.ts
import { Router, Request, Response } from 'express';
import { supabase } from '../db/client';

const router = Router();

// GET /api/risk-signals/:companyId
router.get('/:companyId', async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('risk_signals')
    .select('*')
    .eq('company_id', req.params.companyId)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

export default router;