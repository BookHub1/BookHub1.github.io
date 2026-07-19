import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  origin: (process.env.WEB_ORIGIN || 'https://BookHub1.github.io'),
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
  })
);

app.get('/healthz', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`BookHub backend listening on :${port}`);
});

