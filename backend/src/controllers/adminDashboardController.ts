import { Response } from 'express';
import { prisma } from '../config/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Execute database-level aggregations concurrently via connection pool
    const [
      totalProducts,
      activeProducts,
      lowStockCount,
      lowStockProducts,
      totalOrders,
      paidOrdersCount,
      pendingOrders,
      expiredOrders,
      needsReviewOrders,
      claimedOrders,
      revenueAggregate,
      lockers,
      recentOrdersRaw,
      weeklyOrders,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({ where: { physicalStock: { lte: 5 } } }),
      prisma.product.findMany({
        where: { physicalStock: { lte: 5 } },
        select: { id: true, name: true, physicalStock: true, pricePaise: true, image: true },
        take: 6,
        orderBy: { physicalStock: 'asc' },
      }),
      prisma.order.count(),
      prisma.order.count({ where: { status: { in: ['PAID', 'CLAIMED'] } } }),
      prisma.order.count({ where: { status: 'UNPAID' } }),
      prisma.order.count({ where: { status: 'EXPIRED' } }),
      prisma.order.count({ where: { status: 'NEEDS_REVIEW' } }),
      prisma.order.count({ where: { status: 'CLAIMED' } }),
      prisma.order.aggregate({
        _sum: { totalPaise: true },
        where: { status: { in: ['PAID', 'CLAIMED'] } },
      }),
      prisma.smartLocker.findMany({
        select: { id: true, number: true, name: true, status: true, temperatureC: true, doorState: true },
        orderBy: { number: 'asc' },
      }),
      prisma.order.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          totalPaise: true,
          status: true,
          lockerNumber: true,
          createdAt: true,
          customer: { select: { name: true } },
          items: {
            select: {
              quantity: true,
              product: { select: { name: true } },
            },
          },
        },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true, totalPaise: true, status: true },
      }),
    ]);

    const inactiveProducts = totalProducts - activeProducts;
    const totalRevenuePaise = revenueAggregate._sum.totalPaise || 0;

    const totalLockers = lockers.length;
    const availableLockersCount = lockers.filter((l) => l.status === 'AVAILABLE').length;
    const inUseLockersCount = lockers.filter((l) => l.status === 'OCCUPIED' || l.status === 'RESERVED').length;
    const maintenanceLockersCount = lockers.filter((l) => l.status === 'OUT_OF_SERVICE').length;

    // Format Recent Orders
    const recentOrders = recentOrdersRaw.map((o) => ({
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

    // Weekly Analytics from bounded 7-day query
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const weeklyDataMap: Record<string, { revenue: number; orders: number }> = {
      Mon: { revenue: 0, orders: 0 },
      Tue: { revenue: 0, orders: 0 },
      Wed: { revenue: 0, orders: 0 },
      Thu: { revenue: 0, orders: 0 },
      Fri: { revenue: 0, orders: 0 },
      Sat: { revenue: 0, orders: 0 },
      Sun: { revenue: 0, orders: 0 },
    };

    weeklyOrders.forEach((o) => {
      const dayIdx = new Date(o.createdAt).getDay();
      const dayName = dayNames[dayIdx];
      if (weeklyDataMap[dayName]) {
        weeklyDataMap[dayName].orders += 1;
        if (o.status === 'PAID' || o.status === 'CLAIMED') {
          weeklyDataMap[dayName].revenue += Math.round(o.totalPaise / 100);
        }
      }
    });

    const maxWeeklyRev = Math.max(...Object.values(weeklyDataMap).map((d) => d.revenue), 1);
    const weeklyAnalytics = days.map((day) => ({
      day,
      revenue: weeklyDataMap[day].revenue,
      orders: weeklyDataMap[day].orders,
      heightPct:
        weeklyDataMap[day].revenue > 0
          ? Math.max(16, Math.min(100, Math.round((weeklyDataMap[day].revenue / maxWeeklyRev) * 100)))
          : 0,
    }));

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
          paid: paidOrdersCount,
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
      lowStockProducts: lowStockProducts.map((p) => ({
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
      weeklyAnalytics,
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
