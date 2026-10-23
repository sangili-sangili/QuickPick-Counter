import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';
import { EntityDeletionService } from '../services/entityDeletionService.js';

export const getAdminCustomers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tier, search } = req.query;

    const whereClause: any = {};
    if (tier && tier !== 'all') {
      whereClause.membershipTier = String(tier);
    }
    if (search) {
      const q = String(search);
      whereClause.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where: whereClause,
      include: {
        user: true,
        orders: {
          select: {
            id: true,
            orderNumber: true,
            totalPaise: true,
            status: true,
            lockerNumber: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const transformed = customers.map((c) => {
      const ordersCount = c.orders.length;
      const totalSpentPaise = c.orders
        .filter((o) => o.status === 'PAID' || o.status === 'CLAIMED')
        .reduce((sum, o) => sum + o.totalPaise, 0);

      return {
        id: c.id,
        userId: c.userId,
        name: c.name,
        email: c.email,
        phone: c.phone || '',
        membershipTier: c.membershipTier,
        balancePaise: c.balancePaise,
        balanceRupees: c.balancePaise / 100,
        avatar: c.avatar || c.user?.avatar || c.name.charAt(0).toUpperCase(),
        ordersCount,
        totalSpentPaise,
        lastOrderDate: c.orders[0]?.createdAt ? new Date(c.orders[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No orders yet',
        createdAt: c.createdAt.toISOString().split('T')[0],
        status: 'active' as const,
      };
    });

    return res.status(200).json({ success: true, customers: transformed });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createAdminCustomer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, phone, membershipTier } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Customer name and email are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'User with this email already exists' });
    }

    const defaultPasswordHash = await bcrypt.hash('password123', 10);

    const customer = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: String(name).trim(),
          email: normalizedEmail,
          password: defaultPasswordHash,
          role: 'CUSTOMER',
          avatar: String(name).trim().charAt(0).toUpperCase(),
        },
      });

      return await tx.customer.create({
        data: {
          userId: newUser.id,
          name: String(name).trim(),
          email: normalizedEmail,
          phone: phone ? String(phone).trim() : null,
          balancePaise: 10000, // ₹100
          membershipTier: membershipTier || 'Bronze Member',
        },
        include: { user: true },
      });
    });

    return res.status(201).json({
      success: true,
      customer: {
        id: customer.id,
        userId: customer.userId,
        name: customer.name,
        email: customer.email,
        phone: customer.phone || '',
        membershipTier: customer.membershipTier,
        balancePaise: customer.balancePaise,
        balanceRupees: customer.balancePaise / 100,
        avatar: customer.avatar || customer.name.charAt(0).toUpperCase(),
        ordersCount: 0,
        totalSpentPaise: 0,
        lastOrderDate: 'Just registered',
        createdAt: customer.createdAt.toISOString().split('T')[0],
        status: 'active' as const,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAdminCustomer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, phone, membershipTier, balancePaise } = req.body;

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...(name && { name: String(name).trim() }),
        ...(phone !== undefined && { phone: String(phone).trim() }),
        ...(membershipTier && { membershipTier: String(membershipTier) }),
        ...(balancePaise !== undefined && { balancePaise: Number(balancePaise) }),
      },
    });

    return res.status(200).json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        membershipTier: customer.membershipTier,
        balancePaise: customer.balancePaise,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAdminCustomer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await EntityDeletionService.deleteCustomer(id);
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
