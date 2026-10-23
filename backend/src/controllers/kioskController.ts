import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

export const getKioskProducts = async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });

    const transformed = products.map((p) => ({
      id: p.id,
      name: p.name,
      subtitle: p.subtitle || '',
      description: p.description || '',
      pricePaise: p.pricePaise,
      regularPricePaise: p.regularPricePaise || p.pricePaise,
      offerPricePaise: p.offerPricePaise || p.pricePaise,
      stock: p.physicalStock,
      category: p.category?.name || 'Others',
      categoryId: p.categoryId,
      image: p.image,
      galleryImages: p.galleryImages,
      badge: p.badge || undefined,
      badgeType: (p.badgeType as any) || undefined,
      rating: p.rating,
      ratingCount: p.ratingCount,
      isActive: p.isActive,
    }));

    return res.status(200).json(transformed);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const createKioskOrder = async (req: Request, res: Response) => {
  try {
    const { items, customerId } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order items are required.' });
    }

    // 1. Fetch products to calculate exact totalPaise from database
    const productIds = items.map((i: any) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    let totalPaise = 0;
    const orderItemsData: any[] = [];

    for (const item of items) {
      const dbProd = productMap.get(item.productId);
      if (!dbProd) {
        return res.status(404).json({ error: `Product ${item.productId} not found.` });
      }
      const unitPrice = dbProd.pricePaise;
      totalPaise += unitPrice * item.quantity;
      orderItemsData.push({
        productId: dbProd.id,
        quantity: item.quantity,
        unitPricePaise: unitPrice,
      });
    }

    // 2. Find an available Smart Locker
    const freeLocker = await prisma.smartLocker.findFirst({
      where: { status: 'AVAILABLE' },
      orderBy: { number: 'asc' },
    });

    const orderNumber = `ORD${Math.floor(1000 + Math.random() * 9000)}`;

    // 3. Create Order
    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        totalPaise,
        status: 'UNPAID',
        expiresAt: new Date(Date.now() + 120 * 1000), // 2 minutes
        lockerNumber: freeLocker?.number || 'L-01',
        customerId: customerId || null,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: { include: { product: true } },
      },
    });

    // 4. If locker available, reserve it
    if (freeLocker) {
      await prisma.smartLocker.update({
        where: { id: freeLocker.id },
        data: {
          status: 'RESERVED',
          assignedAt: new Date(),
        },
      });
    }

    return res.status(201).json({
      success: true,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      totalPaise: newOrder.totalPaise,
      lockerNumber: newOrder.lockerNumber,
      expiresInSeconds: 120,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const claimKioskPickup = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CLAIMED' },
    });

    // Free associated locker
    if (order.lockerNumber) {
      await prisma.smartLocker.updateMany({
        where: { number: order.lockerNumber },
        data: {
          status: 'AVAILABLE',
          assignedAt: null,
          doorState: 'locked',
        },
      });
    }

    return res.status(200).json({ success: true, message: 'Pickup claimed successfully.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
