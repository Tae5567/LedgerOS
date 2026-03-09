// Central data store — one record per company
// This replaces all hardcoded data scattered across screens

export interface CompanyData {
  id: string;
  name: string;
  industry: string;
  subIndustry: string;
  revenue: string;
  revenueRaw: number;        // in $M
  ebitdaMargin: number;      // %
  growthRate: number;        // %
  grossMargin: number;       // %
  cashRunway: string;
  riskScore: number;
  valuationLow: string;
  valuationHigh: string;
  status: 'ready' | 'analyzing' | 'needs-documents';
  ebitdaRaw: string;
  overview: string;
  revenueHistory: { year: string; revenue: number; cogs: number; opex: number; ebitda: number }[];
  cashFlow: number[];
  riskSignals: { severity: 'high' | 'medium' | 'low'; title: string; desc: string; confidence: number; category: string }[];
  insights: { type: 'positive' | 'warning' | 'neutral'; title: string; desc: string; confidence: number; source: string; doc: string; time: string }[];
  documentStatus: { name: string; count: number; status: 'uploaded' | 'processing' | 'needs-review'; color: string }[];
}

export const COMPANY_DATA: Record<string, CompanyData> = {

  'biz-001': {
    id: 'biz-001',
    name: 'Acme Technologies Inc.',
    industry: 'SaaS',
    subIndustry: 'B2B Software',
    revenue: '$3.2M',
    revenueRaw: 3.2,
    ebitdaMargin: 24.5,
    growthRate: 18,
    grossMargin: 72,
    cashRunway: '18 mo',
    riskScore: 7.2,
    valuationLow: '$8.5M',
    valuationHigh: '$11.2M',
    status: 'ready',
    ebitdaRaw: '$785k',
    overview: 'Acme Technologies provides cloud-based project management software for mid-market enterprises. Consistent revenue growth over 36 months with strong unit economics and customer retention. Primary markets include construction, professional services, and healthcare.',
    revenueHistory: [
      { year: '2023', revenue: 2800, cogs: 1400, opex: 980,  ebitda: 420 },
      { year: '2024', revenue: 3200, cogs: 1600, opex: 1120, ebitda: 480 },
      { year: '2025', revenue: 3800, cogs: 1900, opex: 1330, ebitda: 570 },
    ],
    cashFlow: [65,68,72,75,78,82,85,88,92,95,98,102],
    riskSignals: [
      { severity: 'high',   title: 'Revenue Volatility',        desc: 'Quarterly revenue variance exceeds industry baseline by 32%',   confidence: 87, category: 'Financial' },
      { severity: 'medium', title: 'Customer Concentration',    desc: 'Top 3 customers represent 68% of total revenue',                confidence: 94, category: 'Business'  },
      { severity: 'high',   title: 'Bank Statement Mismatch',   desc: 'Reported revenue differs from deposits by $47k in Q4 2025',     confidence: 91, category: 'Financial' },
      { severity: 'low',    title: 'Seasonal Pattern',          desc: 'Q4 typically shows 25% increase — normal for industry',         confidence: 78, category: 'Insight'   },
    ],
    insights: [
      { type: 'positive', title: 'Revenue Growth Above Industry Median', desc: 'YoY growth of 18% exceeds SaaS median of 12% by 6pp.', confidence: 92, source: 'Financial Statements', doc: 'Income Statement 2025', time: '2 hours ago' },
      { type: 'warning',  title: 'Customer Concentration Risk',          desc: 'Top 3 customers = 68% of revenue. High churn risk.',    confidence: 94, source: 'Contracts',            doc: 'Contract Analysis',   time: '5 hours ago' },
      { type: 'positive', title: 'Cash Flow Stability Improving',        desc: 'Cash flow variance down 23% QoQ.',                      confidence: 88, source: 'Bank Statements',       doc: 'Cash Flow Analysis',  time: '1 day ago' },
      { type: 'neutral',  title: 'Seasonal Revenue Pattern',             desc: 'Q4 consistently +25% vs Q3 — aligns with industry.',    confidence: 85, source: 'Financial Statements', doc: 'Revenue Trends',      time: '1 day ago' },
    ],
    documentStatus: [
      { name: 'Financial Statements', count: 3, status: 'uploaded',     color: '#8B5CF6' },
      { name: 'Bank Statements',      count: 6, status: 'uploaded',     color: '#3A6FF7' },
      { name: 'Contracts',            count: 2, status: 'processing',   color: '#F59E0B' },
      { name: 'Tax Documents',        count: 1, status: 'needs-review', color: '#EF4444' },
    ],
  },

  'biz-002': {
    id: 'biz-002',
    name: 'BrightPath Solutions',
    industry: 'Healthcare Tech',
    subIndustry: 'Digital Health',
    revenue: '$5.8M',
    revenueRaw: 5.8,
    ebitdaMargin: 31.2,
    growthRate: 26,
    grossMargin: 68,
    cashRunway: '24 mo',
    riskScore: 8.1,
    valuationLow: '$15.2M',
    valuationHigh: '$18.5M',
    status: 'analyzing',
    ebitdaRaw: '$1.81M',
    overview: 'BrightPath Solutions builds patient engagement and remote monitoring software for hospitals and clinics across West Africa. Strong recurring revenue from 3-year enterprise contracts with major hospital groups. Expanding into diagnostic AI tooling.',
    revenueHistory: [
      { year: '2023', revenue: 4100, cogs: 1890, opex: 1230, ebitda: 980  },
      { year: '2024', revenue: 4900, cogs: 2150, opex: 1420, ebitda: 1330 },
      { year: '2025', revenue: 5800, cogs: 2610, opex: 1630, ebitda: 1560 },
    ],
    cashFlow: [120,126,131,138,144,151,158,163,170,176,182,190],
    riskSignals: [
      { severity: 'medium', title: 'Regulatory Exposure',       desc: 'Healthcare data regulations differ across 4 operating countries', confidence: 82, category: 'Compliance' },
      { severity: 'low',    title: 'Strong Contract Base',       desc: 'Multi-year contracts cover 84% of ARR — low churn risk',          confidence: 91, category: 'Business'   },
      { severity: 'medium', title: 'Key Person Dependency',      desc: 'CTO holds critical IP relationships with hospital partners',       confidence: 78, category: 'Operational'},
    ],
    insights: [
      { type: 'positive', title: 'Above-Average Growth Trajectory', desc: '26% YoY growth significantly outpaces 14% sector average.',   confidence: 91, source: 'Financial Statements', doc: 'P&L 2025',           time: '1 hour ago'  },
      { type: 'positive', title: 'Strong Gross Margin for Sector',  desc: '68% gross margin is top-quartile for healthcare SaaS.',        confidence: 88, source: 'Financial Statements', doc: 'Margin Analysis',    time: '3 hours ago' },
      { type: 'warning',  title: 'Geographic Concentration',        desc: '71% of revenue from Nigeria — FX risk and political exposure.', confidence: 85, source: 'Contracts',            doc: 'Revenue by Region',  time: '1 day ago'   },
      { type: 'neutral',  title: 'Expansion Pipeline Active',       desc: '3 LOIs signed in Ghana and Kenya, worth $1.2M ARR.',           confidence: 72, source: 'Contracts',            doc: 'Pipeline Report',    time: '2 days ago'  },
    ],
    documentStatus: [
      { name: 'Financial Statements', count: 4, status: 'uploaded',   color: '#8B5CF6' },
      { name: 'Bank Statements',      count: 8, status: 'uploaded',   color: '#3A6FF7' },
      { name: 'Contracts',            count: 5, status: 'uploaded',   color: '#F59E0B' },
      { name: 'Tax Documents',        count: 2, status: 'processing', color: '#EF4444' },
    ],
  },

};

// Investor pipeline — references company IDs + adds deal-level info
export const DEAL_PIPELINE = [
  { companyId: 'biz-001', dealColor: '#8B5CF6' },
  { companyId: 'biz-002', dealColor: '#3A6FF7' },
  {
    companyId: 'ext-001',
    dealColor: '#0D9488',
    externalData: {
      id: 'ext-001', name: 'CloudScale Systems', industry: 'Infrastructure', subIndustry: 'Cloud Infra',
      revenue: '$4.1M', revenueRaw: 4.1, ebitdaMargin: 22.3, growthRate: 14, grossMargin: 61,
      cashRunway: '12 mo', riskScore: 6.8, valuationLow: '$10.8M', valuationHigh: '$13.5M',
      status: 'needs-documents' as const, ebitdaRaw: '$914k',
      overview: 'CloudScale provides managed cloud infrastructure services to mid-sized Nigerian and Ghanaian enterprises. Strong customer base but margin pressure from global cloud pricing.',
      revenueHistory: [
        { year: '2023', revenue: 3200, cogs: 1760, opex: 960,  ebitda: 480  },
        { year: '2024', revenue: 3700, cogs: 2000, opex: 1110, ebitda: 590  },
        { year: '2025', revenue: 4100, cogs: 2200, opex: 985,  ebitda: 915  },
      ],
      cashFlow: [80,82,84,85,86,88,89,90,92,93,95,97],
      riskSignals: [
        { severity: 'high',   title: 'Missing Tax Documents',     desc: '2024 tax returns not yet submitted to platform',             confidence: 95, category: 'Compliance' },
        { severity: 'medium', title: 'Margin Compression Risk',   desc: 'AWS price changes could reduce margins by 4–6pp',           confidence: 83, category: 'Financial'  },
        { severity: 'low',    title: 'Stable Customer Base',      desc: 'Net revenue retention of 108% over last 12 months',         confidence: 89, category: 'Business'   },
      ],
      insights: [
        { type: 'warning',  title: 'Documents Incomplete',         desc: 'Tax documents needed before full analysis can complete.',   confidence: 95, source: 'System',               doc: 'Checklist',          time: '30 mins ago' },
        { type: 'positive', title: 'Net Revenue Retention Strong', desc: 'NRR of 108% indicates strong expansion within accounts.',  confidence: 89, source: 'Financial Statements', doc: 'Cohort Analysis',    time: '2 hours ago' },
        { type: 'neutral',  title: 'Moderate Growth Rate',         desc: '14% growth is in line with infrastructure sector average.', confidence: 81, source: 'Financial Statements', doc: 'P&L 2025',           time: '1 day ago'   },
      ],
      documentStatus: [
        { name: 'Financial Statements', count: 3, status: 'uploaded' as const,     color: '#8B5CF6' },
        { name: 'Bank Statements',      count: 4, status: 'uploaded' as const,     color: '#3A6FF7' },
        { name: 'Contracts',            count: 1, status: 'processing' as const,   color: '#F59E0B' },
        { name: 'Tax Documents',        count: 0, status: 'needs-review' as const, color: '#EF4444' },
      ],
    },
  },
  {
    companyId: 'ext-002',
    dealColor: '#6366F1',
    externalData: {
      id: 'ext-002', name: 'DataFlow Analytics', industry: 'Data & AI', subIndustry: 'Business Intelligence',
      revenue: '$2.9M', revenueRaw: 2.9, ebitdaMargin: 19.4, growthRate: 32, grossMargin: 74,
      cashRunway: '14 mo', riskScore: 7.5, valuationLow: '$7.8M', valuationHigh: '$9.5M',
      status: 'ready' as const, ebitdaRaw: '$563k',
      overview: 'DataFlow Analytics provides real-time business intelligence dashboards for retail and logistics companies. Fastest-growing company in the pipeline with strong product-market fit.',
      revenueHistory: [
        { year: '2023', revenue: 1800, cogs: 720,  opex: 810, ebitda: 270 },
        { year: '2024', revenue: 2300, cogs: 874,  opex: 943, ebitda: 483 },
        { year: '2025', revenue: 2900, cogs: 1015, opex: 900, ebitda: 985 },
      ],
      cashFlow: [48,52,57,60,65,69,74,78,83,87,92,98],
      riskSignals: [
        { severity: 'medium', title: 'Cash Runway Moderate',   desc: '14 months runway — needs raise or profitability path',           confidence: 88, category: 'Financial' },
        { severity: 'low',    title: 'Strong Product Metrics', desc: 'DAU/MAU ratio of 0.68 is best-in-class for B2B analytics',       confidence: 92, category: 'Product'   },
        { severity: 'medium', title: 'Sales Concentration',    desc: 'Top 2 sales reps closed 74% of new ARR in 2025',                 confidence: 80, category: 'Operational'},
      ],
      insights: [
        { type: 'positive', title: 'Fastest Growing in Pipeline',    desc: '32% YoY growth is highest across all reviewed companies.',  confidence: 93, source: 'Financial Statements', doc: 'Growth Analysis',    time: '4 hours ago' },
        { type: 'positive', title: 'Improving Unit Economics',       desc: 'CAC payback period dropped from 18 to 11 months.',          confidence: 87, source: 'Financial Statements', doc: 'Cohort Report',      time: '6 hours ago' },
        { type: 'warning',  title: 'Limited Cash Runway',            desc: 'At current burn, 14 months before needing additional capital.', confidence: 88, source: 'Bank Statements',  doc: 'Cash Analysis',      time: '1 day ago'   },
      ],
      documentStatus: [
        { name: 'Financial Statements', count: 3, status: 'uploaded' as const, color: '#8B5CF6' },
        { name: 'Bank Statements',      count: 5, status: 'uploaded' as const, color: '#3A6FF7' },
        { name: 'Contracts',            count: 3, status: 'uploaded' as const, color: '#F59E0B' },
        { name: 'Tax Documents',        count: 2, status: 'uploaded' as const, color: '#EF4444' },
      ],
    },
  },
];

export function getCompanyData(companyId: string): CompanyData | null {
  if (COMPANY_DATA[companyId]) return COMPANY_DATA[companyId];
  const deal = DEAL_PIPELINE.find((d) => d.companyId === companyId);
  if (deal?.externalData) return deal.externalData as CompanyData;
  return null;
}