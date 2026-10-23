import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

import { prisma } from './config/prisma.js';
import customerRoutes from './routes/customerRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import kioskRoutes from './routes/kioskRoutes.js';

app.use('/api', kioskRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/customers', customerRoutes);

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'ok',
      service: 'quickpick-counter-backend',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      service: 'quickpick-counter-backend',
      database: 'disconnected',
      error: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 QuickPick Counter Backend running on port ${port}`);
});

export default app;
