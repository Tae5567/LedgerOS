// server/src/index.ts
import express    from 'express';
import cors       from 'cors';
import helmet     from 'helmet';
import morgan     from 'morgan';
import dotenv     from 'dotenv';
dotenv.config();

import authRoutes        from './routes/auth';
import documentRoutes    from './routes/documents';
import financialRoutes   from './routes/financials';
import dealRoutes        from './routes/deals';
import insightRoutes     from './routes/insights';
import riskSignalRoutes  from './routes/risk-signals';
import companyRoutes     from './routes/companies';

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/auth',         authRoutes);
app.use('/api/documents',    documentRoutes);
app.use('/api/financials',   financialRoutes);
app.use('/api/deals',        dealRoutes);
app.use('/api/insights',     insightRoutes);
app.use('/api/risk-signals', riskSignalRoutes);
app.use('/api/companies',    companyRoutes);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ LedgerOS server running on port ${PORT}`));