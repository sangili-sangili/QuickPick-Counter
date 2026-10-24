import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/server.js';
import { prisma } from '../../src/config/prisma.js';

describe('Concurrency & Atomic Transactions Integration Tests', () => {
  let testCustomer: any;
  let testProduct: any;
  let testCategory: any;

  beforeAll(async () => {
    // Setup test category
    testCategory = await prisma.category.upsert({
      where: { name: 'Concurrency Test Cat' },
      update: {},
      create: {
        name: 'Concurrency Test Cat',
        description: 'Category for concurrency testing',
      },
    });

    // Create a customer for orders
    testCustomer = await prisma.customer.findFirst();
    if (!testCustomer) {
      const user = await prisma.user.create({
        data: {
          name: 'Concurrent Tester',
          email: `tester_${Date.now()}@quickpick.test`,
          password: 'hashedpassword',
          role: 'CUSTOMER',
        },
      });
      testCustomer = await prisma.customer.create({
        data: {
          userId: user.id,
          name: user.name,
          email: user.email,
          balancePaise: 100000,
        },
      });
    }
  });

  afterAll(async () => {
    // Cleanup created test records
    if (testProduct) {
      await prisma.orderItem.deleteMany({ where: { productId: testProduct.id } });
      await prisma.product.deleteMany({ where: { id: testProduct.id } });
    }
    if (testCategory) {
      await prisma.category.deleteMany({ where: { id: testCategory.id } });
    }
  });

  it('Verifies 10 concurrent orders competing for final 2 units result in zero overselling and exactly 2 units held', async () => {
    // Create a test product with exactly 2 units of physical stock
    testProduct = await prisma.product.create({
      data: {
        name: `Scarcity Snack ${Date.now()}`,
        pricePaise: 5000, // ₹50.00
        physicalStock: 2, // Only 2 units!
        image: '/images/test.jpg',
        categoryId: testCategory.id,
      },
    });

    // Fire 10 simultaneous orders competing for 1 unit each
    const concurrentRequests = Array.from({ length: 10 }).map(() =>
      request(app)
        .post('/api/orders')
        .send({
          items: [{ productId: testProduct.id, quantity: 1 }],
          customerId: testCustomer.id,
          paymentMethod: 'upi',
        })
    );

    const responses = await Promise.all(concurrentRequests);

    const successfulOrders = responses.filter((r) => r.status === 201);
    const failedOrders = responses.filter((r) => r.status === 400);

    // Exactly 2 orders must succeed
    expect(successfulOrders.length).toBe(2);

    // Remaining 8 orders must be rejected with 400 Bad Request
    expect(failedOrders.length).toBe(8);

    // Check physical stock in database — must be exactly 0, never negative!
    const refreshedProduct = await prisma.product.findUnique({
      where: { id: testProduct.id },
    });

    expect(refreshedProduct?.physicalStock).toBe(0);
  });

  it('Verifies two simultaneous pickup claims on the same order result in exactly one success and one HTTP 409 Conflict', async () => {
    // 1. Create a paid order ready for pickup
    const orderNumber = `CLAIM_TEST_${Date.now().toString().slice(-4)}`;
    const paidOrder = await prisma.order.create({
      data: {
        orderNumber,
        totalPaise: 5000,
        status: 'PAID',
        expiresAt: new Date(Date.now() + 120000),
        lockerNumber: 'L-01',
        customerId: testCustomer.id,
      },
    });

    // 2. Fire 2 simultaneous pickup claims on the exact same order
    const [res1, res2] = await Promise.all([
      request(app).post(`/api/orders/${paidOrder.id}/pickup-claim`),
      request(app).post(`/api/orders/${paidOrder.id}/pickup-claim`),
    ]);

    const statuses = [res1.status, res2.status].sort();

    // Exactly one 200 OK and one 409 Conflict
    expect(statuses).toEqual([200, 409]);

    // Order status in database must be CLAIMED
    const verifiedOrder = await prisma.order.findUnique({
      where: { id: paidOrder.id },
    });

    expect(verifiedOrder?.status).toBe('CLAIMED');
    expect(verifiedOrder?.pickupClaimedAt).toBeDefined();

    // Cleanup test order
    await prisma.order.delete({ where: { id: paidOrder.id } });
  });

  it('Rejects pickup claim with HTTP 400 if order is UNPAID', async () => {
    const unpaidOrder = await prisma.order.create({
      data: {
        orderNumber: `UNPAID_TEST_${Date.now().toString().slice(-4)}`,
        totalPaise: 3000,
        status: 'UNPAID',
        expiresAt: new Date(Date.now() + 120000),
        lockerNumber: 'L-02',
        customerId: testCustomer.id,
      },
    });

    const res = await request(app).post(`/api/orders/${unpaidOrder.id}/pickup-claim`);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Must be PAID');

    await prisma.order.delete({ where: { id: unpaidOrder.id } });
  });
});
