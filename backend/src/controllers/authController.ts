import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'quickpick-super-secret-jwt-key-2026';

// 1. Admin Login API
export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Find User
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    // Role check: Admin only
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied: Admin credentials required' });
    }

    // Password verification
    const isPasswordValid = await bcrypt.compare(String(password), user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    // Generate JWT token (expires in 7 days)
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Admin authentication successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || user.name.charAt(0).toUpperCase(),
      },
    });
  } catch (error: any) {
    console.error('Admin login error:', error);
    return res.status(500).json({ error: 'Admin login failed', details: error.message });
  }
};

// 2. Customer Login API
export const customerLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Find Customer User with associated Customer profile
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        customer: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid customer email or password' });
    }

    // Role check: Customer only
    if (user.role !== 'CUSTOMER') {
      return res.status(403).json({ error: 'Invalid portal: Use Admin Login for administrative access' });
    }

    // Password verification
    const isPasswordValid = await bcrypt.compare(String(password), user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid customer email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        customerId: user.customer?.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const balancePaise = user.customer?.balancePaise || 0;

    return res.status(200).json({
      success: true,
      message: 'Customer authentication successful',
      token,
      user: {
        id: user.id,
        customerId: user.customer?.id,
        name: user.name,
        email: user.email,
        phone: user.customer?.phone || '',
        role: user.role,
        avatar: user.avatar || user.name.charAt(0).toUpperCase(),
        membershipTier: user.customer?.membershipTier || 'Bronze Member',
        balancePaise,
        balanceRupees: balancePaise / 100,
      },
    });
  } catch (error: any) {
    console.error('Customer login error:', error);
    return res.status(500).json({ error: 'Customer login failed', details: error.message });
  }
};

// 3. Customer Register API
export const customerRegister = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, membershipTier } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(String(password), 10);

    // Create User + Customer Profile with welcome wallet balance (₹100 = 10000 paise)
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: String(name).trim(),
          email: normalizedEmail,
          password: hashedPassword,
          role: 'CUSTOMER',
          avatar: String(name).trim().charAt(0).toUpperCase(),
          customer: {
            create: {
              name: String(name).trim(),
              email: normalizedEmail,
              phone: phone ? String(phone).trim() : null,
              balancePaise: 10000, // ₹100 welcome bonus balance
              membershipTier: membershipTier || 'Bronze Member',
            },
          },
        },
        include: {
          customer: true,
        },
      });

      return newUser;
    });

    // Generate token
    const token = jwt.sign(
      {
        userId: result.id,
        customerId: result.customer?.id,
        email: result.email,
        role: result.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Customer registered successfully with ₹100 welcome balance bonus',
      token,
      user: {
        id: result.id,
        customerId: result.customer?.id,
        name: result.name,
        email: result.email,
        phone: result.customer?.phone || '',
        role: result.role,
        avatar: result.avatar,
        membershipTier: result.customer?.membershipTier || 'Bronze Member',
        balancePaise: result.customer?.balancePaise || 10000,
        balanceRupees: (result.customer?.balancePaise || 10000) / 100,
      },
    });
  } catch (error: any) {
    console.error('Customer register error:', error);
    return res.status(500).json({ error: 'Registration failed', details: error.message });
  }
};

// 4. Session Verification API (/api/auth/me)
export const getMe = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        customer: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      customer: user.customer
        ? {
            id: user.customer.id,
            phone: user.customer.phone,
            balancePaise: user.customer.balancePaise,
            balanceRupees: user.customer.balancePaise / 100,
            membershipTier: user.customer.membershipTier,
          }
        : null,
    });
  } catch (error: any) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
