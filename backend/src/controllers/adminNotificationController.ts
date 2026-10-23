import { Response } from 'express';
import { prisma } from '../config/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';

export const getAdminNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          ...(userId ? [{ userId }] : []),
          { user: { role: 'ADMIN' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    const transformed = notifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type as 'info' | 'warning' | 'success' | 'error',
      read: n.isRead,
      time: n.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));

    return res.status(200).json({
      success: true,
      unreadCount,
      notifications: transformed,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const markAllNotificationsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    await prisma.notification.updateMany({
      where: {
        OR: [
          ...(userId ? [{ userId }] : []),
          { user: { role: 'ADMIN' } },
        ],
        isRead: false,
      },
      data: { isRead: true },
    });

    return res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const markNotificationRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    return res.status(200).json({ success: true, id, message: 'Notification marked as read' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
