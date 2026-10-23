import { Response } from 'express';
import { LockerStatus } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';

export const getAdminLockers = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const lockers = await prisma.smartLocker.findMany({
      orderBy: { number: 'asc' },
      include: {
        orders: {
          where: {
            status: { in: ['PAID', 'UNPAID'] },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const transformed = lockers.map((l) => {
      const activeOrder = l.orders[0];
      return {
        id: l.id,
        number: l.number,
        name: l.name || l.number,
        status: l.status.toLowerCase() as 'available' | 'reserved' | 'occupied' | 'out_of_service',
        temperatureC: l.temperatureC,
        doorState: l.doorState as 'locked' | 'unlocked' | 'open',
        orderId: activeOrder?.id,
        orderNumber: activeOrder?.orderNumber,
        pickupStatus:
          l.status === 'OCCUPIED'
            ? 'Awaiting Customer'
            : l.status === 'RESERVED'
            ? 'Holding'
            : undefined,
        assignedAt: l.assignedAt ? l.assignedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
      };
    });

    return res.status(200).json({ success: true, lockers: transformed });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleUnlockLocker = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const locker = await prisma.smartLocker.findUnique({ where: { id } });
    if (!locker) {
      return res.status(404).json({ success: false, message: 'Locker compartment not found' });
    }

    const nextDoorState = locker.doorState === 'locked' ? 'unlocked' : 'locked';
    const updated = await prisma.smartLocker.update({
      where: { id },
      data: { doorState: nextDoorState },
    });

    return res.status(200).json({
      success: true,
      id: updated.id,
      number: updated.number,
      doorState: updated.doorState,
      message: `Compartment ${updated.number} solenoid ${updated.doorState}.`,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const setLockerMaintenance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const locker = await prisma.smartLocker.findUnique({ where: { id } });
    if (!locker) {
      return res.status(404).json({ success: false, message: 'Locker compartment not found' });
    }

    const nextStatus = locker.status === LockerStatus.OUT_OF_SERVICE ? LockerStatus.AVAILABLE : LockerStatus.OUT_OF_SERVICE;
    const updated = await prisma.smartLocker.update({
      where: { id },
      data: { status: nextStatus },
    });

    return res.status(200).json({
      success: true,
      id: updated.id,
      number: updated.number,
      status: updated.status.toLowerCase(),
      message: `Compartment ${updated.number} status set to ${updated.status}.`,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const resetLocker = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await prisma.smartLocker.update({
      where: { id },
      data: {
        status: LockerStatus.AVAILABLE,
        doorState: 'locked',
        assignedAt: null,
      },
    });

    return res.status(200).json({
      success: true,
      id: updated.id,
      number: updated.number,
      status: 'available',
      doorState: 'locked',
      message: `Compartment ${updated.number} reset to Available.`,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const emergencyUnlockAll = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    await prisma.smartLocker.updateMany({
      data: { doorState: 'unlocked' },
    });

    return res.status(200).json({
      success: true,
      message: 'EMERGENCY OVERRIDE: All 12 dispenser compartment solenoids unlocked!',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
