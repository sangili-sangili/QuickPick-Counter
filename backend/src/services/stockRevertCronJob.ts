import { prisma } from '../config/prisma.js';
import { createAdminNotification } from './notificationService.js';

let cronInterval: NodeJS.Timeout | null = null;

/**
 * Reverts stock for unpaid orders that have passed their 120-second expiration window
 * and frees up the assigned Smart Lockers back to AVAILABLE.
 */
export async function revertExpiredOrdersAndStock(): Promise<{
  expiredCount: number;
  revertedProductsCount: number;
}> {
  try {
    const now = new Date();

    // Find all UNPAID orders that have expired
    const expiredOrders = await prisma.order.findMany({
      where: {
        status: 'UNPAID',
        expiresAt: { lt: now },
      },
      include: {
        items: true,
      },
    });

    if (expiredOrders.length === 0) {
      return { expiredCount: 0, revertedProductsCount: 0 };
    }

    let totalRevertedItems = 0;

    for (const order of expiredOrders) {
      await prisma.$transaction(async (tx) => {
        // 1. Mark order as EXPIRED
        await tx.order.update({
          where: { id: order.id },
          data: { status: 'EXPIRED' },
        });

        // 2. Revert physicalStock for each order item back into dispenser
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              physicalStock: { increment: item.quantity },
            },
          });
          totalRevertedItems += item.quantity;
        }

        // 3. Release Smart Locker back to AVAILABLE
        if (order.lockerNumber) {
          await tx.smartLocker.updateMany({
            where: { number: order.lockerNumber },
            data: {
              status: 'AVAILABLE',
              assignedAt: null,
              doorState: 'locked',
            },
          });
        }
      });

      console.log(
        `🔄 [STOCK REVERT CRON] Order #${order.orderNumber} expired. Reverted ${order.items.length} product(s) back to physical stock and freed Locker ${order.lockerNumber || 'N/A'}.`
      );

      createAdminNotification({
        title: `Order #${order.orderNumber} Expired`,
        message: `Order unpaid after 120s. Returned ${order.items.length} item(s) to stock and freed Locker ${order.lockerNumber || 'N/A'}.`,
        type: 'warning',
      });
    }

    // Clean up abandoned cart items older than 2 hours
    try {
      const cartExpiry = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const removedCart = await prisma.addToCart.deleteMany({
        where: {
          updatedAt: { lt: cartExpiry },
        },
      });
      if (removedCart.count > 0) {
        console.log(`🛒 [CART CLEANUP CRON] Removed ${removedCart.count} abandoned cart item(s).`);
      }
    } catch (cartErr: any) {
      console.warn('⚠️ [CART CLEANUP CRON WARNING]:', cartErr.message);
    }

    return {
      expiredCount: expiredOrders.length,
      revertedProductsCount: totalRevertedItems,
    };
  } catch (error: any) {
    console.error('❌ [STOCK REVERT CRON ERROR]:', error.message);
    return { expiredCount: 0, revertedProductsCount: 0 };
  }
}

/**
 * Starts the automated stock revert background cron job (runs every 10 seconds)
 */
export function startStockRevertCron(intervalMs = 10000) {
  if (cronInterval) {
    clearInterval(cronInterval);
  }

  console.log(`⏰ [CRON STARTED] Stock & Cart revert cron job active (every ${intervalMs / 1000}s)`);

  // Run initial check immediately
  revertExpiredOrdersAndStock();

  cronInterval = setInterval(async () => {
    await revertExpiredOrdersAndStock();
  }, intervalMs);
}

/**
 * Stops the cron job cleanly
 */
export function stopStockRevertCron() {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
    console.log('🛑 [CRON STOPPED] Stock revert cron job stopped');
  }
}
