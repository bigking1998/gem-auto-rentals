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

// Track database connection state
let dbConnectionPromise: Promise<boolean> | null = null;
let isDbConnected = false;

// Initialize database connection on startup
async function initializeDatabase(): Promise<boolean> {
  const maxRetries = 5; // Retries for Render cold starts
  let retries = 0;

  while (retries < maxRetries) {
    try {
      // Test the connection with a simple query
      await prisma.$queryRaw`SELECT 1`;
      console.log('Database connection established successfully');
      isDbConnected = true;
      globalForPrisma.isConnected = true;
      return true;
    } catch (error) {
      retries++;
      console.error(`Database connection attempt ${retries}/${maxRetries} failed:`, error);
      if (retries < maxRetries) {
        // Wait before retrying (1s, 2s, 3s, 4s)
        const delay = Math.min(1000 * retries, 4000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error('Failed to establish database connection after maximum retries');
  // Don't throw - let the server start anyway and handle errors per-request
  return false;
}

// Start connection initialization and store the promise
dbConnectionPromise = initializeDatabase().catch((err) => {
  console.error('Database initialization error:', err);
  return false;
});

// Export function to check if database is connected
export function isDatabaseConnected(): boolean {
  return isDbConnected;
}

// Export function to wait for database connection
export async function waitForDatabase(): Promise<boolean> {
  if (isDbConnected) return true;
  if (dbConnectionPromise) {
    return dbConnectionPromise;
  }
  return false;
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
