import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import captureRoutes from './routes/captures.js';
import analysisRoutes from './routes/analysis.js';
import rulesRoutes from './routes/rules.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/captures', captureRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/rules', rulesRoutes);

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Packet Analyzer API' });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('DB connection failed:', err);
  process.exit(1);
});
