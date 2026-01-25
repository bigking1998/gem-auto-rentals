import { PrismaClient } from '@prisma/client';
import { applySoftDeleteMiddleware } from './softDelete.js';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  // Apply soft delete middleware
  applySoftDeleteMiddleware(client);

  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;

// Re-export soft delete utilities for convenience
export {
  SOFT_DELETE_MODELS,
  isSoftDeleteModel,
  createSoftDeleteOperations,
  softDelete,
  isDeleted,
  getDeletedCounts,
} from './softDelete.js';
