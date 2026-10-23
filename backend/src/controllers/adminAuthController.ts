import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'quickpick-super-secret-jwt-key-2026';

export const adminLogin = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    // 1. Validate Email Presence & Format
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        success: false,
        field: 'email',
        message: 'Please enter your admin email address.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        field: 'email',
        message: 'Please enter a valid email address format.',
      });
    }

    // 2. Validate Password Presence
    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        field: 'password',
        message: 'Please enter your admin password.',
      });
    }

    // 3. Look up user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Separate Validation: Email not found
    if (!user) {
      return res.status(401).json({
        success: false,
        field: 'email',
        message: 'This email is not registered as an administrator in the system.',
      });
    }

    // Separate Validation: User exists but is not an Admin
    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        field: 'email',
        message: 'Access denied: This account does not possess administrator privileges.',
      });
    }

    // Separate Validation: Password mismatch
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        field: 'password',
        message: 'Incorrect password. Please verify and try again.',
      });
    }

    // 4. Issue 7-day Admin JWT Token
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
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
      details: error.message,
    });
  }
};

export const getAdminProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(404).json({ success: false, message: 'Admin profile not found' });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
