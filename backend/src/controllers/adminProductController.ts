import { Response } from 'express';
import { prisma } from '../config/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';
import { EntityDeletionService } from '../services/entityDeletionService.js';

export const getAdminProducts = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const transformed = products.map((p) => ({
      id: p.id,
      name: p.name,
      subtitle: p.subtitle || '',
      description: p.description || '',
      pricePaise: p.pricePaise,
      regularPricePaise: p.regularPricePaise || p.pricePaise,
      offerPricePaise: p.offerPricePaise || p.pricePaise,
      stock: p.physicalStock,
      category: p.category?.name || 'Others',
      categoryId: p.categoryId,
      image: p.image,
      galleryImages: p.galleryImages,
      badge: p.badge || undefined,
      badgeType: (p.badgeType as any) || undefined,
      rating: p.rating,
      ratingCount: p.ratingCount,
      isActive: p.isActive,
    }));

    return res.status(200).json({ success: true, products: transformed });
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

const sanitizeGalleryImages = (images?: any, primary?: string): string[] => {
  if (!Array.isArray(images) || images.length === 0) {
    return [sanitizeImageUrl(primary)];
  }
  const filtered = images.filter((img) => typeof img === 'string' && !img.startsWith('blob:'));
  return filtered.length > 0 ? filtered : [sanitizeImageUrl(primary)];
};

export const createAdminProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name,
      subtitle,
      description,
      pricePaise,
      regularPricePaise,
      offerPricePaise,
      stock,
      categoryId,
      category: categoryName,
      image,
      galleryImages,
      badge,
      badgeType,
      isActive,
    } = req.body;

    if (!name || !pricePaise) {
      return res.status(400).json({ success: false, message: 'Product name and price are required' });
    }

    // Resolve categoryId if category name is provided
    let resolvedCategoryId = categoryId;
    if (!resolvedCategoryId && categoryName) {
      const cat = await prisma.category.findUnique({ where: { name: categoryName } });
      if (cat) resolvedCategoryId = cat.id;
    }

    const safeImage = sanitizeImageUrl(image);
    const safeGallery = sanitizeGalleryImages(galleryImages, safeImage);

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        subtitle: subtitle ? String(subtitle).trim() : null,
        description: description ? String(description).trim() : null,
        pricePaise: Number(pricePaise),
        regularPricePaise: regularPricePaise ? Number(regularPricePaise) : Number(pricePaise),
        offerPricePaise: offerPricePaise ? Number(offerPricePaise) : Number(pricePaise),
        physicalStock: stock !== undefined ? Number(stock) : 10,
        image: safeImage,
        galleryImages: safeGallery,
        badge: badge ? String(badge).trim() : null,
        badgeType: badgeType || null,
        isActive: isActive !== false,
        categoryId: resolvedCategoryId || null,
      },
      include: { category: true },
    });

    return res.status(201).json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        subtitle: product.subtitle || '',
        description: product.description || '',
        pricePaise: product.pricePaise,
        regularPricePaise: product.regularPricePaise || product.pricePaise,
        offerPricePaise: product.offerPricePaise || product.pricePaise,
        stock: product.physicalStock,
        category: product.category?.name || 'Others',
        categoryId: product.categoryId,
        image: product.image,
        galleryImages: product.galleryImages,
        badge: product.badge || undefined,
        badgeType: (product.badgeType as any) || undefined,
        rating: product.rating,
        ratingCount: product.ratingCount,
        isActive: product.isActive,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAdminProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      subtitle,
      description,
      pricePaise,
      regularPricePaise,
      offerPricePaise,
      stock,
      categoryId,
      category: categoryName,
      image,
      galleryImages,
      badge,
      badgeType,
      isActive,
    } = req.body;

    let resolvedCategoryId = categoryId;
    if (!resolvedCategoryId && categoryName) {
      const cat = await prisma.category.findUnique({ where: { name: categoryName } });
      if (cat) resolvedCategoryId = cat.id;
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(subtitle !== undefined && { subtitle: String(subtitle).trim() }),
        ...(description !== undefined && { description: String(description).trim() }),
        ...(pricePaise !== undefined && { pricePaise: Number(pricePaise) }),
        ...(regularPricePaise !== undefined && { regularPricePaise: Number(regularPricePaise) }),
        ...(offerPricePaise !== undefined && { offerPricePaise: Number(offerPricePaise) }),
        ...(stock !== undefined && { physicalStock: Number(stock) }),
        ...(image && { image: sanitizeImageUrl(image) }),
        ...(galleryImages && { galleryImages: sanitizeGalleryImages(galleryImages, image) }),
        ...(badge !== undefined && { badge }),
        ...(badgeType !== undefined && { badgeType }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(resolvedCategoryId && { categoryId: resolvedCategoryId }),
      },
      include: { category: true },
    });

    return res.status(200).json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        subtitle: product.subtitle || '',
        description: product.description || '',
        pricePaise: product.pricePaise,
        regularPricePaise: product.regularPricePaise || product.pricePaise,
        offerPricePaise: product.offerPricePaise || product.pricePaise,
        stock: product.physicalStock,
        category: product.category?.name || 'Others',
        categoryId: product.categoryId,
        image: product.image,
        galleryImages: product.galleryImages,
        badge: product.badge || undefined,
        badgeType: (product.badgeType as any) || undefined,
        rating: product.rating,
        ratingCount: product.ratingCount,
        isActive: product.isActive,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAdminProductStock = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    if (stock === undefined || isNaN(Number(stock))) {
      return res.status(400).json({ success: false, message: 'Valid stock number is required' });
    }

    const product = await prisma.product.update({
      where: { id },
      data: { physicalStock: Math.max(0, Number(stock)) },
    });

    return res.status(200).json({
      success: true,
      id: product.id,
      stock: product.physicalStock,
      message: `Stock updated to ${product.physicalStock} units.`,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAdminProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await EntityDeletionService.deleteProduct(id);
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
