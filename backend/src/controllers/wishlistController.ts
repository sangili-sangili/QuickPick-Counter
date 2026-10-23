import { Response } from 'express';
import { prisma } from '../config/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';

/**
 * GET /api/customer/wishlist
 * Returns the authenticated user's wishlist products
 */
export const getWishlist = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const wishlistItems = await prisma.wishlist.findMany({
      where: { userId },
      include: {
        product: {
          include: { category: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const products = wishlistItems
      .filter((w) => w.product && w.product.isActive)
      .map((w) => ({
        id: w.product.id,
        name: w.product.name,
        subtitle: w.product.subtitle || '',
        description: w.product.description || '',
        pricePaise: w.product.pricePaise,
        regularPricePaise: w.product.regularPricePaise || w.product.pricePaise,
        offerPricePaise: w.product.offerPricePaise || w.product.pricePaise,
        stock: w.product.physicalStock,
        category: w.product.category?.name || 'Others',
        categoryId: w.product.categoryId,
        image: w.product.image,
        galleryImages: w.product.galleryImages,
        badge: w.product.badge || undefined,
        badgeType: (w.product.badgeType as any) || undefined,
        rating: w.product.rating,
        ratingCount: w.product.ratingCount,
        isActive: w.product.isActive,
        addedAt: w.createdAt,
      }));

    return res.status(200).json(products);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch wishlist', details: error.message });
  }
};

/**
 * POST /api/customer/wishlist/:productId
 * Adds a product to the authenticated user's wishlist
 */
export const addToWishlist = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { productId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Product not found or inactive' });
    }

    const wishlistItem = await prisma.wishlist.upsert({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
      update: {},
      create: {
        userId,
        productId,
      },
      include: { product: true },
    });

    return res.status(200).json({
      success: true,
      message: `${product.name} added to wishlist`,
      item: wishlistItem,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to add to wishlist', details: error.message });
  }
};

/**
 * DELETE /api/customer/wishlist/:productId
 * Removes a product from the user's wishlist
 */
export const removeFromWishlist = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { productId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    await prisma.wishlist.deleteMany({
      where: {
        userId,
        productId,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
      productId,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to remove from wishlist', details: error.message });
  }
};
