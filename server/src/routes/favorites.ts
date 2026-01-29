import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { NotFoundError } from '../middleware/errorHandler.js';

const router = Router();

// GET /api/favorites - Get user's favorites list
router.get('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.id;

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            category: true,
            dailyRate: true,
            status: true,
            images: true,
            seats: true,
            transmission: true,
            fuelType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: favorites,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/favorites/:vehicleId - Add vehicle to favorites
router.post('/:vehicleId', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { vehicleId } = req.params;

    // Check if vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { id: true },
    });

    if (!vehicle) {
      throw NotFoundError('Vehicle not found');
    }

    // Use upsert to prevent race conditions (check-then-create)
    const favorite = await prisma.favorite.upsert({
      where: {
        userId_vehicleId: { userId, vehicleId },
      },
      create: {
        userId,
        vehicleId,
      },
      update: {}, // No update needed if already exists
      include: {
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            category: true,
            dailyRate: true,
            images: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: favorite,
      message: 'Vehicle added to favorites',
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/favorites/:vehicleId - Remove vehicle from favorites
router.delete('/:vehicleId', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { vehicleId } = req.params;

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_vehicleId: { userId, vehicleId },
      },
    });

    if (!favorite) {
      throw NotFoundError('Favorite not found');
    }

    await prisma.favorite.delete({
      where: { id: favorite.id },
    });

    res.json({
      success: true,
      message: 'Vehicle removed from favorites',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/favorites/check/:vehicleId - Check if vehicle is favorited
router.get('/check/:vehicleId', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { vehicleId } = req.params;

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_vehicleId: { userId, vehicleId },
      },
    });

    res.json({
      success: true,
      data: {
        isFavorited: !!favorite,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/favorites/ids - Get just the vehicle IDs (for quick state hydration)
router.get('/ids', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.id;

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      select: { vehicleId: true },
    });

    res.json({
      success: true,
      data: favorites.map((f) => f.vehicleId),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
