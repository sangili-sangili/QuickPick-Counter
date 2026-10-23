import { prisma } from '../config/prisma.js';

export interface CreateNotificationParams {
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'success' | 'error';
  userId?: string;
}

/**
 * Creates a system notification for Station Administrators
 */
export async function createAdminNotification({
  title,
  message,
  type = 'info',
  userId,
}: CreateNotificationParams) {
  try {
    let targetUserId = userId;

    if (!targetUserId) {
      const adminUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
      });
      targetUserId = adminUser?.id;
    }

    if (!targetUserId) {
      console.warn('⚠️ [NOTIFICATION SERVICE] No admin user found to receive notification.');
      return null;
    }

    const notif = await prisma.notification.create({
      data: {
        userId: targetUserId,
        title,
        message,
        type,
        isRead: false,
      },
    });

    console.log(`🔔 [NOTIFICATION CREATED] [${type.toUpperCase()}] ${title}: ${message}`);
    return notif;
  } catch (error: any) {
    console.warn('⚠️ [NOTIFICATION SERVICE ERROR]:', error.message);
    return null;
  }
}
