import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import prisma from '../lib/prisma.js';
import { authenticate, staffOnly } from '../middleware/auth.js';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler.js';
import { BUCKETS, isStorageConfigured, uploadFile, deleteFile, getPublicUrl } from '../lib/storage.js';

const router = Router();

// Configure multer for vehicle image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  },
});

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

// GET /api/vehicles/preview-pricing - Public endpoint for homepage pricing widget
router.get('/preview-pricing', async (req, res, next) => {
  try {
    const params = z
      .object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        category: z.enum(['ECONOMY', 'STANDARD', 'PREMIUM', 'LUXURY', 'SUV', 'VAN']).optional(),
      })
      .parse(req.query);

    // Build where clause for available vehicles
    const where: Record<string, unknown> = {
      status: 'AVAILABLE',
      deletedAt: null,
    };

    if (params.category) {
      where.category = params.category;
    }

    // Get pricing statistics
    const priceStats = await prisma.vehicle.aggregate({
      where,
      _min: { dailyRate: true },
      _max: { dailyRate: true },
      _avg: { dailyRate: true },
      _count: true,
    });

    // Calculate days if dates provided
    let days = 1;
    if (params.startDate && params.endDate) {
      const start = new Date(params.startDate);
      const end = new Date(params.endDate);
      days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    }

    // Get featured vehicles (top 3)
    const featuredVehicles = await prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        make: true,
        model: true,
        year: true,
        category: true,
        dailyRate: true,
        images: true,
        seats: true,
        transmission: true,
      },
    });

    res.json({
      success: true,
      data: {
        availableCount: priceStats._count,
        minDailyRate: priceStats._min.dailyRate ? Number(priceStats._min.dailyRate) : null,
        maxDailyRate: priceStats._max.dailyRate ? Number(priceStats._max.dailyRate) : null,
        avgDailyRate: priceStats._avg.dailyRate ? Number(priceStats._avg.dailyRate) : null,
        days,
        estimatedMinTotal: priceStats._min.dailyRate ? Number(priceStats._min.dailyRate) * days : null,
        estimatedMaxTotal: priceStats._max.dailyRate ? Number(priceStats._max.dailyRate) * days : null,
        featuredVehicles,
      },
    });
  } catch (error) {
    next(error);
  }
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
          select: { reviews: true, bookings: true },
        },
        reviews: {
          select: { rating: true },
        },
      },
    });

    // Calculate average rating and include booking count
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
        bookingCount: vehicle._count.bookings,
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

    // Soft delete with deletedBy tracking
    await prisma.vehicle.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: req.user!.id,
      },
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

// POST /api/vehicles/availability-bulk - Check availability for multiple vehicles
router.post('/availability-bulk', async (req, res, next) => {
  try {
    const { vehicleIds, startDate, endDate } = z
      .object({
        vehicleIds: z.array(z.string()).min(1).max(50),
        startDate: z.string().transform((s) => new Date(s)),
        endDate: z.string().transform((s) => new Date(s)),
      })
      .parse(req.body);

    // Get all vehicles with their statuses
    const vehicles = await prisma.vehicle.findMany({
      where: {
        id: { in: vehicleIds },
        deletedAt: null,
      },
      select: {
        id: true,
        status: true,
      },
    });

    // Get all conflicting bookings for these vehicles
    const conflictingBookings = await prisma.booking.groupBy({
      by: ['vehicleId'],
      where: {
        vehicleId: { in: vehicleIds },
        status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] },
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
      _count: {
        id: true,
      },
    });

    // Create a map of vehicle ID to conflict count
    const conflictMap = new Map(
      conflictingBookings.map((b) => [b.vehicleId, b._count.id])
    );

    // Build availability result
    const availability: Record<string, { available: boolean; status: 'available' | 'limited' | 'unavailable' }> = {};

    for (const vehicle of vehicles) {
      const conflicts = conflictMap.get(vehicle.id) || 0;
      const isAvailable = conflicts === 0 && vehicle.status === 'AVAILABLE';

      let status: 'available' | 'limited' | 'unavailable';
      if (!isAvailable) {
        status = 'unavailable';
      } else {
        // Check how many bookings exist in the next 7 days to determine if "limited"
        // For simplicity, we mark all available as "available"
        status = 'available';
      }

      availability[vehicle.id] = {
        available: isAvailable,
        status,
      };
    }

    res.json({
      success: true,
      data: availability,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/vehicles/:id/images - Upload vehicle image (Admin only)
router.post('/:id/images', authenticate, staffOnly, upload.single('image'), async (req, res, next) => {
  try {
    if (!isStorageConfigured()) {
      throw BadRequestError('Storage is not configured. Please contact support.');
    }

    const { id } = req.params;

    // Verify vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      select: { id: true, images: true },
    });

    if (!vehicle) {
      throw NotFoundError('Vehicle not found');
    }

    if (!req.file) {
      throw BadRequestError('No image file provided');
    }

    // Generate unique file path
    const timestamp = Date.now();
    const extension = req.file.originalname.split('.').pop() || 'jpg';
    const filePath = `${id}/${timestamp}.${extension}`;

    // Upload to Supabase
    const result = await uploadFile(
      BUCKETS.VEHICLES,
      filePath,
      req.file.buffer,
      req.file.mimetype
    );

    if ('error' in result) {
      throw BadRequestError(result.error);
    }

    // Get public URL
    const imageUrl = getPublicUrl(BUCKETS.VEHICLES, filePath);

    if (!imageUrl) {
      throw BadRequestError('Failed to generate image URL');
    }

    // Update vehicle with new image
    const updatedVehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        images: [...vehicle.images, imageUrl],
      },
    });

    res.status(201).json({
      success: true,
      data: {
        imageUrl,
        vehicle: updatedVehicle,
      },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/vehicles/:id/images - Delete vehicle image (Admin only)
router.delete('/:id/images', authenticate, staffOnly, async (req, res, next) => {
  try {
    if (!isStorageConfigured()) {
      throw BadRequestError('Storage is not configured. Please contact support.');
    }

    const { id } = req.params;
    const { imageUrl } = z.object({
      imageUrl: z.string().url(),
    }).parse(req.body);

    // Verify vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      select: { id: true, images: true },
    });

    if (!vehicle) {
      throw NotFoundError('Vehicle not found');
    }

    if (!vehicle.images.includes(imageUrl)) {
      throw BadRequestError('Image not found on this vehicle');
    }

    // Extract file path from URL
    const urlParts = imageUrl.split('/vehicles/');
    if (urlParts.length > 1) {
      const filePath = urlParts[1];
      await deleteFile(BUCKETS.VEHICLES, filePath);
    }

    // Update vehicle, removing the image
    const updatedVehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        images: vehicle.images.filter((img) => img !== imageUrl),
      },
    });

    res.json({
      success: true,
      data: updatedVehicle,
    });
  } catch (error) {
    next(error);
  }
});

// ============ REVIEW ENDPOINTS ============

// GET /api/vehicles/:id/reviews - Get reviews for a vehicle
router.get('/:id/reviews', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = z
      .object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().min(1).max(50).default(10),
      })
      .parse(req.query);

    // Verify vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!vehicle) {
      throw NotFoundError('Vehicle not found');
    }

    // Get total count
    const total = await prisma.review.count({
      where: { vehicleId: id, deletedAt: null },
    });

    // Get reviews with pagination
    const reviews = await prisma.review.findMany({
      where: { vehicleId: id, deletedAt: null },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calculate average rating
    const avgResult = await prisma.review.aggregate({
      where: { vehicleId: id, deletedAt: null },
      _avg: { rating: true },
    });

    res.json({
      success: true,
      data: {
        items: reviews,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        averageRating: avgResult._avg.rating,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/vehicles/:id/reviews - Submit a review (authenticated, must have completed booking)
router.post('/:id/reviews', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const { rating, comment } = z
      .object({
        rating: z.number().int().min(1).max(5),
        comment: z.string().max(1000).optional(),
      })
      .parse(req.body);

    // Verify vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!vehicle) {
      throw NotFoundError('Vehicle not found');
    }

    // Check if user has a completed booking for this vehicle
    const completedBooking = await prisma.booking.findFirst({
      where: {
        userId,
        vehicleId: id,
        status: 'COMPLETED',
      },
    });

    if (!completedBooking) {
      throw BadRequestError('You can only review vehicles you have rented');
    }

    // Check if user already has a review for this vehicle
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_vehicleId: { userId, vehicleId: id },
      },
    });

    let review;
    if (existingReview) {
      // Update existing review
      review = await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating,
          comment,
          deletedAt: null, // Restore if previously deleted
          deletedBy: null,
        },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
        },
      });
    } else {
      // Create new review
      review = await prisma.review.create({
        data: {
          userId,
          vehicleId: id,
          rating,
          comment,
        },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
        },
      });
    }

    res.status(existingReview ? 200 : 201).json({
      success: true,
      data: review,
      message: existingReview ? 'Review updated successfully' : 'Review submitted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/vehicles/:id/reviews - Delete own review (authenticated)
router.delete('/:id/reviews', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const review = await prisma.review.findUnique({
      where: {
        userId_vehicleId: { userId, vehicleId: id },
      },
    });

    if (!review) {
      throw NotFoundError('Review not found');
    }

    // Soft delete
    await prisma.review.update({
      where: { id: review.id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });

    res.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/vehicles/:id/reviews/images - Upload images for a review
router.post('/:id/reviews/images', authenticate, upload.array('images', 5), async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      throw BadRequestError('No images provided');
    }

    if (!isStorageConfigured()) {
      throw BadRequestError('Storage is not configured');
    }

    // Find user's review for this vehicle
    const review = await prisma.review.findUnique({
      where: {
        userId_vehicleId: { userId, vehicleId: id },
      },
    });

    if (!review) {
      throw NotFoundError('Review not found. Please submit a review first.');
    }

    // Upload images
    const uploadedUrls: string[] = [];
    for (const file of files) {
      const fileName = `reviews/${review.id}/${Date.now()}-${file.originalname}`;
      await uploadFile(BUCKETS.DOCUMENTS, fileName, file.buffer, file.mimetype);
      const url = getPublicUrl(BUCKETS.DOCUMENTS, fileName);
      if (url) {
        uploadedUrls.push(url);
      }
    }

    // Update review with new images (append to existing)
    const existingImages = review.images || [];
    const updatedReview = await prisma.review.update({
      where: { id: review.id },
      data: {
        images: [...existingImages, ...uploadedUrls],
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });

    res.json({
      success: true,
      data: updatedReview,
      message: `${uploadedUrls.length} image(s) uploaded successfully`,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/vehicles/:id/reviews/images - Remove an image from a review
router.delete('/:id/reviews/images', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { imageUrl } = req.body;
    const userId = req.user!.id;

    if (!imageUrl) {
      throw BadRequestError('Image URL is required');
    }

    const review = await prisma.review.findUnique({
      where: {
        userId_vehicleId: { userId, vehicleId: id },
      },
    });

    if (!review) {
      throw NotFoundError('Review not found');
    }

    // Remove image from array
    const updatedImages = (review.images || []).filter((url) => url !== imageUrl);

    const updatedReview = await prisma.review.update({
      where: { id: review.id },
      data: { images: updatedImages },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });

    res.json({
      success: true,
      data: updatedReview,
      message: 'Image removed successfully',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/vehicles/:id/can-review - Check if user can review this vehicle
router.get('/:id/can-review', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check for completed booking
    const completedBooking = await prisma.booking.findFirst({
      where: {
        userId,
        vehicleId: id,
        status: 'COMPLETED',
      },
    });

    // Check for existing review
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_vehicleId: { userId, vehicleId: id },
      },
      select: { id: true, rating: true, comment: true, deletedAt: true },
    });

    res.json({
      success: true,
      data: {
        canReview: !!completedBooking,
        hasExistingReview: !!existingReview && !existingReview.deletedAt,
        existingReview: existingReview && !existingReview.deletedAt ? existingReview : null,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
