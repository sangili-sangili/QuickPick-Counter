import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { verifyWebhookSignature } from '../../src/controllers/webhookController.js';

describe('Security & HMAC-SHA256 Verification Unit Tests', () => {
  const secret = 'test_webhook_secret_key_12345';
  const samplePayload = JSON.stringify({
    eventId: 'evt_unit_test',
    eventType: 'payment.captured',
    amountPaise: 5000,
  });

  it('Validates a correct HMAC-SHA256 signature', () => {
    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(Buffer.from(samplePayload))
      .digest('hex');

    const result = verifyWebhookSignature(samplePayload, validSignature, secret);
    expect(result).toBe(true);
  });

  it('Validates signature prefixed with sha256=', () => {
    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(Buffer.from(samplePayload))
      .digest('hex');

    const result = verifyWebhookSignature(samplePayload, `sha256=${validSignature}`, secret);
    expect(result).toBe(true);
  });

  it('Rejects signature when payload has been tampered with', () => {
    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(Buffer.from(samplePayload))
      .digest('hex');

    const tamperedPayload = samplePayload.replace('5000', '1000');
    const result = verifyWebhookSignature(tamperedPayload, validSignature, secret);
    expect(result).toBe(false);
  });

  it('Rejects signature with wrong secret', () => {
    const invalidSignature = crypto
      .createHmac('sha256', 'wrong_secret')
      .update(Buffer.from(samplePayload))
      .digest('hex');

    const result = verifyWebhookSignature(samplePayload, invalidSignature, secret);
    expect(result).toBe(false);
  });

  it('Rejects malformed signature gracefully without throwing exception', () => {
    expect(verifyWebhookSignature(samplePayload, 'not-a-valid-hex-sig', secret)).toBe(false);
    expect(verifyWebhookSignature(samplePayload, '', secret)).toBe(false);
    expect(verifyWebhookSignature(samplePayload, undefined, secret)).toBe(false);
  });
});
