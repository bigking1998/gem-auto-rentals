/**
 * Scheduled Cleanup Job for Soft-Deleted Records
 *
 * This job permanently deletes records that have been soft-deleted
 * for longer than the retention period (default: 30 days).
 *
 * Usage:
 *   npx ts-node src/jobs/cleanupDeletedRecords.ts
 *   npm run cleanup:deleted
 *
 * Environment Variables:
 *   SOFT_DELETE_RETENTION_DAYS - Number of days to retain deleted records (default: 30)
 *   DRY_RUN - Set to 'true' to preview without deleting (default: false)
 */

import { PrismaClient } from '@prisma/client';
import { supabase, BUCKETS, deleteFile } from '../lib/supabase.js';

const prisma = new PrismaClient();

// Retention period in days (default 30)
const RETENTION_DAYS = parseInt(process.env.SOFT_DELETE_RETENTION_DAYS || '30', 10);
const DRY_RUN = process.env.DRY_RUN === 'true';

interface CleanupResult {
  model: string;
  deleted: number;
  errors: string[];
}

interface CleanupSummary {
  startTime: Date;
  endTime: Date;
  retentionDays: number;
  cutoffDate: Date;
  dryRun: boolean;
  results: CleanupResult[];
  totalDeleted: number;
  totalErrors: number;
}

/**
 * Calculate the cutoff date for cleanup
 * Records deleted before this date will be permanently removed
 */
function getCutoffDate(): Date {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);
  return cutoff;
}

/**
 * Delete files from Supabase Storage
 */
async function cleanupStorageFiles(
  filePaths: string[],
  bucket: typeof BUCKETS[keyof typeof BUCKETS]
): Promise<{ deleted: number; errors: string[] }> {
  if (!supabase || filePaths.length === 0) {
    return { deleted: 0, errors: [] };
  }

  let deleted = 0;
  const errors: string[] = [];

  for (const filePath of filePaths) {
    if (!filePath) continue;

    try {
      if (DRY_RUN) {
        console.log(`  [DRY RUN] Would delete file: ${bucket}/${filePath}`);
        deleted++;
      } else {
        const result = await deleteFile(bucket, filePath);
        if (result.success) {
          deleted++;
          console.log(`  Deleted file: ${bucket}/${filePath}`);
        } else if (result.error) {
          errors.push(`Failed to delete ${filePath}: ${result.error}`);
        }
      }
    } catch (error) {
      errors.push(`Error deleting ${filePath}: ${error}`);
    }
  }

  return { deleted, errors };
}

/**
 * Clean up Documents and their storage files
 */
async function cleanupDocuments(cutoffDate: Date): Promise<CleanupResult> {
  const result: CleanupResult = { model: 'Document', deleted: 0, errors: [] };

  try {
    // Find documents to delete
    const documents = await prisma.document.findMany({
      where: {
        deletedAt: {
          not: null,
          lt: cutoffDate,
        },
      },
      select: { id: true, fileUrl: true },
    });

    if (documents.length === 0) {
      console.log('  No documents to clean up');
      return result;
    }

    console.log(`  Found ${documents.length} documents to clean up`);

    // Delete storage files first
    const filePaths = documents.map((d) => d.fileUrl).filter(Boolean);
    const storageResult = await cleanupStorageFiles(filePaths, BUCKETS.DOCUMENTS);
    result.errors.push(...storageResult.errors);

    // Permanently delete database records
    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would delete ${documents.length} document records`);
      result.deleted = documents.length;
    } else {
      const deleteResult = await prisma.$executeRaw`
        DELETE FROM "Document"
        WHERE "deletedAt" IS NOT NULL
        AND "deletedAt" < ${cutoffDate}
      `;
      result.deleted = deleteResult;
      console.log(`  Deleted ${deleteResult} document records`);
    }
  } catch (error) {
    result.errors.push(`Document cleanup error: ${error}`);
  }

  return result;
}

/**
 * Clean up Vehicles and their storage images
 */
async function cleanupVehicles(cutoffDate: Date): Promise<CleanupResult> {
  const result: CleanupResult = { model: 'Vehicle', deleted: 0, errors: [] };

  try {
    // Find vehicles to delete
    const vehicles = await prisma.vehicle.findMany({
      where: {
        deletedAt: {
          not: null,
          lt: cutoffDate,
        },
      },
      select: { id: true, images: true },
    });

    if (vehicles.length === 0) {
      console.log('  No vehicles to clean up');
      return result;
    }

    console.log(`  Found ${vehicles.length} vehicles to clean up`);

    // Delete storage images
    const allImages = vehicles.flatMap((v) => v.images).filter(Boolean);
    if (allImages.length > 0) {
      const storageResult = await cleanupStorageFiles(allImages, BUCKETS.VEHICLES);
      result.errors.push(...storageResult.errors);
    }

    // Permanently delete database records
    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would delete ${vehicles.length} vehicle records`);
      result.deleted = vehicles.length;
    } else {
      const deleteResult = await prisma.$executeRaw`
        DELETE FROM "Vehicle"
        WHERE "deletedAt" IS NOT NULL
        AND "deletedAt" < ${cutoffDate}
      `;
      result.deleted = deleteResult;
      console.log(`  Deleted ${deleteResult} vehicle records`);
    }
  } catch (error) {
    result.errors.push(`Vehicle cleanup error: ${error}`);
  }

  return result;
}

/**
 * Clean up a simple model (no storage files)
 */
async function cleanupSimpleModel(
  modelName: string,
  tableName: string,
  cutoffDate: Date
): Promise<CleanupResult> {
  const result: CleanupResult = { model: modelName, deleted: 0, errors: [] };

  try {
    // Count records to delete
    const countResult = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*) as count FROM "${tableName}" WHERE "deletedAt" IS NOT NULL AND "deletedAt" < $1`,
      cutoffDate
    );
    const count = Number(countResult[0]?.count || 0);

    if (count === 0) {
      console.log(`  No ${modelName.toLowerCase()}s to clean up`);
      return result;
    }

    console.log(`  Found ${count} ${modelName.toLowerCase()}(s) to clean up`);

    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would delete ${count} ${modelName.toLowerCase()} records`);
      result.deleted = count;
    } else {
      const deleteResult = await prisma.$executeRawUnsafe(
        `DELETE FROM "${tableName}" WHERE "deletedAt" IS NOT NULL AND "deletedAt" < $1`,
        cutoffDate
      );
      result.deleted = deleteResult;
      console.log(`  Deleted ${deleteResult} ${modelName.toLowerCase()} records`);
    }
  } catch (error) {
    result.errors.push(`${modelName} cleanup error: ${error}`);
  }

  return result;
}

/**
 * Main cleanup function
 *
 * Deletion order is important to handle foreign key constraints:
 * 1. Messages (depends on Conversation)
 * 2. Documents (depends on User)
 * 3. Bookings (depends on User, Vehicle)
 * 4. Reviews (depends on User, Vehicle)
 * 5. MaintenanceRecord (depends on Vehicle)
 * 6. Invoices (depends on Booking)
 * 7. Conversations (depends on User)
 * 8. Vehicles
 * 9. Users
 */
async function runCleanup(): Promise<CleanupSummary> {
  const startTime = new Date();
  const cutoffDate = getCutoffDate();
  const results: CleanupResult[] = [];

  console.log('='.repeat(60));
  console.log('Soft Delete Cleanup Job');
  console.log('='.repeat(60));
  console.log(`Start time: ${startTime.toISOString()}`);
  console.log(`Retention period: ${RETENTION_DAYS} days`);
  console.log(`Cutoff date: ${cutoffDate.toISOString()}`);
  console.log(`Dry run: ${DRY_RUN ? 'YES (no changes will be made)' : 'NO'}`);
  console.log('='.repeat(60));

  // Clean up in dependency order (children first)
  console.log('\n[1/9] Cleaning up Documents...');
  results.push(await cleanupDocuments(cutoffDate));

  console.log('\n[2/9] Cleaning up Reviews...');
  results.push(await cleanupSimpleModel('Review', 'Review', cutoffDate));

  console.log('\n[3/9] Cleaning up Maintenance Records...');
  results.push(await cleanupSimpleModel('MaintenanceRecord', 'MaintenanceRecord', cutoffDate));

  console.log('\n[4/9] Cleaning up Invoices...');
  results.push(await cleanupSimpleModel('Invoice', 'Invoice', cutoffDate));

  console.log('\n[5/9] Cleaning up Bookings...');
  results.push(await cleanupSimpleModel('Booking', 'Booking', cutoffDate));

  console.log('\n[6/9] Cleaning up Conversations...');
  results.push(await cleanupSimpleModel('Conversation', 'Conversation', cutoffDate));

  console.log('\n[7/9] Cleaning up Vehicles...');
  results.push(await cleanupVehicles(cutoffDate));

  console.log('\n[8/9] Cleaning up Users...');
  results.push(await cleanupSimpleModel('User', 'User', cutoffDate));

  const endTime = new Date();
  const totalDeleted = results.reduce((sum, r) => sum + r.deleted, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('Cleanup Summary');
  console.log('='.repeat(60));
  console.log(`End time: ${endTime.toISOString()}`);
  console.log(`Duration: ${(endTime.getTime() - startTime.getTime()) / 1000}s`);
  console.log(`\nRecords deleted by model:`);

  for (const r of results) {
    console.log(`  ${r.model}: ${r.deleted}`);
    if (r.errors.length > 0) {
      for (const error of r.errors) {
        console.log(`    ERROR: ${error}`);
      }
    }
  }

  console.log(`\nTotal records deleted: ${totalDeleted}`);
  console.log(`Total errors: ${totalErrors}`);

  if (DRY_RUN) {
    console.log('\n*** DRY RUN - No changes were made ***');
  }

  console.log('='.repeat(60));

  return {
    startTime,
    endTime,
    retentionDays: RETENTION_DAYS,
    cutoffDate,
    dryRun: DRY_RUN,
    results,
    totalDeleted,
    totalErrors,
  };
}

// Run if executed directly
async function main() {
  try {
    await runCleanup();
    process.exit(0);
  } catch (error) {
    console.error('Cleanup job failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

export { runCleanup, getCutoffDate, CleanupSummary, CleanupResult };
