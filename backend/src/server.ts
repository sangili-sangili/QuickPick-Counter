import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

import { prisma } from './config/prisma.js';
import customerRoutes from './routes/customerRoutes.js';
import customerWebRoutes from './routes/customerWebRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import kioskRoutes from './routes/kioskRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import { startStockRevertCron, revertExpiredOrdersAndStock } from './services/stockRevertCronJob.js';

// Mount API routes
app.use('/api', kioskRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/payments/webhook', webhookRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/customer', customerWebRoutes);

// Manual trigger for stock reversion if needed
app.post('/api/orders/revert-expired', async (_req, res) => {
  const result = await revertExpiredOrdersAndStock();
  res.json({ success: true, ...result });
});

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

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`🚀 QuickPick Counter Backend running on port ${port}`);
    // Start the background cron job for automatic stock & locker reversion
    startStockRevertCron(10000); // Check every 10 seconds
  });
}

export default app;
