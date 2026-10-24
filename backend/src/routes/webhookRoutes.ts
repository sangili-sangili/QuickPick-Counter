import { Router } from 'express';
import { handlePaymentWebhook } from '../controllers/webhookController.js';

const router = Router();

// Primary webhook endpoint
router.post('/payment', handlePaymentWebhook);

// Direct root payment webhook for gateways configured with /api/payments/webhook
router.post('/', handlePaymentWebhook);

export default router;
