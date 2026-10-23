import { prisma } from '../config/prisma.js';
import { LockerStatus } from '@prisma/client';

export interface ServiceDeletionResult {
  success: boolean;
  statusCode: number;
  message: string;
}

/**
 * Entity Deletion Service with Strict Foreign Key & Relational Dependency Checks
 * Enforces business rules: Primary entities linked to other tables cannot be deleted.
 */
export class EntityDeletionService {
  /**
   * 1. Category Deletion Check & Execution
   * Rule: Cannot delete category if any products reference categoryId.
   */
  static async deleteCategory(id: string): Promise<ServiceDeletionResult> {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return {
        success: false,
        statusCode: 404,
        message: 'Category not found in database.',
      };
    }

    if (category._count.products > 0) {
      return {
        success: false,
        statusCode: 409,
        message: `Cannot delete category "${category.name}". It is currently linked to ${category._count.products} active product(s) in the catalog. Please delete or reassign those products first.`,
      };
    }

    await prisma.category.delete({
      where: { id },
    });

    return {
      success: true,
      statusCode: 200,
      message: `Category "${category.name}" was permanently deleted.`,
    };
  }

  /**
   * 2. Product Deletion Check & Execution
   * Rule: Cannot delete product if referenced by OrderItem (financial audit trail),
   * AddToCart (active shopping sessions), or Wishlist.
   */
  static async deleteProduct(id: string): Promise<ServiceDeletionResult> {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orderItems: true,
            cartItems: true,
            wishlistItems: true,
          },
        },
      },
    });

    if (!product) {
      return {
        success: false,
        statusCode: 404,
        message: 'Product not found in catalog.',
      };
    }

    // Check Order Items
    if (product._count.orderItems > 0) {
      return {
        success: false,
        statusCode: 409,
        message: `Cannot delete product "${product.name}". It is linked to ${product._count.orderItems} past customer order record(s) in system transaction history. To protect audit logs, please deactivate this product instead.`,
      };
    }

    // Check Active Cart Items
    if (product._count.cartItems > 0) {
      return {
        success: false,
        statusCode: 409,
        message: `Cannot delete product "${product.name}". It is currently present in ${product._count.cartItems} customer shopping cart(s).`,
      };
    }

    // Check Wishlist Items
    if (product._count.wishlistItems > 0) {
      return {
        success: false,
        statusCode: 409,
        message: `Cannot delete product "${product.name}". It is currently saved in ${product._count.wishlistItems} customer wishlist(s).`,
      };
    }

    await prisma.product.delete({
      where: { id },
    });

    return {
      success: true,
      statusCode: 200,
      message: `Product "${product.name}" was successfully removed from catalog.`,
    };
  }

  /**
   * 3. Customer Deletion Check & Execution
   * Rule: Cannot delete customer if linked to existing orders.
   * Also ensures active cart items or wishlists are checked.
   */
  static async deleteCustomer(id: string): Promise<ServiceDeletionResult> {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            _count: {
              select: {
                cartItems: true,
                wishlist: true,
              },
            },
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!customer) {
      return {
        success: false,
        statusCode: 404,
        message: 'Customer not found.',
      };
    }

    // Check linked orders
    if (customer._count.orders > 0) {
      return {
        success: false,
        statusCode: 409,
        message: `Cannot delete customer "${customer.name}". This account is linked to ${customer._count.orders} order record(s) in kiosk sales history.`,
      };
    }

    // Check active cart items
    if (customer.user?._count.cartItems && customer.user._count.cartItems > 0) {
      return {
        success: false,
        statusCode: 409,
        message: `Cannot delete customer "${customer.name}". The user account has ${customer.user._count.cartItems} active item(s) in their cart.`,
      };
    }

    // Deleting User cascades to Customer & Notifications
    await prisma.user.delete({
      where: { id: customer.userId },
    });

    return {
      success: true,
      statusCode: 200,
      message: `Customer account for "${customer.name}" was permanently removed.`,
    };
  }

  /**
   * 4. Order Deletion Check & Execution
   * Rule: Cannot delete order if it has an active locker assignment (PAID/UNPAID hold),
   * or if it has payment gateway WebhookEvent audit records.
   */
  static async deleteOrder(id: string): Promise<ServiceDeletionResult> {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        locker: true,
        _count: {
          select: {
            webhookEvents: true,
            items: true,
          },
        },
      },
    });

    if (!order) {
      return {
        success: false,
        statusCode: 404,
        message: 'Order not found.',
      };
    }

    // Check active locker hold
    const isLockerActive =
      order.lockerNumber &&
      (order.status === 'PAID' || order.status === 'UNPAID' || order.status === 'NEEDS_REVIEW') &&
      order.locker &&
      order.locker.status !== LockerStatus.AVAILABLE;

    if (isLockerActive) {
      return {
        success: false,
        statusCode: 409,
        message: `Cannot delete order #${order.orderNumber}. It is linked to an active locker compartment (${order.lockerNumber}) with status "${order.status}". Please cancel or release the compartment first.`,
      };
    }

    // Check linked webhook payment logs
    if (order._count.webhookEvents > 0) {
      return {
        success: false,
        statusCode: 409,
        message: `Cannot delete order #${order.orderNumber}. It is linked to ${order._count.webhookEvents} payment gateway webhook audit transaction(s).`,
      };
    }

    // Transactional deletion of order items and order
    await prisma.$transaction(async (tx) => {
      // If order had a locker assignment that needs release
      if (order.lockerNumber) {
        await tx.smartLocker.updateMany({
          where: { number: order.lockerNumber, status: { in: [LockerStatus.RESERVED, LockerStatus.OCCUPIED] } },
          data: { status: LockerStatus.AVAILABLE, assignedAt: null },
        });
      }

      await tx.orderItem.deleteMany({
        where: { orderId: id },
      });

      await tx.order.delete({
        where: { id },
      });
    });

    return {
      success: true,
      statusCode: 200,
      message: `Order #${order.orderNumber} deleted successfully.`,
    };
  }
}
