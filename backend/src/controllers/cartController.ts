import { Response } from 'express';
import { prisma } from '../config/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';

/**
 * GET /api/customer/cart
 * Returns the authenticated user's current shopping cart
 */
export const getCart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const cartEntries = await prisma.addToCart.findMany({
      where: { userId },
      include: {
        product: {
          include: { category: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const items = cartEntries
      .filter((entry) => entry.product && entry.product.isActive)
      .map((entry) => ({
        id: entry.id,
        productId: entry.productId,
        quantity: entry.quantity,
        product: {
          id: entry.product.id,
          name: entry.product.name,
          subtitle: entry.product.subtitle || '',
          description: entry.product.description || '',
          pricePaise: entry.product.pricePaise,
          regularPricePaise: entry.product.regularPricePaise || entry.product.pricePaise,
          offerPricePaise: entry.product.offerPricePaise || entry.product.pricePaise,
          stock: entry.product.physicalStock,
          category: entry.product.category?.name || 'Others',
          categoryId: entry.product.categoryId,
          image: entry.product.image,
          galleryImages: entry.product.galleryImages,
          badge: entry.product.badge || undefined,
          badgeType: (entry.product.badgeType as any) || undefined,
          rating: entry.product.rating,
          ratingCount: entry.product.ratingCount,
          isActive: entry.product.isActive,
        },
      }));

    const totalPaise = items.reduce(
      (sum, item) => sum + item.product.pricePaise * item.quantity,
      0
    );

    return res.status(200).json({
      items,
      totalCount: items.reduce((sum, item) => sum + item.quantity, 0),
      totalPaise,
      totalRupees: totalPaise / 100,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch cart', details: error.message });
  }
};

/**
 * POST /api/customer/cart
 * Adds or increments an item in the cart
 */
export const addToCart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { productId, quantity = 1 } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const qty = Math.max(1, parseInt(String(quantity), 10));

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Product not found or inactive' });
    }

    // Check existing cart quantity
    const existing = await prisma.addToCart.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    const newQuantity = existing ? existing.quantity + qty : qty;

    if (newQuantity > product.physicalStock) {
      return res.status(400).json({
        error: `Only ${product.physicalStock} units available for ${product.name}.`,
      });
    }

    const entry = await prisma.addToCart.upsert({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
      update: {
        quantity: newQuantity,
      },
      create: {
        userId,
        productId,
        quantity: qty,
      },
      include: { product: true },
    });

    return res.status(200).json({
      success: true,
      message: `${product.name} added to cart`,
      entry,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update cart', details: error.message });
  }
};

/**
 * PUT /api/customer/cart/:productId
 * Sets specific quantity for an item in the cart
 */
export const updateCartItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const qty = parseInt(String(quantity), 10);

    if (qty <= 0) {
      await prisma.addToCart.deleteMany({
        where: { userId, productId },
      });
      return res.status(200).json({ success: true, message: 'Item removed from cart' });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (qty > product.physicalStock) {
      return res.status(400).json({
        error: `Only ${product.physicalStock} units available for ${product.name}.`,
      });
    }

    const entry = await prisma.addToCart.upsert({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
      update: { quantity: qty },
      create: { userId, productId, quantity: qty },
      include: { product: true },
    });

    return res.status(200).json({ success: true, entry });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update item quantity', details: error.message });
  }
};

/**
 * DELETE /api/customer/cart/:productId
 * Removes a specific product from cart
 */
export const removeFromCart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { productId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    await prisma.addToCart.deleteMany({
      where: { userId, productId },
    });

    return res.status(200).json({ success: true, message: 'Item removed from cart', productId });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to remove from cart', details: error.message });
  }
};

/**
 * DELETE /api/customer/cart
 * Clears all items in customer's cart
 */
export const clearCart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    await prisma.addToCart.deleteMany({
      where: { userId },
    });

    return res.status(200).json({ success: true, message: 'Cart cleared successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to clear cart', details: error.message });
  }
};
