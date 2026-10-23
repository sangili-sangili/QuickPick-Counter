import { Response } from 'express';
import { prisma } from '../config/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // 1. Fetch Products metrics
    const products = await prisma.product.findMany({
      orderBy: { physicalStock: 'asc' },
    });

    const totalProducts = products.length;
    const activeProducts = products.filter((p) => p.isActive).length;
    const inactiveProducts = totalProducts - activeProducts;
    const lowStockProducts = products.filter((p) => p.physicalStock <= 5);
    const lowStockCount = lowStockProducts.length;

    // 2. Fetch Orders metrics
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: { product: true },
        },
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalOrders = orders.length;
    const paidOrders = orders.filter((o) => o.status === 'PAID' || o.status === 'CLAIMED').length;
    const pendingOrders = orders.filter((o) => o.status === 'UNPAID').length;
    const expiredOrders = orders.filter((o) => o.status === 'EXPIRED').length;
    const needsReviewOrders = orders.filter((o) => o.status === 'NEEDS_REVIEW').length;
    const claimedOrders = orders.filter((o) => o.status === 'CLAIMED').length;

    const totalRevenuePaise = orders
      .filter((o) => o.status === 'PAID' || o.status === 'CLAIMED')
      .reduce((sum, o) => sum + o.totalPaise, 0);

    // 3. Fetch Smart Lockers telemetry
    const lockers = await prisma.smartLocker.findMany({
      orderBy: { number: 'asc' },
    });

    const totalLockers = lockers.length;
    const availableLockersCount = lockers.filter((l) => l.status === 'AVAILABLE').length;
    const inUseLockersCount = lockers.filter((l) => l.status === 'OCCUPIED' || l.status === 'RESERVED').length;
    const maintenanceLockersCount = lockers.filter((l) => l.status === 'OUT_OF_SERVICE').length;

    // 4. Format Recent Orders (top 6)
    const recentOrders = orders.slice(0, 6).map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      totalPaise: o.totalPaise,
      totalRupees: o.totalPaise / 100,
      status: o.status.toLowerCase(),
      lockerNumber: o.lockerNumber || null,
      customerName: o.customer?.name || 'Kiosk Guest',
      createdAt: o.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      itemCount: o.items.reduce((sum, item) => sum + item.quantity, 0),
      itemsSummary: o.items.map((i) => `${i.product.name} (x${i.quantity})`).join(', '),
    }));

    // 5. Weekly Analytics Summary
    const sampleWeeklyAnalytics = [
      { day: 'Mon', revenue: 1450, orders: 18, heightPct: 45 },
      { day: 'Tue', revenue: 2100, orders: 26, heightPct: 65 },
      { day: 'Wed', revenue: 1800, orders: 22, heightPct: 55 },
      { day: 'Thu', revenue: 2600, orders: 32, heightPct: 80 },
      { day: 'Fri', revenue: 3200, orders: 40, heightPct: 100 },
      { day: 'Sat', revenue: 2900, orders: 36, heightPct: 90 },
      { day: 'Sun', revenue: 2400, orders: 30, heightPct: 75 },
    ];

    return res.status(200).json({
      success: true,
      stats: {
        products: {
          total: totalProducts,
          active: activeProducts,
          inactive: inactiveProducts,
          lowStockCount,
        },
        orders: {
          total: totalOrders,
          paid: paidOrders,
          pending: pendingOrders,
          expired: expiredOrders,
          needsReview: needsReviewOrders,
          claimed: claimedOrders,
          revenuePaise: totalRevenuePaise,
          revenueRupees: totalRevenuePaise / 100,
        },
        lockers: {
          total: totalLockers,
          available: availableLockersCount,
          inUse: inUseLockersCount,
          maintenance: maintenanceLockersCount,
        },
      },
      recentOrders,
      lowStockProducts: lowStockProducts.slice(0, 5).map((p) => ({
        id: p.id,
        name: p.name,
        stock: p.physicalStock,
        pricePaise: p.pricePaise,
        image: p.image,
      })),
      lockers: lockers.map((l) => ({
        id: l.id,
        number: l.number,
        name: l.name || l.number,
        status: l.status.toLowerCase(),
        temperatureC: l.temperatureC,
        doorState: l.doorState,
      })),
      weeklyAnalytics: sampleWeeklyAnalytics,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard telemetry.',
      error: error.message,
    });
  }
};
