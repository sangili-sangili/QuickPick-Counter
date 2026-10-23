import { Response } from 'express';
import { prisma } from '../config/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';

/**
 * GET /api/customer/profile
 * Returns authenticated customer profile, balance, order history, and stats
 */
export const getCustomerProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        customer: {
          include: {
            orders: {
              include: {
                items: {
                  include: { product: true },
                },
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        wishlist: true,
        cartItems: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = user.customer;
    const balancePaise = customer?.balancePaise || 0;

    const orders = (customer?.orders || []).map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      totalPaise: o.totalPaise,
      totalRupees: o.totalPaise / 100,
      status: o.status,
      lockerNumber: o.lockerNumber,
      pickupClaimedAt: o.pickupClaimedAt,
      createdAt: o.createdAt,
      items: o.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        productName: i.product?.name || 'Item',
        quantity: i.quantity,
        unitPricePaise: i.unitPricePaise,
      })),
    }));

    return res.status(200).json({
      id: user.id,
      customerId: customer?.id,
      name: user.name,
      email: user.email,
      phone: customer?.phone || '',
      avatar: user.avatar || user.name.charAt(0).toUpperCase(),
      membershipTier: customer?.membershipTier || 'Bronze Member',
      balancePaise,
      balanceRupees: balancePaise / 100,
      wishlistCount: user.wishlist.length,
      cartCount: user.cartItems.reduce((sum, item) => sum + item.quantity, 0),
      orders,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch customer profile', details: error.message });
  }
};

/**
 * PUT /api/customer/profile
 * Updates customer profile details (name, phone, avatar)
 */
export const updateCustomerProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { name, phone, avatar } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          name: name ? String(name).trim() : undefined,
          avatar: avatar ? String(avatar).trim() : undefined,
        },
      });

      const customer = await tx.customer.update({
        where: { userId },
        data: {
          name: name ? String(name).trim() : undefined,
          phone: phone !== undefined ? String(phone).trim() : undefined,
          avatar: avatar ? String(avatar).trim() : undefined,
        },
      });

      return { user, customer };
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.user.id,
        customerId: updatedUser.customer.id,
        name: updatedUser.user.name,
        email: updatedUser.user.email,
        phone: updatedUser.customer.phone || '',
        avatar: updatedUser.user.avatar,
        membershipTier: updatedUser.customer.membershipTier,
        balancePaise: updatedUser.customer.balancePaise,
        balanceRupees: updatedUser.customer.balancePaise / 100,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update customer profile', details: error.message });
  }
};
