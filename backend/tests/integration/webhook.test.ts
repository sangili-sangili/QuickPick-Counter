import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import app from '../../src/server.js';
import { prisma } from '../../src/config/prisma.js';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'quickpick_shared_webhook_secret_2026';

function signPayload(payload: any, secret = WEBHOOK_SECRET): string {
  const raw = JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(raw).digest('hex');
}

describe('Payment Webhook HMAC & Idempotency Integration Tests', () => {
  let testOrder: any;

  beforeAll(async () => {
    testOrder = await prisma.order.create({
      data: {
        orderNumber: `WH_TEST_${Date.now().toString().slice(-4)}`,
        totalPaise: 12500, // ₹125.00
        status: 'UNPAID',
        expiresAt: new Date(Date.now() + 120000),
        lockerNumber: 'L-03',
      },
    });
  });

  afterAll(async () => {
    if (testOrder) {
      await prisma.webhookEvent.deleteMany({ where: { orderId: testOrder.id } });
      await prisma.order.deleteMany({ where: { id: testOrder.id } });
    }
  });

  it('Rejects webhook request with 401 Unauthorized when HMAC signature is invalid or tampered', async () => {
    const payload = {
      eventId: `evt_tamper_${Date.now()}`,
      eventType: 'payment.captured',
      orderId: testOrder.id,
      amountPaise: 12500,
    };

    const res = await request(app)
      .post('/api/webhooks/payment')
      .set('X-Webhook-Signature', 'sha256=invalid_tampered_signature_hex')
      .send(payload);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('HMAC-SHA256');
  });

  it('Successfully processes valid signed payment webhook and transitions order to PAID', async () => {
    const eventId = `evt_valid_${Date.now()}`;
    const payload = {
      eventId,
      eventType: 'payment.captured',
      orderId: testOrder.id,
      amountPaise: 12500,
    };

    const signature = signPayload(payload);

    const res = await request(app)
      .post('/api/webhooks/payment')
      .set('X-Webhook-Signature', `sha256=${signature}`)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.orderStatus).toBe('PAID');
    expect(res.body.status).toBe('PROCESSED');

    // Verify order in database is now PAID
    const verifiedOrder = await prisma.order.findUnique({
      where: { id: testOrder.id },
    });
    expect(verifiedOrder?.status).toBe('PAID');

    // Verify WebhookEvent record exists
    const eventRecord = await prisma.webhookEvent.findUnique({
      where: { eventId },
    });
    expect(eventRecord).toBeDefined();
    expect(eventRecord?.status).toBe('PROCESSED');
  });

  it('Guarantees strict idempotency: replaying the same webhook eventId returns 200 without duplicate processing', async () => {
    const eventId = `evt_replay_${Date.now()}`;
    const payload = {
      eventId,
      eventType: 'payment.captured',
      orderId: testOrder.id,
      amountPaise: 12500,
    };

    const signature = signPayload(payload);

    // First call
    const res1 = await request(app)
      .post('/api/webhooks/payment')
      .set('X-Webhook-Signature', `sha256=${signature}`)
      .send(payload);

    expect(res1.status).toBe(200);

    // Second call with EXACT SAME eventId (replay simulation)
    const res2 = await request(app)
      .post('/api/webhooks/payment')
      .set('X-Webhook-Signature', `sha256=${signature}`)
      .send(payload);

    expect(res2.status).toBe(200);
    expect(res2.body.message).toContain('Idempotent response returned');

    // Verify only 1 webhook event record was created for this eventId
    const count = await prisma.webhookEvent.count({
      where: { eventId },
    });
    expect(count).toBe(1);
  });

  it('Detects amount discrepancy and transitions order to NEEDS_REVIEW', async () => {
    const mismatchOrder = await prisma.order.create({
      data: {
        orderNumber: `MISMATCH_${Date.now().toString().slice(-4)}`,
        totalPaise: 25000, // ₹250.00
        status: 'UNPAID',
        expiresAt: new Date(Date.now() + 120000),
        lockerNumber: 'L-04',
      },
    });

    const eventId = `evt_mismatch_${Date.now()}`;
    const payload = {
      eventId,
      eventType: 'payment.captured',
      orderId: mismatchOrder.id,
      amountPaise: 10000, // Only ₹100.00! Discrepancy!
    };

    const signature = signPayload(payload);

    const res = await request(app)
      .post('/api/webhooks/payment')
      .set('X-Webhook-Signature', `sha256=${signature}`)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.orderStatus).toBe('NEEDS_REVIEW');
    expect(res.body.status).toBe('AMOUNT_MISMATCH');

    const verifiedOrder = await prisma.order.findUnique({
      where: { id: mismatchOrder.id },
    });
    expect(verifiedOrder?.status).toBe('NEEDS_REVIEW');

    // Cleanup
    await prisma.webhookEvent.deleteMany({ where: { orderId: mismatchOrder.id } });
    await prisma.order.delete({ where: { id: mismatchOrder.id } });
  });
});
