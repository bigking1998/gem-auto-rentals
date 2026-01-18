import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate, staffOnly } from '../middleware/auth.js';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler.js';

const router = Router();

// Validation schemas
const vehicleSchema = z.object({
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().int().min(1990).max(new Date().getFullYear() + 1),
  category: z.enum(['ECONOMY', 'STANDARD', 'PREMIUM', 'LUXURY', 'SUV', 'VAN']),
  dailyRate: z.number().positive('Daily rate must be positive'),
  status: z.enum(['AVAILABLE', 'RENTED', 'MAINTENANCE', 'RETIRED']).optional(),
  images: z.array(z.string().url()).optional(),
  features: z.array(z.string()).optional(),
  description: z.string().optional(),
  seats: z.number().int().min(1).max(15),
  doors: z.number().int().min(2).max(6).optional(),
  transmission: z.enum(['AUTOMATIC', 'MANUAL']),
  fuelType: z.enum(['GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID']),
  mileage: z.number().int().min(0),
  color: z.string().optional(),
  licensePlate: z.string().min(1, 'License plate is required'),
  vin: z.string().length(17, 'VIN must be 17 characters'),
  location: z.string().optional(),
});

const vehicleFilterSchema = z.object({
  category: z.enum(['ECONOMY', 'STANDARD', 'PREMIUM', 'LUXURY', 'SUV', 'VAN']).optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  transmission: z.enum(['AUTOMATIC', 'MANUAL']).optional(),
  fuelType: z.enum(['GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID']).optional(),
  seats: z.coerce.number().optional(),
  status: z.enum(['AVAILABLE', 'RENTED', 'MAINTENANCE', 'RETIRED']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
  sortBy: z.enum(['dailyRate', 'year', 'createdAt', 'make']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// GET /api/vehicles - Public endpoint
router.get('/', async (req, res, next) => {
  try {
    const filters = vehicleFilterSchema.parse(req.query);
    const { page, pageSize, sortBy, sortOrder, ...filterParams } = filters;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (filterParams.category) {
      where.category = filterParams.category;
    }

    if (filterParams.transmission) {
      where.transmission = filterParams.transmission;
    }

    if (filterParams.fuelType) {
      where.fuelType = filterParams.fuelType;
    }

    if (filterParams.seats) {
      where.seats = { gte: filterParams.seats };
    }

    if (filterParams.status) {
      where.status = filterParams.status;
    } else {
      // Default to available vehicles for public access
      where.status = 'AVAILABLE';
    }

    if (filterParams.minPrice || filterParams.maxPrice) {
      where.dailyRate = {};
      if (filterParams.minPrice) {
        (where.dailyRate as Record<string, number>).gte = filterParams.minPrice;
      }
      if (filterParams.maxPrice) {
        (where.dailyRate as Record<string, number>).lte = filterParams.maxPrice;
      }
    }

    if (filterParams.search) {
      where.OR = [
        { make: { contains: filterParams.search, mode: 'insensitive' } },
        { model: { contains: filterParams.search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.vehicle.count({ where });

    // Get vehicles
    const vehicles = await prisma.vehicle.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: {
          select: { reviews: true },
        },
        reviews: {
          select: { rating: true },
        },
      },
    });

    // Calculate average rating
    const vehiclesWithRating = vehicles.map((vehicle) => {
      const avgRating =
        vehicle.reviews.length > 0
          ? vehicle.reviews.reduce((sum, r) => sum + r.rating, 0) / vehicle.reviews.length
          : null;

      const { reviews, ...rest } = vehicle;
      return {
        ...rest,
        averageRating: avgRating,
        reviewCount: vehicle._count.reviews,
      };
    });

    res.json({
      success: true,
      data: {
        items: vehiclesWithRating,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/vehicles/:id - Public endpoint
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        reviews: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { reviews: true, bookings: true },
        },
      },
    });

    if (!vehicle) {
      throw NotFoundError('Vehicle not found');
    }

    // Calculate average rating
    const avgRating =
      vehicle.reviews.length > 0
        ? vehicle.reviews.reduce((sum, r) => sum + r.rating, 0) / vehicle.reviews.length
        : null;

    res.json({
      success: true,
      data: {
        ...vehicle,
        averageRating: avgRating,
        reviewCount: vehicle._count.reviews,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/vehicles - Admin only
router.post('/', authenticate, staffOnly, async (req, res, next) => {
  try {
    const data = vehicleSchema.parse(req.body);

    const vehicle = await prisma.vehicle.create({
      data: {
        ...data,
        images: data.images || [],
        features: data.features || [],
      },
    });

    res.status(201).json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/vehicles/:id - Admin only
router.put('/:id', authenticate, staffOnly, async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = vehicleSchema.partial().parse(req.body);

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data,
    });

    res.json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/vehicles/:id - Admin only
router.delete('/:id', authenticate, staffOnly, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check for active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        vehicleId: id,
        status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] },
      },
    });

    if (activeBookings > 0) {
      throw BadRequestError('Cannot delete vehicle with active bookings');
    }

    await prisma.vehicle.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Vehicle deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/vehicles/:id/status - Admin only
router.patch('/:id/status', authenticate, staffOnly, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = z
      .object({
        status: z.enum(['AVAILABLE', 'RENTED', 'MAINTENANCE', 'RETIRED']),
      })
      .parse(req.body);

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: { status },
    });

    res.json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/vehicles/:id/availability - Check availability for dates
router.get('/:id/availability', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = z
      .object({
        startDate: z.string().transform((s) => new Date(s)),
        endDate: z.string().transform((s) => new Date(s)),
      })
      .parse(req.query);

    // Check for overlapping bookings
    const conflictingBookings = await prisma.booking.count({
      where: {
        vehicleId: id,
        status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] },
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
    });

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!vehicle) {
      throw NotFoundError('Vehicle not found');
    }

    const isAvailable =
      conflictingBookings === 0 && vehicle.status === 'AVAILABLE';

    res.json({
      success: true,
      data: {
        available: isAvailable,
        conflictingBookings,
        vehicleStatus: vehicle.status,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
