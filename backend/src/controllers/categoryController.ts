import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

/**
 * GET /api/categories
 * Returns ONLY active categories with product counts and category metadata
 */
export const getActiveCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            products: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const transformed = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description || '',
      image: cat.image || '/images/hero-snacks.jpg',
      productCount: cat._count.products,
      isActive: cat.isActive,
    }));

    return res.status(200).json(transformed);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch categories', details: error.message });
  }
};
