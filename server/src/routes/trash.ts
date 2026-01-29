import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate, adminOnly } from '../middleware/auth.js';
import { NotFoundError } from '../middleware/errorHandler.js';
import { logActivity } from '../lib/activityLogger.js';
import { BUCKETS, deleteFile } from '../lib/storage.js';

const router = Router();

// Valid entity types for trash operations
const VALID_ENTITY_TYPES = ['users', 'vehicles', 'bookings', 'documents', 'conversations', 'invoices', 'reviews', 'maintenance'] as const;
type EntityType = (typeof VALID_ENTITY_TYPES)[number];

// Map entity type to model name
const entityToModel: Record<EntityType, string> = {
  users: 'user',
  vehicles: 'vehicle',
  bookings: 'booking',
  documents: 'document',
  conversations: 'conversation',
  invoices: 'invoice',
  reviews: 'review',
  maintenance: 'maintenanceRecord',
};

// Validation schemas
const listTrashSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const entityTypeSchema = z.enum(VALID_ENTITY_TYPES);

/**
 * GET /api/trash - Get summary counts of deleted items by entity type
 */
router.get('/', authenticate, adminOnly, async (_req, res, next) => {
  try {
    const whereDeleted = { deletedAt: { not: null } };

    const [users, vehicles, bookings, documents, conversations, invoices, reviews, maintenance] =
      await Promise.all([
        prisma.user.count({ where: whereDeleted, includeDeleted: true } as any),
        prisma.vehicle.count({ where: whereDeleted, includeDeleted: true } as any),
        prisma.booking.count({ where: whereDeleted, includeDeleted: true } as any),
        prisma.document.count({ where: whereDeleted, includeDeleted: true } as any),
        prisma.conversation.count({ where: whereDeleted, includeDeleted: true } as any),
        prisma.invoice.count({ where: whereDeleted, includeDeleted: true } as any),
        prisma.review.count({ where: whereDeleted, includeDeleted: true } as any),
        prisma.maintenanceRecord.count({ where: whereDeleted, includeDeleted: true } as any),
      ]);

    res.json({
      success: true,
      data: {
        users,
        vehicles,
        bookings,
        documents,
        conversations,
        invoices,
        reviews,
        maintenance,
        total: users + vehicles + bookings + documents + conversations + invoices + reviews + maintenance,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/trash/:entityType - List deleted items of a specific type
 */
router.get('/:entityType', authenticate, adminOnly, async (req, res, next) => {
  try {
    const entityType = entityTypeSchema.parse(req.params.entityType);
    const { search, page, pageSize } = listTrashSchema.parse(req.query);
    const skip = (page - 1) * pageSize;

    const whereDeleted = { deletedAt: { not: null } };
    let items: any[] = [];
    let total = 0;

    switch (entityType) {
      case 'users': {
        const searchWhere = search
          ? {
              OR: [
                { email: { contains: search, mode: 'insensitive' as const } },
                { firstName: { contains: search, mode: 'insensitive' as const } },
                { lastName: { contains: search, mode: 'insensitive' as const } },
              ],
            }
          : {};

        [items, total] = await Promise.all([
          prisma.user.findMany({
            where: { ...whereDeleted, ...searchWhere },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              avatarUrl: true,
              deletedAt: true,
              deletedBy: true,
              createdAt: true,
            },
            orderBy: { deletedAt: 'desc' },
            skip,
            take: pageSize,
            includeDeleted: true,
          } as any),
          prisma.user.count({ where: { ...whereDeleted, ...searchWhere }, includeDeleted: true } as any),
        ]);
        break;
      }

      case 'vehicles': {
        const searchWhere = search
          ? {
              OR: [
                { make: { contains: search, mode: 'insensitive' as const } },
                { model: { contains: search, mode: 'insensitive' as const } },
                { licensePlate: { contains: search, mode: 'insensitive' as const } },
              ],
            }
          : {};

        [items, total] = await Promise.all([
          prisma.vehicle.findMany({
            where: { ...whereDeleted, ...searchWhere },
            select: {
              id: true,
              make: true,
              model: true,
              year: true,
              licensePlate: true,
              status: true,
              dailyRate: true,
              images: true,
              deletedAt: true,
              deletedBy: true,
              createdAt: true,
            },
            orderBy: { deletedAt: 'desc' },
            skip,
            take: pageSize,
            includeDeleted: true,
          } as any),
          prisma.vehicle.count({ where: { ...whereDeleted, ...searchWhere }, includeDeleted: true } as any),
        ]);
        break;
      }

      case 'bookings': {
        [items, total] = await Promise.all([
          prisma.booking.findMany({
            where: whereDeleted,
            include: {
              user: { select: { id: true, firstName: true, lastName: true, email: true } },
              vehicle: { select: { id: true, make: true, model: true, year: true } },
            },
            orderBy: { deletedAt: 'desc' },
            skip,
            take: pageSize,
            includeDeleted: true,
          } as any),
          prisma.booking.count({ where: whereDeleted, includeDeleted: true } as any),
        ]);
        break;
      }

      case 'documents': {
        [items, total] = await Promise.all([
          prisma.document.findMany({
            where: whereDeleted,
            include: {
              user: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
            orderBy: { deletedAt: 'desc' },
            skip,
            take: pageSize,
            includeDeleted: true,
          } as any),
          prisma.document.count({ where: whereDeleted, includeDeleted: true } as any),
        ]);
        break;
      }

      case 'conversations': {
        [items, total] = await Promise.all([
          prisma.conversation.findMany({
            where: whereDeleted,
            include: {
              customer: { select: { id: true, firstName: true, lastName: true, email: true } },
              assignedTo: { select: { id: true, firstName: true, lastName: true } },
            },
            orderBy: { deletedAt: 'desc' },
            skip,
            take: pageSize,
            includeDeleted: true,
          } as any),
          prisma.conversation.count({ where: whereDeleted, includeDeleted: true } as any),
        ]);
        break;
      }

      case 'invoices': {
        [items, total] = await Promise.all([
          prisma.invoice.findMany({
            where: whereDeleted,
            include: {
              customer: { select: { id: true, firstName: true, lastName: true, email: true } },
              booking: { select: { id: true } },
            },
            orderBy: { deletedAt: 'desc' },
            skip,
            take: pageSize,
            includeDeleted: true,
          } as any),
          prisma.invoice.count({ where: whereDeleted, includeDeleted: true } as any),
        ]);
        break;
      }

      case 'reviews': {
        [items, total] = await Promise.all([
          prisma.review.findMany({
            where: whereDeleted,
            include: {
              user: { select: { id: true, firstName: true, lastName: true } },
              vehicle: { select: { id: true, make: true, model: true } },
            },
            orderBy: { deletedAt: 'desc' },
            skip,
            take: pageSize,
            includeDeleted: true,
          } as any),
          prisma.review.count({ where: whereDeleted, includeDeleted: true } as any),
        ]);
        break;
      }

      case 'maintenance': {
        [items, total] = await Promise.all([
          prisma.maintenanceRecord.findMany({
            where: whereDeleted,
            include: {
              vehicle: { select: { id: true, make: true, model: true, year: true } },
            },
            orderBy: { deletedAt: 'desc' },
            skip,
            take: pageSize,
            includeDeleted: true,
          } as any),
          prisma.maintenanceRecord.count({ where: whereDeleted, includeDeleted: true } as any),
        ]);
        break;
      }
    }

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/trash/:entityType/:id/restore - Restore a soft-deleted item
 */
router.post('/:entityType/:id/restore', authenticate, adminOnly, async (req, res, next) => {
  try {
    const entityType = entityTypeSchema.parse(req.params.entityType);
    const { id } = req.params;
    const modelName = entityToModel[entityType];
    const model = (prisma as any)[modelName];

    // Find the deleted record
    const record = await model.findFirst({
      where: { id, deletedAt: { not: null } },
      includeDeleted: true,
    });

    if (!record) {
      throw NotFoundError('Record not found or not deleted');
    }

    // Restore the record
    const restored = await model.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedBy: null,
      },
      includeDeleted: true,
    });

    // Log the activity
    const activityActions: Record<EntityType, string> = {
      users: 'USER_RESTORE',
      vehicles: 'VEHICLE_RESTORE',
      bookings: 'BOOKING_RESTORE',
      documents: 'DOCUMENT_RESTORE',
      conversations: 'CONVERSATION_RESTORE',
      invoices: 'INVOICE_RESTORE',
      reviews: 'REVIEW_RESTORE',
      maintenance: 'MAINTENANCE_RESTORE',
    };

    await logActivity({
      userId: req.user!.id,
      action: activityActions[entityType] as any,
      entityType: modelName.charAt(0).toUpperCase() + modelName.slice(1),
      entityId: id,
      description: `Restored ${entityType.slice(0, -1)} from trash`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      success: true,
      data: restored,
      message: `${entityType.slice(0, -1).charAt(0).toUpperCase() + entityType.slice(1, -1)} restored successfully`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/trash/:entityType/:id/permanent - Permanently delete an item
 */
router.delete('/:entityType/:id/permanent', authenticate, adminOnly, async (req, res, next) => {
  try {
    const entityType = entityTypeSchema.parse(req.params.entityType);
    const { id } = req.params;
    const modelName = entityToModel[entityType];
    const model = (prisma as any)[modelName];

    // Find the deleted record
    const record = await model.findFirst({
      where: { id, deletedAt: { not: null } },
      includeDeleted: true,
    });

    if (!record) {
      throw NotFoundError('Record not found or not in trash');
    }

    // Clean up associated files before permanent deletion
    if (entityType === 'documents' && record.fileUrl) {
      try {
        await deleteFile(BUCKETS.DOCUMENTS, record.fileUrl);
      } catch (e) {
        console.error('Failed to delete document file:', e);
      }
    }

    if (entityType === 'users' && record.avatarUrl) {
      try {
        await deleteFile(BUCKETS.AVATARS, record.avatarUrl);
      } catch (e) {
        console.error('Failed to delete avatar:', e);
      }
    }

    // Perform hard delete using raw SQL
    const tableName = modelName.charAt(0).toUpperCase() + modelName.slice(1);
    await prisma.$executeRawUnsafe(`DELETE FROM "${tableName}" WHERE id = $1`, id);

    res.json({
      success: true,
      message: `${entityType.slice(0, -1).charAt(0).toUpperCase() + entityType.slice(1, -1)} permanently deleted`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/trash/empty - Empty all trash (admin only)
 */
router.post('/empty', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { entityType } = req.body as { entityType?: EntityType };
    const deletedCounts: Record<string, number> = {};

    if (entityType) {
      // Empty trash for specific entity type
      const validatedType = entityTypeSchema.parse(entityType);
      const modelName = entityToModel[validatedType];
      const tableName = modelName.charAt(0).toUpperCase() + modelName.slice(1);

      const result = await prisma.$executeRawUnsafe(
        `DELETE FROM "${tableName}" WHERE "deletedAt" IS NOT NULL`
      );
      deletedCounts[validatedType] = result as number;
    } else {
      // Empty all trash - delete in dependency order
      // Order matters for foreign key constraints

      // 1. MaintenanceRecord
      const maintenanceResult = await prisma.$executeRaw`
        DELETE FROM "MaintenanceRecord" WHERE "deletedAt" IS NOT NULL
      `;
      deletedCounts.maintenance = maintenanceResult as number;

      // 2. Review
      const reviewResult = await prisma.$executeRaw`
        DELETE FROM "Review" WHERE "deletedAt" IS NOT NULL
      `;
      deletedCounts.reviews = reviewResult as number;

      // 3. Document
      const documentResult = await prisma.$executeRaw`
        DELETE FROM "Document" WHERE "deletedAt" IS NOT NULL
      `;
      deletedCounts.documents = documentResult as number;

      // 4. Invoice
      const invoiceResult = await prisma.$executeRaw`
        DELETE FROM "Invoice" WHERE "deletedAt" IS NOT NULL
      `;
      deletedCounts.invoices = invoiceResult as number;

      // 5. Conversation (messages cascade)
      const conversationResult = await prisma.$executeRaw`
        DELETE FROM "Conversation" WHERE "deletedAt" IS NOT NULL
      `;
      deletedCounts.conversations = conversationResult as number;

      // 6. Booking
      const bookingResult = await prisma.$executeRaw`
        DELETE FROM "Booking" WHERE "deletedAt" IS NOT NULL
      `;
      deletedCounts.bookings = bookingResult as number;

      // 7. Vehicle
      const vehicleResult = await prisma.$executeRaw`
        DELETE FROM "Vehicle" WHERE "deletedAt" IS NOT NULL
      `;
      deletedCounts.vehicles = vehicleResult as number;

      // 8. User (last due to foreign keys)
      const userResult = await prisma.$executeRaw`
        DELETE FROM "User" WHERE "deletedAt" IS NOT NULL
      `;
      deletedCounts.users = userResult as number;
    }

    const total = Object.values(deletedCounts).reduce((sum, count) => sum + count, 0);

    res.json({
      success: true,
      data: {
        deletedCounts,
        total,
      },
      message: `Permanently deleted ${total} records`,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
