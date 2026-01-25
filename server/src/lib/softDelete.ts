import { PrismaClient } from '@prisma/client';

/**
 * Models that support soft delete functionality
 * These models have deletedAt and deletedBy fields
 */
export const SOFT_DELETE_MODELS = [
  'User',
  'Vehicle',
  'Booking',
  'Document',
  'Review',
  'MaintenanceRecord',
  'Conversation',
  'Invoice',
] as const;

export type SoftDeleteModel = (typeof SOFT_DELETE_MODELS)[number];

/**
 * Type guard to check if a model supports soft delete
 */
export function isSoftDeleteModel(model: string | undefined): model is SoftDeleteModel {
  if (!model) return false;
  return SOFT_DELETE_MODELS.includes(model as SoftDeleteModel);
}

/**
 * Actions that should filter out soft-deleted records
 */
const FIND_ACTIONS = ['findUnique', 'findFirst', 'findMany', 'count', 'aggregate', 'groupBy'];

/**
 * Apply soft delete middleware to Prisma client
 *
 * This middleware:
 * 1. Automatically filters out soft-deleted records on find operations
 * 2. Converts delete operations to soft deletes (update with deletedAt)
 * 3. Supports includeDeleted flag to bypass the filter
 */
export function applySoftDeleteMiddleware(prisma: PrismaClient): void {
  // Middleware for filtering soft-deleted records on find operations
  prisma.$use(async (params, next) => {
    // Skip if not a soft-delete model
    if (!isSoftDeleteModel(params.model)) {
      return next(params);
    }

    // Check for explicit includeDeleted flag
    const includeDeleted = (params.args as any)?.includeDeleted;
    if (params.args) {
      delete (params.args as any).includeDeleted;
    }

    // Filter out soft-deleted records on find operations
    if (FIND_ACTIONS.includes(params.action) && !includeDeleted) {
      params.args = params.args || {};

      if (params.args.where) {
        // Don't override existing deletedAt filter
        if (params.args.where.deletedAt === undefined) {
          params.args.where = {
            ...params.args.where,
            deletedAt: null,
          };
        }
      } else {
        params.args.where = { deletedAt: null };
      }
    }

    // Convert delete to soft delete
    if (params.action === 'delete') {
      params.action = 'update';
      params.args.data = {
        deletedAt: new Date(),
        // deletedBy should be set by the caller
      };
    }

    // Convert deleteMany to soft delete
    if (params.action === 'deleteMany') {
      params.action = 'updateMany';
      params.args.data = {
        deletedAt: new Date(),
      };
    }

    return next(params);
  });
}

/**
 * Helper type for Prisma operations with soft delete support
 */
export interface SoftDeleteOperations<T> {
  /**
   * Find records including soft-deleted ones
   */
  findManyWithDeleted: (args?: any) => Promise<T[]>;

  /**
   * Find only soft-deleted records
   */
  findDeleted: (args?: any) => Promise<T[]>;

  /**
   * Restore a soft-deleted record
   */
  restore: (args: { where: any }) => Promise<T>;

  /**
   * Permanently delete a record (bypass soft delete)
   */
  hardDelete: (args: { where: any }) => Promise<T>;
}

/**
 * Create extended Prisma client methods for a specific model
 *
 * Usage:
 * const userOps = createSoftDeleteOperations(prisma, 'user');
 * const deletedUsers = await userOps.findDeleted();
 * await userOps.restore({ where: { id: 'user-id' } });
 */
export function createSoftDeleteOperations<T>(
  prisma: PrismaClient,
  modelName: Lowercase<SoftDeleteModel>
): SoftDeleteOperations<T> {
  const model = (prisma as any)[modelName];

  return {
    /**
     * Find all records including soft-deleted ones
     */
    async findManyWithDeleted(args: any = {}): Promise<T[]> {
      return model.findMany({
        ...args,
        includeDeleted: true,
      });
    },

    /**
     * Find only soft-deleted records
     */
    async findDeleted(args: any = {}): Promise<T[]> {
      return model.findMany({
        ...args,
        where: {
          ...args.where,
          deletedAt: { not: null },
        },
        includeDeleted: true,
      });
    },

    /**
     * Restore a soft-deleted record
     */
    async restore(args: { where: any }): Promise<T> {
      // First check if the record is soft-deleted
      const record = await model.findFirst({
        where: {
          ...args.where,
          deletedAt: { not: null },
        },
        includeDeleted: true,
      });

      if (!record) {
        throw new Error('Record not found or not deleted');
      }

      // Restore the record
      return model.update({
        where: args.where,
        data: {
          deletedAt: null,
          deletedBy: null,
        },
        includeDeleted: true,
      });
    },

    /**
     * Permanently delete a record (bypass soft delete)
     * Use with caution - this cannot be undone
     */
    async hardDelete(args: { where: any }): Promise<T> {
      // Use $queryRaw to bypass middleware
      const modelNameCapitalized = modelName.charAt(0).toUpperCase() + modelName.slice(1);
      const whereKey = Object.keys(args.where)[0];
      const whereValue = args.where[whereKey];

      // For safety, first fetch the record
      const record = await model.findFirst({
        where: args.where,
        includeDeleted: true,
      });

      if (!record) {
        throw new Error('Record not found');
      }

      // Execute raw delete
      await (prisma as any).$executeRawUnsafe(
        `DELETE FROM "${modelNameCapitalized}" WHERE "${whereKey}" = $1`,
        whereValue
      );

      return record;
    },
  };
}

/**
 * Soft delete a record with the actor's ID
 */
export async function softDelete(
  prisma: PrismaClient,
  modelName: Lowercase<SoftDeleteModel>,
  where: any,
  deletedById: string
): Promise<any> {
  const model = (prisma as any)[modelName];

  return model.update({
    where,
    data: {
      deletedAt: new Date(),
      deletedBy: deletedById,
    },
  });
}

/**
 * Check if a record is soft-deleted
 */
export async function isDeleted(
  prisma: PrismaClient,
  modelName: Lowercase<SoftDeleteModel>,
  where: any
): Promise<boolean> {
  const model = (prisma as any)[modelName];

  const record = await model.findFirst({
    where: {
      ...where,
      deletedAt: { not: null },
    },
    select: { id: true },
    includeDeleted: true,
  });

  return record !== null;
}

/**
 * Get counts of deleted records by model
 */
export async function getDeletedCounts(prisma: PrismaClient): Promise<Record<SoftDeleteModel, number>> {
  const counts: Record<string, number> = {};

  for (const modelName of SOFT_DELETE_MODELS) {
    const model = (prisma as any)[modelName.charAt(0).toLowerCase() + modelName.slice(1)];
    if (model) {
      counts[modelName] = await model.count({
        where: { deletedAt: { not: null } },
        includeDeleted: true,
      });
    }
  }

  return counts as Record<SoftDeleteModel, number>;
}
