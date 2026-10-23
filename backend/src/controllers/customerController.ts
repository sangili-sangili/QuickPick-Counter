import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';

export const getCustomers = async (req: Request, res: Response) => {
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
        user: {
          select: {
            id: true,
            role: true,
            avatar: true,
            createdAt: true,
          },
        },
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
        phone: c.phone,
        membershipTier: c.membershipTier,
        balancePaise: c.balancePaise,
        balanceRupees: c.balancePaise / 100,
        avatar: c.avatar || c.user?.avatar || c.name.charAt(0).toUpperCase(),
        ordersCount,
        totalSpentPaise,
        lastOrderDate: c.orders[0]?.createdAt ? new Date(c.orders[0].createdAt).toLocaleString() : 'No orders yet',
        createdAt: c.createdAt.toISOString().split('T')[0],
        status: 'active',
      };
    });

    res.status(200).json(transformed);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch customers', details: error.message });
  }
};

export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        user: true,
        orders: {
          include: {
            items: {
              include: { product: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.status(200).json({
      ...customer,
      balanceRupees: customer.balancePaise / 100,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch customer', details: error.message });
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, membershipTier, password } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password || 'password123', 10);

    const customer = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: String(name).trim(),
          email: normalizedEmail,
          password: hashedPassword,
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
          balancePaise: 10000, // ₹100 welcome balance
          membershipTier: membershipTier || 'Bronze Member',
        },
        include: {
          user: true,
        },
      });
    });

    res.status(201).json({
      ...customer,
      balanceRupees: customer.balancePaise / 100,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create customer', details: error.message });
  }
};
