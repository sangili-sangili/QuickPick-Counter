import { Response } from 'express';
import { OrderStatus } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';
import { EntityDeletionService } from '../services/entityDeletionService.js';

export const getAdminOrders = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: { product: true },
        },
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const transformed = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerId: o.customerId || undefined,
      customerName: o.customer?.name || 'Kiosk Patron',
      items: o.items.map((i) => ({
        product: {
          id: i.product.id,
          name: i.product.name,
          pricePaise: i.product.pricePaise,
          stock: i.product.physicalStock,
          category: 'Snacks' as any,
          image: i.product.image,
        },
        quantity: i.quantity,
      })),
      totalPaise: o.totalPaise,
      totalRupees: o.totalPaise / 100,
      status: o.status.toLowerCase(),
      lockerNumber: o.lockerNumber || undefined,
      createdAt: o.createdAt.toISOString(),
      displayTime: o.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      expiresInSeconds: Math.max(0, Math.floor((new Date(o.expiresAt).getTime() - Date.now()) / 1000)),
      expiresAt: new Date(o.expiresAt).getTime(),
    }));

    return res.status(200).json({ success: true, orders: transformed });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAdminOrderStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const prismaStatus = String(status).toUpperCase() as OrderStatus;
    if (!Object.values(OrderStatus).includes(prismaStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid order status' });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status: prismaStatus },
    });

    return res.status(200).json({
      success: true,
      id: order.id,
      status: order.status.toLowerCase(),
      message: `Order #${order.orderNumber} updated to ${order.status}.`,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const simulateAdminOrder = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const products = await prisma.product.findMany({ take: 3 });
    if (products.length === 0) {
      return res.status(400).json({ success: false, message: 'No products available to simulate order' });
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD${randomNum}`;
    const p1 = products[0];
    const p2 = products[1] || products[0];
    const totalPaise = p1.pricePaise + p2.pricePaise;

    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        totalPaise,
        status: OrderStatus.UNPAID,
        expiresAt: new Date(Date.now() + 120000),
        items: {
          create: [
            { productId: p1.id, quantity: 1, unitPricePaise: p1.pricePaise },
            { productId: p2.id, quantity: 1, unitPricePaise: p2.pricePaise },
          ],
        },
      },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    return res.status(201).json({
      success: true,
      order: {
        id: newOrder.id,
        orderNumber: newOrder.orderNumber,
        items: newOrder.items.map((i) => ({
          product: {
            id: i.product.id,
            name: i.product.name,
            pricePaise: i.product.pricePaise,
            stock: i.product.physicalStock,
            category: 'Snacks' as any,
            image: i.product.image,
          },
          quantity: i.quantity,
        })),
        totalPaise: newOrder.totalPaise,
        totalRupees: newOrder.totalPaise / 100,
        status: 'unpaid',
        createdAt: newOrder.createdAt.toISOString(),
        displayTime: 'Just now',
        expiresInSeconds: 120,
        expiresAt: new Date(newOrder.expiresAt).getTime(),
      },
      message: `Simulated new incoming order #${orderNumber}`,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAdminOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await EntityDeletionService.deleteOrder(id);
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
