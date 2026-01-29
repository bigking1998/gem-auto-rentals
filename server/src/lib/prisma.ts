import { PrismaClient } from '@prisma/client';
import { applySoftDeleteMiddleware } from './softDelete.js';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  isConnected: boolean;
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

// Initialize database connection on startup
async function initializeDatabase() {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      // Test the connection with a simple query
      await prisma.$queryRaw`SELECT 1`;
      console.log('Database connection established successfully');
      globalForPrisma.isConnected = true;
      return;
    } catch (error) {
      retries++;
      console.error(`Database connection attempt ${retries}/${maxRetries} failed:`, error);
      if (retries < maxRetries) {
        // Wait before retrying (exponential backoff: 1s, 2s, 4s, 8s, 16s)
        const delay = Math.min(1000 * Math.pow(2, retries - 1), 16000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error('Failed to establish database connection after maximum retries');
  // Don't throw - let the server start anyway and handle errors per-request
}

// Start connection initialization
initializeDatabase().catch(console.error);

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
