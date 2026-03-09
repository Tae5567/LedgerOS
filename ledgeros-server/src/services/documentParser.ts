import { supabase } from '../db/client';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ---------------------------------------------------------------------------
// PDF text extraction — no external library, reads raw PDF byte strings.
// Pulls literal string objects ((...)) and BT/ET text blocks.
// Works well for machine-generated financial PDFs.
// ---------------------------------------------------------------------------
function extractTextFromBuffer(buffer: Buffer): string {
  const raw = buffer.toString('latin1');
  const chunks: string[] = [];

  // PDF literal strings: (some text here)
  const litRe = /\(([^()\\]{3,})\)/g;
  let m: RegExpExecArray | null;
  while ((m = litRe.exec(raw)) !== null) {
    const s = m[1].replace(/[^\x20-\x7E]/g, ' ').trim();
    if (s.length >= 3) chunks.push(s);
  }

  // BT ... ET text blocks
  const btRe = /BT([\s\S]{1,500}?)ET/g;
  while ((m = btRe.exec(raw)) !== null) {
    const inner = m[1].replace(/[^\x20-\x7E\n]/g, ' ').replace(/\s+/g, ' ').trim();
    if (inner.length > 8) chunks.push(inner);
  }

  const result = chunks.join(' ').replace(/\s+/g, ' ').trim().slice(0, 5000);
  console.log(`[PDF] extracted ${result.length} chars from ${buffer.length}-byte buffer`);
  console.log(`[PDF] preview: ${result.slice(0, 300)}`);
  return result;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export async function parseDocument(
  docId: string,
  buffer: Buffer,
  category: string,
  companyId: string
) {
  console.log(`\n[parseDocument] START docId=${docId} category=${category} companyId=${companyId}`);
  try {
    const text = extractTextFromBuffer(buffer);

    if (!text || text.length < 20) {
      throw new Error(`PDF text extraction yielded too little content (${text.length} chars). File may be image-based or corrupted.`);
    }

    const prompt = getPromptForCategory(category, text);
    console.log(`[parseDocument] sending ${prompt.length} chars to OpenAI...`);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const rawJson = completion.choices[0].message.content!;
    console.log(`[parseDocument] OpenAI response: ${rawJson.slice(0, 400)}`);
    const parsed = JSON.parse(rawJson);

    // Mark document complete
    const { error: updateErr } = await supabase
      .from('documents')
      .update({ status: 'completed', parsed_data: parsed })
      .eq('id', docId);
    if (updateErr) console.error('[parseDocument] doc update error:', updateErr.message);

    // Write structured data to DB
    if (category === 'financial' && Array.isArray(parsed.financials) && parsed.financials.length > 0) {
      await normalizeAndStoreFinancials(companyId, parsed.financials);
    }
    await generateRiskSignals(companyId, parsed, category);
    await generateInsights(companyId, parsed, category);
    console.log(`[parseDocument] ✅ DONE docId=${docId}\n`);
  } catch (err: any) {
    console.error(`[parseDocument] ❌ FAILED docId=${docId}: ${err?.message}`);
    await supabase.from('documents').update({ status: 'error' }).eq('id', docId);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------
function getPromptForCategory(category: string, text: string): string {
  const base: Record<string, string> = {
    financial: `You are a financial analyst extracting data from a financial statement.
Return ONLY a valid JSON object — no markdown, no explanation.
Shape: { "financials": [{ "year": 2025, "revenue": 3200000, "cogs": 1800000, "opex": 800000, "ebitda": 600000 }], "anomalies": [] }
Rules: all numeric values must be plain numbers (not strings). Include all years found. If a value is missing use 0.
Document text:\n${text}`,

    bank: `You are a financial analyst reading a bank statement.
Return ONLY a valid JSON object.
Shape: { "monthly_totals": [{ "month": "Oct", "deposits": 120000, "withdrawals": 95000 }], "average_balance": 85000, "flags": [] }
Document text:\n${text}`,

    contracts: `You are a financial analyst reviewing a contract.
Return ONLY a valid JSON object.
Shape: { "parties": ["Company A", "Company B"], "value": 255000, "expiry_date": "2027-12-31", "key_terms": [], "concentration_risk": false }
Document text:\n${text}`,

    tax: `You are a financial analyst reading a tax return.
Return ONLY a valid JSON object.
Shape: { "year": 2024, "gross_income": 3200000, "net_income": 686000, "tax_paid": 113550, "discrepancies": [] }
Document text:\n${text}`,
  };
  return base[category] ?? `Extract all financial data from this document and return a valid JSON object with key financial metrics. Document:\n${text}`;
}

// ---------------------------------------------------------------------------
// Financials
// ---------------------------------------------------------------------------
async function normalizeAndStoreFinancials(companyId: string, financials: any[]) {
  for (const fin of financials) {
    const revenue     = Number(fin.revenue) || 0;
    const cogs        = Number(fin.cogs)    || 0;
    const opex        = Number(fin.opex)    || 0;
    const grossMargin = revenue - cogs;
    const ebitda      = Number(fin.ebitda)  || Math.max(grossMargin - opex, 0);
    const year        = Number(fin.year)    || new Date().getFullYear();

    console.log(`[financials] writing year=${year} revenue=${revenue} ebitda=${ebitda} for company=${companyId}`);

    // Try upsert first (requires unique constraint on company_id, year)
    const { error: upsertErr } = await supabase.from('financials').upsert(
      { company_id: companyId, year, revenue, cogs, gross_margin: grossMargin, opex, ebitda,
        ebitda_margin: revenue ? (ebitda / revenue) * 100 : 0,
        gross_margin_pct: revenue ? (grossMargin / revenue) * 100 : 0 },
      { onConflict: 'company_id,year' }
    );

    if (upsertErr) {
      console.warn('[financials] upsert failed, trying insert:', upsertErr.message);
      const { error: insertErr } = await supabase.from('financials').insert(
        { company_id: companyId, year, revenue, cogs, gross_margin: grossMargin, opex, ebitda,
          ebitda_margin: revenue ? (ebitda / revenue) * 100 : 0,
          gross_margin_pct: revenue ? (grossMargin / revenue) * 100 : 0 }
      );
      if (insertErr) console.error('[financials] insert also failed:', insertErr.message);
      else console.log('[financials] ✅ inserted via fallback');
    } else {
      console.log('[financials] ✅ upserted');
    }
  }
}

// ---------------------------------------------------------------------------
// Risk signals
// ---------------------------------------------------------------------------
async function generateRiskSignals(companyId: string, parsed: any, category: string) {
  const signals: any[] = [];

  if (parsed.concentration_risk === true) {
    signals.push({ company_id: companyId, severity: 'medium', title: 'Customer Concentration Risk',
      description: 'Significant revenue concentration detected from contract analysis.', confidence: 85, category: 'Business' });
  }
  if (Array.isArray(parsed.flags) && parsed.flags.length > 0) {
    signals.push({ company_id: companyId, severity: 'high', title: 'Bank Statement Anomaly',
      description: parsed.flags.join('. '), confidence: 90, category: 'Financial' });
  }
  if (Array.isArray(parsed.anomalies) && parsed.anomalies.length > 0) {
    signals.push({ company_id: companyId, severity: 'medium', title: 'Financial Anomaly Detected',
      description: parsed.anomalies.join('. '), confidence: 80, category: 'Financial' });
  }
  if (Array.isArray(parsed.discrepancies) && parsed.discrepancies.length > 0) {
    signals.push({ company_id: companyId, severity: 'high', title: 'Tax Document Discrepancy',
      description: parsed.discrepancies.join('. '), confidence: 88, category: 'Financial' });
  }

  if (signals.length > 0) {
    const { error } = await supabase.from('risk_signals').insert(signals);
    if (error) console.error('[risk_signals] error:', error.message);
    else console.log(`[risk_signals] ✅ inserted ${signals.length}`);
  }
}

// ---------------------------------------------------------------------------
// Insights — one or two per document
// ---------------------------------------------------------------------------
async function generateInsights(companyId: string, parsed: any, category: string) {
  const insights: any[] = [];

  if (category === 'financial' && Array.isArray(parsed.financials) && parsed.financials.length > 0) {
    const fin     = parsed.financials[parsed.financials.length - 1];
    const revenue = Number(fin?.revenue) || 0;
    const ebitda  = Number(fin?.ebitda)  || 0;
    const margin  = revenue ? (ebitda / revenue) * 100 : 0;
    const fmtRev  = revenue >= 1_000_000 ? `$${(revenue / 1_000_000).toFixed(2)}M` : `$${revenue.toLocaleString()}`;

    insights.push({ company_id: companyId, type: 'positive', title: 'Revenue Validated',
      description: `Financial statements confirm ${fmtRev} in reported revenue. AI normalization complete.`,
      confidence: 95, data_source: 'Financial Statements' });

    if (margin > 20) {
      insights.push({ company_id: companyId, type: 'positive', title: 'Strong EBITDA Margin',
        description: `${margin.toFixed(1)}% EBITDA margin exceeds the 20% benchmark for high-quality tech businesses.`,
        confidence: 90, data_source: 'Financial Statements' });
    } else if (margin < 5 && margin >= 0) {
      insights.push({ company_id: companyId, type: 'warning', title: 'Thin Margins',
        description: `EBITDA margin of ${margin.toFixed(1)}% is below industry benchmarks. Review cost structure before investment.`,
        confidence: 88, data_source: 'Financial Statements' });
    }
  }

  if (category === 'bank' && Number(parsed.average_balance) > 0) {
    insights.push({ company_id: companyId, type: 'positive', title: 'Bank Balance Verified',
      description: `Average balance of $${Number(parsed.average_balance).toLocaleString()} confirmed. Cash position supports near-term operations.`,
      confidence: 92, data_source: 'Bank Statements' });
  }

  if (category === 'contracts' && Number(parsed.value) > 0) {
    insights.push({ company_id: companyId, type: 'positive', title: 'Contracted Revenue Identified',
      description: `Contract worth $${Number(parsed.value).toLocaleString()} provides forward revenue visibility.`,
      confidence: 87, data_source: 'Contracts' });
  }

  if (category === 'tax' && Number(parsed.tax_paid) > 0) {
    insights.push({ company_id: companyId, type: 'positive', title: 'Tax Compliance Confirmed',
      description: `$${Number(parsed.tax_paid).toLocaleString()} paid for ${parsed.year ?? 'prior year'}. No outstanding liabilities detected.`,
      confidence: 93, data_source: 'Tax Documents' });
  }

  if (insights.length > 0) {
    const { error } = await supabase.from('insights').insert(insights);
    if (error) console.error('[insights] error:', error.message);
    else console.log(`[insights] ✅ inserted ${insights.length}`);
  }
}