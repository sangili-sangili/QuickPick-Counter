import { Response } from 'express';
import { prisma } from '../config/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';
import { EntityDeletionService } from '../services/entityDeletionService.js';

export const getAdminCategories = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const transformed = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description || '',
      image: cat.image || '/images/lays.jpg',
      isActive: cat.isActive,
      productCount: cat._count.products,
      createdAt: cat.createdAt.toISOString().split('T')[0],
    }));

    return res.status(200).json({ success: true, categories: transformed });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const sanitizeImageUrl = (url?: string | null): string => {
  if (!url || typeof url !== 'string' || url.startsWith('blob:')) {
    return '/images/lays.jpg';
  }
  return url;
};

export const createAdminCategory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, image, isActive } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const existing = await prisma.category.findUnique({ where: { name: name.trim() } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Category name already exists' });
    }

    const safeImage = sanitizeImageUrl(image);

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description ? String(description).trim() : null,
        image: safeImage,
        isActive: isActive !== false,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return res.status(201).json({
      success: true,
      category: {
        id: category.id,
        name: category.name,
        description: category.description || '',
        image: category.image || '/images/lays.jpg',
        isActive: category.isActive,
        productCount: category._count.products,
        createdAt: category.createdAt.toISOString().split('T')[0],
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAdminCategory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, image, isActive } = req.body;

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: String(description).trim() }),
        ...(image && { image: sanitizeImageUrl(image) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return res.status(200).json({
      success: true,
      category: {
        id: category.id,
        name: category.name,
        description: category.description || '',
        image: category.image || '/images/lays.jpg',
        isActive: category.isActive,
        productCount: category._count.products,
        createdAt: category.createdAt.toISOString().split('T')[0],
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAdminCategory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await EntityDeletionService.deleteCategory(id);
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
