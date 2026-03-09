// server/src/routes/companies.ts
import { Router, Request, Response } from 'express';
import { supabase } from '../db/client';

const router = Router();

// GET /api/companies/:id
router.get('/:id', async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

export default router;