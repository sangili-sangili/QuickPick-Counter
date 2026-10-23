import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, AuthUserPayload } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'quickpick-super-secret-jwt-key-2026';

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. No bearer token provided.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUserPayload;
    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Session expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Invalid authentication token.',
    });
  }
};

export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required.',
    });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Administrator privileges required.',
    });
  }

  next();
};

export const requireCustomer = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required.',
    });
  }

  if (req.user.role !== 'CUSTOMER') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Customer account required.',
    });
  }

  next();
};
