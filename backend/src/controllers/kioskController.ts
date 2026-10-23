import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

/**
 * GET /api/products
 * Returns active products with optional category, search, and sort filters
 */
export const getKioskProducts = async (req: Request, res: Response) => {
  try {
    const { category, search, sort, limit } = req.query;

    const whereClause: any = {
      isActive: true, // Only active products for customer web/kiosk
    };

    if (category && category !== 'All') {
      whereClause.OR = [
        { category: { name: { equals: String(category), mode: 'insensitive' } } },
        { categoryId: String(category) },
      ];
    }

    if (search && String(search).trim() !== '') {
      const q = String(search).trim();
      whereClause.AND = [
        {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { subtitle: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { category: { name: { contains: q, mode: 'insensitive' } } },
          ],
        },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'price_asc') orderBy = { pricePaise: 'asc' };
    if (sort === 'price_desc') orderBy = { pricePaise: 'desc' };
    if (sort === 'rating') orderBy = { rating: 'desc' };
    if (sort === 'popular') orderBy = { ratingCount: 'desc' };

    const take = limit ? parseInt(String(limit), 10) : undefined;

    const products = await prisma.product.findMany({
      where: whereClause,
      include: { category: true },
      orderBy,
      take,
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

/**
 * GET /api/products/search
 * Fast debounced search across active products
 */
export const searchProducts = async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q || req.query.query || '').trim();

    if (!q) {
      return res.status(200).json([]);
    }

    const searchConditions: any[] = [];
    const lower = q.toLowerCase();

    // Base query condition
    searchConditions.push(
      { name: { contains: q, mode: 'insensitive' } },
      { subtitle: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { category: { name: { contains: q, mode: 'insensitive' } } }
    );

    // Smart aliases
    if (lower.includes('coke')) {
      searchConditions.push({ name: { contains: 'Coca-Cola', mode: 'insensitive' } });
    }
    if (lower.includes('chips') || lower.includes('wafers')) {
      searchConditions.push({ name: { contains: "Lay's", mode: 'insensitive' } }, { name: { contains: 'Pringles', mode: 'insensitive' } });
    }
    if (lower.includes('soda') || lower.includes('cold drink')) {
      searchConditions.push({ category: { name: { contains: 'Drinks', mode: 'insensitive' } } });
    }

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: searchConditions,
      },
      include: { category: true },
      take: 10,
      orderBy: { ratingCount: 'desc' },
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

/**
 * GET /api/products/:id
 * Single product details
 */
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.status(200).json({
      id: product.id,
      name: product.name,
      subtitle: product.subtitle || '',
      description: product.description || '',
      pricePaise: product.pricePaise,
      regularPricePaise: product.regularPricePaise || product.pricePaise,
      offerPricePaise: product.offerPricePaise || product.pricePaise,
      stock: product.physicalStock,
      category: product.category?.name || 'Others',
      categoryId: product.categoryId,
      image: product.image,
      galleryImages: product.galleryImages,
      badge: product.badge || undefined,
      badgeType: (product.badgeType as any) || undefined,
      rating: product.rating,
      ratingCount: product.ratingCount,
      isActive: product.isActive,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/orders
 * Creates order with stock verification and Smart Locker allocation
 */
export const createKioskOrder = async (req: Request, res: Response) => {
  try {
    const { items, customerId, paymentMethod } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order items are required.' });
    }

    // 1. Fetch products and check physical stock in database
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
      if (dbProd.physicalStock < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for "${dbProd.name}". Only ${dbProd.physicalStock} available.`,
        });
      }
      const unitPrice = dbProd.pricePaise;
      totalPaise += unitPrice * item.quantity;
      orderItemsData.push({
        productId: dbProd.id,
        quantity: item.quantity,
        unitPricePaise: unitPrice,
      });
    }

    // 2. Customer balance check if paying via Wallet
    if (paymentMethod === 'wallet' && customerId) {
      const customer = await prisma.customer.findUnique({ where: { id: customerId } });
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found.' });
      }
      if (customer.balancePaise < totalPaise) {
        return res.status(400).json({
          error: `Insufficient wallet balance. Required ₹${totalPaise / 100}, available ₹${customer.balancePaise / 100}.`,
        });
      }
    }

    // 3. Find an available Smart Locker
    const freeLocker = await prisma.smartLocker.findFirst({
      where: { status: 'AVAILABLE' },
      orderBy: { number: 'asc' },
    });

    const orderNumber = `ORD${Math.floor(1000 + Math.random() * 9000)}`;
    const expiresAt = new Date(Date.now() + 120 * 1000); // 120 seconds payment window

    // 4. Transaction: Create Order, Reserve Locker, Deduct Physical Stock (Stock Hold)
    const result = await prisma.$transaction(async (tx) => {
      // Deduct stock for hold
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            physicalStock: { decrement: item.quantity },
          },
        });
      }

      // If paying via wallet immediately
      if (paymentMethod === 'wallet' && customerId) {
        await tx.customer.update({
          where: { id: customerId },
          data: {
            balancePaise: { decrement: totalPaise },
          },
        });
      }

      // Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          totalPaise,
          status: paymentMethod === 'wallet' ? 'PAID' : 'UNPAID',
          expiresAt,
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

      // Reserve Smart Locker
      if (freeLocker) {
        await tx.smartLocker.update({
          where: { id: freeLocker.id },
          data: {
            status: paymentMethod === 'wallet' ? 'OCCUPIED' : 'RESERVED',
            assignedAt: new Date(),
          },
        });
      }

      return newOrder;
    });

    return res.status(201).json({
      success: true,
      orderId: result.id,
      orderNumber: result.orderNumber,
      totalPaise: result.totalPaise,
      lockerNumber: result.lockerNumber,
      status: result.status,
      expiresInSeconds: 120,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/orders/:orderId/pickup-claim
 * Customer claims product pickup at Smart Locker
 */
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
      data: {
        status: 'CLAIMED',
        pickupClaimedAt: new Date(),
      },
    });

    // Free associated locker back to AVAILABLE
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

    return res.status(200).json({
      success: true,
      message: 'Dispenser compartment unlocked. Items collected successfully.',
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/orders/:orderId/pay
 * Simulates or confirms UPI / Card payment within 120s
 */
export const confirmOrderPayment = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (order.status === 'EXPIRED') {
      return res.status(400).json({ error: 'Order has expired. Please place a new order.' });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'PAID' },
    });

    // Update locker to OCCUPIED
    if (order.lockerNumber) {
      await prisma.smartLocker.updateMany({
        where: { number: order.lockerNumber },
        data: { status: 'OCCUPIED' },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Payment confirmed successfully.',
      order: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
