import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/config/prisma.js';
import { revertExpiredOrdersAndStock } from '../../src/services/stockRevertCronJob.js';

describe('Stock Reversion Cron Job Integration Tests', () => {
  let testProduct: any;
  let testOrder: any;

  beforeAll(async () => {
    testProduct = await prisma.product.create({
      data: {
        name: `Revert Test Item ${Date.now()}`,
        pricePaise: 4000,
        physicalStock: 10,
        image: '/images/revert.jpg',
      },
    });

    // Simulate an order that was placed with stock hold, and has now passed 120s
    // (expiresAt set to 5 seconds in the past)
    testOrder = await prisma.order.create({
      data: {
        orderNumber: `EXPIRE_TEST_${Date.now().toString().slice(-4)}`,
        totalPaise: 4000,
        status: 'UNPAID',
        expiresAt: new Date(Date.now() - 5000), // In the past! Expired!
        lockerNumber: 'L-05',
        items: {
          create: [
            {
              productId: testProduct.id,
              quantity: 2,
              unitPricePaise: 4000,
            },
          ],
        },
      },
    });
  });

  afterAll(async () => {
    if (testOrder) {
      await prisma.orderItem.deleteMany({ where: { orderId: testOrder.id } });
      await prisma.order.deleteMany({ where: { id: testOrder.id } });
    }
    if (testProduct) {
      await prisma.product.deleteMany({ where: { id: testProduct.id } });
    }
  });

  it('Automatically detects expired UNPAID orders, marks them EXPIRED, and replenishes physical stock', async () => {
    const initialStock = testProduct.physicalStock; // 10

    // Run reversion job
    const result = await revertExpiredOrdersAndStock();

    expect(result.expiredCount).toBeGreaterThanOrEqual(1);

    // Verify order transitioned to EXPIRED
    const verifiedOrder = await prisma.order.findUnique({
      where: { id: testOrder.id },
    });
    expect(verifiedOrder?.status).toBe('EXPIRED');

    // Verify product physicalStock was incremented by 2
    const refreshedProduct = await prisma.product.findUnique({
      where: { id: testProduct.id },
    });
    expect(refreshedProduct?.physicalStock).toBe(initialStock + 2);
  });

  it('Guarantees reversion idempotency: subsequent executions do not double-increment physical stock', async () => {
    const beforeStock = (
      await prisma.product.findUnique({ where: { id: testProduct.id } })
    )?.physicalStock;

    // Run reversion job again immediately
    await revertExpiredOrdersAndStock();

    const afterStock = (
      await prisma.product.findUnique({ where: { id: testProduct.id } })
    )?.physicalStock;

    // Stock must remain unchanged! No double increment!
    expect(afterStock).toBe(beforeStock);
  });
});
