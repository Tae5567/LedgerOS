import { Router } from 'express';
import multer from 'multer';
import { supabase } from '../db/client';
import { parseDocument } from '../services/documentParser';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/documents/upload
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { company_id, category } = req.body;
    const file = req.file!;

    // 1. Upload to Supabase Storage
    const filePath = `${company_id}/${category}/${Date.now()}_${file.originalname}`;
    const { data: storageData, error: storageError } = await supabase.storage
      .from('documents')
      .upload(filePath, file.buffer, { contentType: file.mimetype });

    if (storageError) throw storageError;

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    // 2. Create document record
    const { data: doc, error: dbError } = await supabase
      .from('documents')
      .insert({
        company_id,
        category,
        file_name: file.originalname,
        file_url: publicUrl,
        status: 'parsing'
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // 3. Parse asynchronously (don't await — returns immediately)
    parseDocument(doc.id, file.buffer, category, company_id)
      .catch(console.error);

    res.json({ success: true, document: doc });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/documents/:companyId
router.get('/:companyId', async (req, res) => {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('company_id', req.params.companyId)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;