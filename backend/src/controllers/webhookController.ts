import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { createAdminNotification } from '../services/notificationService.js';

interface RawBodyRequest extends Request {
  rawBody?: Buffer;
}

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'quickpick_shared_webhook_secret_2026';

/**
 * Validates HMAC-SHA256 signature against exact raw request body using timingSafeEqual
 */
export function verifyWebhookSignature(
  rawBody: Buffer | string,
  signatureHeader: string | undefined,
  secret: string = WEBHOOK_SECRET
): boolean {
  if (!signatureHeader || !rawBody) {
    return false;
  }

  try {
    const cleanSignature = signatureHeader.replace(/^sha256=/, '').trim();
    const hmac = crypto.createHmac('sha256', secret);
    const bodyBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody);
    hmac.update(bodyBuffer);
    const expectedHex = hmac.digest('hex');

    const signatureBuffer = Buffer.from(cleanSignature, 'hex');
    const expectedBuffer = Buffer.from(expectedHex, 'hex');

    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch (err) {
    return false;
  }
}

/**
 * POST /api/webhooks/payment
 * Production-grade payment webhook handler:
 * - HMAC-SHA256 timing-safe signature verification
 * - Strict idempotency tracking via WebhookEvent table
 * - Amount mismatch detection -> marks order NEEDS_REVIEW
 * - Safe late-payment policy on EXPIRED orders
 */
export const handlePaymentWebhook = async (req: RawBodyRequest, res: Response) => {
  try {
    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));
    const signature = (
      req.headers['x-webhook-signature'] ||
      req.headers['x-signature'] ||
      req.headers['x-razorpay-signature'] ||
      req.headers['authorization']
    ) as string | undefined;

    // 1. Signature Verification
    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn('⚠️ [WEBHOOK] Unauthorized webhook attempt: Invalid HMAC-SHA256 signature.');
      return res.status(401).json({
        success: false,
        error: 'Invalid webhook signature. HMAC-SHA256 verification failed.',
      });
    }

    const {
      eventId,
      eventType = 'payment.captured',
      orderId,
      orderNumber,
      amountPaise,
      rawPayload,
    } = req.body;

    if (!eventId) {
      return res.status(400).json({ success: false, error: 'eventId is required for idempotency tracking.' });
    }

    // 2. Strict Idempotency Check
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { eventId: String(eventId) },
    });

    if (existingEvent) {
      console.log(`ℹ️ [WEBHOOK] Idempotent replay detected for event ${eventId}. Status: ${existingEvent.status}`);
      return res.status(200).json({
        success: true,
        eventId,
        status: existingEvent.status,
        message: 'Event previously received and processed. Idempotent response returned.',
      });
    }

    // 3. Resolve Target Order
    const orderIdentifier = orderId || orderNumber;
    if (!orderIdentifier) {
      return res.status(400).json({ success: false, error: 'orderId or orderNumber must be provided.' });
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: String(orderIdentifier) },
          { orderNumber: String(orderIdentifier).toUpperCase() },
        ],
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, error: `Order ${orderIdentifier} not found.` });
    }

    const payloadString = rawPayload ? JSON.stringify(rawPayload) : JSON.stringify(req.body);

    // 4. Handle Event Types
    if (eventType === 'payment.captured') {
      const receivedAmount = amountPaise !== undefined ? Number(amountPaise) : order.totalPaise;

      // 4a. Amount Mismatch Detection
      if (receivedAmount !== order.totalPaise) {
        console.warn(
          `⚠️ [WEBHOOK] Amount discrepancy on Order #${order.orderNumber}. Expected ₹${order.totalPaise / 100}, received ₹${receivedAmount / 100}.`
        );

        await prisma.$transaction([
          prisma.order.update({
            where: { id: order.id },
            data: { status: 'NEEDS_REVIEW' },
          }),
          prisma.webhookEvent.create({
            data: {
              eventId: String(eventId),
              orderId: order.id,
              eventType,
              amountPaise: receivedAmount,
              signature: signature || 'verified',
              rawPayload: payloadString,
              status: 'AMOUNT_MISMATCH',
            },
          }),
        ]);

        createAdminNotification({
          title: `Payment Discrepancy: Order #${order.orderNumber}`,
          message: `Amount mismatch: Expected ₹${order.totalPaise / 100}, got ₹${receivedAmount / 100}. Flagged for review.`,
          type: 'warning',
        });

        return res.status(200).json({
          success: true,
          eventId,
          orderStatus: 'NEEDS_REVIEW',
          status: 'AMOUNT_MISMATCH',
          message: 'Order marked NEEDS_REVIEW due to amount discrepancy.',
        });
      }

      // 4b. Late Payment Policy on Expired Orders
      if (order.status === 'EXPIRED') {
        console.warn(`⚠️ [WEBHOOK] Late payment received for expired Order #${order.orderNumber}.`);

        // Attempt inventory re-reservation
        let canFulfill = true;
        for (const item of order.items) {
          const prod = await prisma.product.findUnique({ where: { id: item.productId } });
          if (!prod || prod.physicalStock < item.quantity) {
            canFulfill = false;
            break;
          }
        }

        if (canFulfill) {
          // Re-deduct physicalStock and restore to PAID
          await prisma.$transaction(async (tx) => {
            for (const item of order.items) {
              await tx.product.update({
                where: { id: item.productId },
                data: { physicalStock: { decrement: item.quantity } },
              });
            }

            await tx.order.update({
              where: { id: order.id },
              data: { status: 'PAID' },
            });

            if (order.lockerNumber) {
              await tx.smartLocker.updateMany({
                where: { number: order.lockerNumber },
                data: { status: 'OCCUPIED' },
              });
            }

            await tx.webhookEvent.create({
              data: {
                eventId: String(eventId),
                orderId: order.id,
                eventType,
                amountPaise: receivedAmount,
                signature: signature || 'verified',
                rawPayload: payloadString,
                status: 'PROCESSED',
              },
            });
          });

          createAdminNotification({
            title: `Late Payment Fulfilled: Order #${order.orderNumber}`,
            message: `Late payment received and stock re-reserved. Order is now PAID.`,
            type: 'info',
          });

          return res.status(200).json({
            success: true,
            eventId,
            orderStatus: 'PAID',
            status: 'PROCESSED',
            message: 'Late payment honored and stock re-reserved.',
          });
        } else {
          // Cannot fulfill: mark NEEDS_REVIEW for refund
          await prisma.$transaction([
            prisma.order.update({
              where: { id: order.id },
              data: { status: 'NEEDS_REVIEW' },
            }),
            prisma.webhookEvent.create({
              data: {
                eventId: String(eventId),
                orderId: order.id,
                eventType,
                amountPaise: receivedAmount,
                signature: signature || 'verified',
                rawPayload: payloadString,
                status: 'LATE_PAYMENT',
              },
            }),
          ]);

          createAdminNotification({
            title: `Late Payment - Stock Unavailable: #${order.orderNumber}`,
            message: `Payment received after 120s window, but stock has already been released to another patron. Manual refund required.`,
            type: 'warning',
          });

          return res.status(200).json({
            success: true,
            eventId,
            orderStatus: 'NEEDS_REVIEW',
            status: 'LATE_PAYMENT',
            message: 'Order marked NEEDS_REVIEW: payment received but stock was released.',
          });
        }
      }

      // 4c. Standard Payment Capture (Order is UNPAID)
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: { status: 'PAID' },
        });

        if (order.lockerNumber) {
          await tx.smartLocker.updateMany({
            where: { number: order.lockerNumber },
            data: { status: 'OCCUPIED' },
          });
        }

        await tx.webhookEvent.create({
          data: {
            eventId: String(eventId),
            orderId: order.id,
            eventType,
            amountPaise: receivedAmount,
            signature: signature || 'verified',
            rawPayload: payloadString,
            status: 'PROCESSED',
          },
        });
      });

      createAdminNotification({
        title: `Payment Captured: #${order.orderNumber}`,
        message: `Verified UPI payment of ₹${order.totalPaise / 100} received via webhook. Compartment ${order.lockerNumber || 'N/A'} armed.`,
        type: 'success',
      });

      return res.status(200).json({
        success: true,
        eventId,
        orderStatus: 'PAID',
        status: 'PROCESSED',
        message: `Order #${order.orderNumber} successfully marked PAID.`,
      });
    }

    // 4d. Handle Payment Failed
    if (eventType === 'payment.failed') {
      await prisma.webhookEvent.create({
        data: {
          eventId: String(eventId),
          orderId: order.id,
          eventType,
          amountPaise: amountPaise !== undefined ? Number(amountPaise) : null,
          signature: signature || 'verified',
          rawPayload: payloadString,
          status: 'IGNORED',
        },
      });

      createAdminNotification({
        title: `Payment Failed: #${order.orderNumber}`,
        message: `Payment gateway reported failure for Order #${order.orderNumber}. Stock hold remains active until 120s expiry.`,
        type: 'warning',
      });

      return res.status(200).json({
        success: true,
        eventId,
        status: 'IGNORED',
        message: 'Payment failure logged.',
      });
    }

    return res.status(400).json({ success: false, error: `Unhandled eventType: ${eventType}` });
  } catch (error: any) {
    console.error('❌ [WEBHOOK ERROR]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
