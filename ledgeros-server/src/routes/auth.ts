import { Router, Request, Response } from 'express';
import { supabase } from '../db/client';

const router = Router();

// POST /api/auth/signup
router.post('/signup', async (req: Request, res: Response) => {
  const { email, password, user_type, company_name, full_name } = req.body;

  if (!email || !password || !user_type) {
    return res.status(400).json({ error: 'email, password and user_type are required' });
  }

  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) return res.status(400).json({ error: authError.message });

  const userId = authData.user.id;

  // 2. Create profile
  const { error: profileError } = await supabase.from('profiles').insert({
    id: userId,
    user_type,
    full_name: full_name ?? null,
    company_name: company_name ?? null,
  });

  if (profileError) return res.status(400).json({ error: profileError.message });

  // 3. If business user, create company record
  let companyId: string | null = null;
  if (user_type === 'business' && company_name) {
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({ owner_id: userId, name: company_name })
      .select()
      .single();

    if (companyError) return res.status(400).json({ error: companyError.message });
    companyId = company.id;
  }

  return res.status(201).json({ userId, companyId });
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return res.status(401).json({ error: error.message });

  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profileError) return res.status(400).json({ error: profileError.message });

  // Fetch company if business user
  let companyId: string | null = null;
  if (profile.user_type === 'business') {
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('owner_id', data.user.id)
      .single();
    companyId = company?.id ?? null;
  }

  return res.json({
    access_token: data.session.access_token,
    user: {
      id: data.user.id,
      email: data.user.email,
      user_type: profile.user_type,
      full_name: profile.full_name,
      company_name: profile.company_name,
      company_id: companyId,
    },
  });
});

// GET /api/auth/me  (pass Bearer token)
router.get('/me', async (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  let companyId: string | null = null;
  if (profile?.user_type === 'business') {
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('owner_id', user.id)
      .single();
    companyId = company?.id ?? null;
  }

  return res.json({ ...profile, company_id: companyId });
});

export default router;