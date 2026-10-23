import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { createAdminNotification } from '../services/notificationService.js';

/**
 * POST /api/feedback
 * Stores order and kiosk experience rating & feedback in the database,
 * and updates associated product ratings.
 */
export const submitFeedback = async (req: Request, res: Response) => {
  try {
    const { orderId, rating, tags, comment, productId } = req.body;

    const numRating = parseInt(String(rating), 10);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
    }

    const feedbackId = `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const sanitizedTags = Array.isArray(tags) ? tags.map((t: any) => String(t).trim()) : [];
    const sanitizedComment = comment ? String(comment).trim() : null;

    // 1. Insert into Feedback table
    await prisma.$executeRawUnsafe(
      'INSERT INTO "Feedback" (id, "orderId", rating, tags, comment, "createdAt") VALUES ($1, $2, $3, $4, $5, NOW())',
      feedbackId,
      orderId ? String(orderId) : null,
      numRating,
      sanitizedTags,
      sanitizedComment
    );

    // 2. If orderId provided, update product ratings for all items in the order
    if (orderId) {
      try {
        const order = await prisma.order.findUnique({
          where: { id: String(orderId) },
          include: { items: { include: { product: true } } },
        });

        if (order && order.items.length > 0) {
          for (const item of order.items) {
            const currentRating = item.product.rating || 4.8;
            const currentCount = item.product.ratingCount || 0;
            const newCount = currentCount + 1;
            const updatedRating = Math.round(((currentRating * currentCount + numRating) / newCount) * 10) / 10;

            await prisma.product.update({
              where: { id: item.productId },
              data: {
                rating: updatedRating,
                ratingCount: newCount,
              },
            });
          }
        }
      } catch (err: any) {
        console.warn('Could not update order product ratings:', err.message);
      }
    } else if (productId) {
      // Direct product rating
      try {
        const prod = await prisma.product.findUnique({ where: { id: String(productId) } });
        if (prod) {
          const currentRating = prod.rating || 4.8;
          const currentCount = prod.ratingCount || 0;
          const newCount = currentCount + 1;
          const updatedRating = Math.round(((currentRating * currentCount + numRating) / newCount) * 10) / 10;

          await prisma.product.update({
            where: { id: prod.id },
            data: {
              rating: updatedRating,
              ratingCount: newCount,
            },
          });
        }
      } catch (err: any) {
        console.warn('Could not update product rating:', err.message);
      }
    }

    createAdminNotification({
      title: `Customer Feedback: ${numRating} ★`,
      message: sanitizedComment
        ? `Review: "${sanitizedComment}" (Tags: ${sanitizedTags.join(', ') || 'None'})`
        : `Customer submitted ${numRating}-star rating (Tags: ${sanitizedTags.join(', ') || 'None'}).`,
      type: numRating >= 4 ? 'success' : 'info',
    });

    return res.status(201).json({
      success: true,
      message: 'Feedback and rating stored successfully in database.',
      feedback: {
        id: feedbackId,
        orderId: orderId || null,
        rating: numRating,
        tags: sanitizedTags,
        comment: sanitizedComment,
      },
    });
  } catch (error: any) {
    console.error('Submit feedback error:', error);
    return res.status(500).json({ error: 'Failed to store feedback', details: error.message });
  }
};

/**
 * GET /api/feedback
 * Returns stored feedbacks and aggregate statistics
 */
export const getFeedbacks = async (_req: Request, res: Response) => {
  try {
    const feedbacks: any[] = await prisma.$queryRawUnsafe(
      'SELECT * FROM "Feedback" ORDER BY "createdAt" DESC LIMIT 50'
    );

    const totalCount = feedbacks.length;
    const avgRating =
      totalCount > 0
        ? Math.round((feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / totalCount) * 10) / 10
        : 5.0;

    return res.status(200).json({
      totalCount,
      averageRating: avgRating,
      feedbacks,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch feedbacks', details: error.message });
  }
};
