import { Router, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';

const router = Router();

// Source: Use environment variable (set only when migration is needed)
const SUPABASE_URL = process.env.SUPABASE_MIGRATION_URL || '';

// Helper to handle JSON null values for Prisma
function handleJsonNull(value: Prisma.JsonValue): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (value === null) {
    return Prisma.JsonNull;
  }
  return value as Prisma.InputJsonValue;
}

// One-time migration endpoint
router.post('/from-supabase', async (req, res: Response) => {
  // Simple auth check
  const authKey = req.headers['x-migration-key'];
  if (authKey !== 'migrate-gem-2024') {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const sourcePrisma = new PrismaClient({
    datasources: { db: { url: SUPABASE_URL } },
  });

  const results: Record<string, { migrated: number; errors: number }> = {};

  try {
    // 1. Migrate Users
    console.log('Migrating Users...');
    const users = await sourcePrisma.user.findMany();
    let userMigrated = 0, userErrors = 0;
    for (const user of users) {
      try {
        await prisma.user.upsert({
          where: { id: user.id },
          update: user,
          create: user,
        });
        userMigrated++;
      } catch (e) {
        userErrors++;
        console.error('User error:', e);
      }
    }
    results.users = { migrated: userMigrated, errors: userErrors };

    // 2. Migrate Vehicles
    console.log('Migrating Vehicles...');
    const vehicles = await sourcePrisma.vehicle.findMany();
    let vehicleMigrated = 0, vehicleErrors = 0;
    for (const vehicle of vehicles) {
      try {
        await prisma.vehicle.upsert({
          where: { id: vehicle.id },
          update: vehicle,
          create: vehicle,
        });
        vehicleMigrated++;
      } catch (e) {
        vehicleErrors++;
        console.error('Vehicle error:', e);
      }
    }
    results.vehicles = { migrated: vehicleMigrated, errors: vehicleErrors };

    // 3. Migrate Bookings (handle JSON extras field)
    console.log('Migrating Bookings...');
    const bookings = await sourcePrisma.booking.findMany();
    let bookingMigrated = 0, bookingErrors = 0;
    for (const booking of bookings) {
      try {
        const data = {
          ...booking,
          extras: handleJsonNull(booking.extras),
        };
        await prisma.booking.upsert({
          where: { id: booking.id },
          update: data,
          create: data,
        });
        bookingMigrated++;
      } catch (e) {
        bookingErrors++;
        console.error('Booking error:', e);
      }
    }
    results.bookings = { migrated: bookingMigrated, errors: bookingErrors };

    // 4. Migrate Payments
    console.log('Migrating Payments...');
    const payments = await sourcePrisma.payment.findMany();
    let paymentMigrated = 0, paymentErrors = 0;
    for (const payment of payments) {
      try {
        await prisma.payment.upsert({
          where: { id: payment.id },
          update: payment,
          create: payment,
        });
        paymentMigrated++;
      } catch (e) {
        paymentErrors++;
        console.error('Payment error:', e);
      }
    }
    results.payments = { migrated: paymentMigrated, errors: paymentErrors };

    // 5. Migrate Documents
    console.log('Migrating Documents...');
    const documents = await sourcePrisma.document.findMany();
    let docMigrated = 0, docErrors = 0;
    for (const doc of documents) {
      try {
        await prisma.document.upsert({
          where: { id: doc.id },
          update: doc,
          create: doc,
        });
        docMigrated++;
      } catch (e) {
        docErrors++;
        console.error('Document error:', e);
      }
    }
    results.documents = { migrated: docMigrated, errors: docErrors };

    // 6. Migrate Reviews
    console.log('Migrating Reviews...');
    const reviews = await sourcePrisma.review.findMany();
    let reviewMigrated = 0, reviewErrors = 0;
    for (const review of reviews) {
      try {
        await prisma.review.upsert({
          where: { id: review.id },
          update: review,
          create: review,
        });
        reviewMigrated++;
      } catch (e) {
        reviewErrors++;
        console.error('Review error:', e);
      }
    }
    results.reviews = { migrated: reviewMigrated, errors: reviewErrors };

    // 7. Migrate Maintenance Records
    console.log('Migrating MaintenanceRecords...');
    const maintenance = await sourcePrisma.maintenanceRecord.findMany();
    let maintMigrated = 0, maintErrors = 0;
    for (const record of maintenance) {
      try {
        await prisma.maintenanceRecord.upsert({
          where: { id: record.id },
          update: record,
          create: record,
        });
        maintMigrated++;
      } catch (e) {
        maintErrors++;
        console.error('Maintenance error:', e);
      }
    }
    results.maintenance = { migrated: maintMigrated, errors: maintErrors };

    // 8. Migrate User Preferences
    console.log('Migrating UserPreferences...');
    const prefs = await sourcePrisma.userPreferences.findMany();
    let prefMigrated = 0, prefErrors = 0;
    for (const pref of prefs) {
      try {
        await prisma.userPreferences.upsert({
          where: { id: pref.id },
          update: pref,
          create: pref,
        });
        prefMigrated++;
      } catch (e) {
        prefErrors++;
        console.error('Preferences error:', e);
      }
    }
    results.preferences = { migrated: prefMigrated, errors: prefErrors };

    // 9. Migrate Company Settings (handle JSON operatingHours field)
    console.log('Migrating CompanySettings...');
    const settings = await sourcePrisma.companySettings.findMany();
    let settMigrated = 0, settErrors = 0;
    for (const setting of settings) {
      try {
        const data = {
          ...setting,
          operatingHours: handleJsonNull(setting.operatingHours),
        };
        await prisma.companySettings.upsert({
          where: { id: setting.id },
          update: data,
          create: data,
        });
        settMigrated++;
      } catch (e) {
        settErrors++;
        console.error('Settings error:', e);
      }
    }
    results.companySettings = { migrated: settMigrated, errors: settErrors };

    // 10. Migrate Conversations
    console.log('Migrating Conversations...');
    const conversations = await sourcePrisma.conversation.findMany();
    let convMigrated = 0, convErrors = 0;
    for (const conv of conversations) {
      try {
        await prisma.conversation.upsert({
          where: { id: conv.id },
          update: conv,
          create: conv,
        });
        convMigrated++;
      } catch (e) {
        convErrors++;
        console.error('Conversation error:', e);
      }
    }
    results.conversations = { migrated: convMigrated, errors: convErrors };

    // 11. Migrate Messages
    console.log('Migrating Messages...');
    const messages = await sourcePrisma.message.findMany();
    let msgMigrated = 0, msgErrors = 0;
    for (const msg of messages) {
      try {
        await prisma.message.upsert({
          where: { id: msg.id },
          update: msg,
          create: msg,
        });
        msgMigrated++;
      } catch (e) {
        msgErrors++;
        console.error('Message error:', e);
      }
    }
    results.messages = { migrated: msgMigrated, errors: msgErrors };

    // 12. Migrate Activity Logs (handle JSON metadata field)
    console.log('Migrating ActivityLogs...');
    const logs = await sourcePrisma.activityLog.findMany();
    let logMigrated = 0, logErrors = 0;
    for (const log of logs) {
      try {
        const data = {
          ...log,
          metadata: handleJsonNull(log.metadata),
        };
        await prisma.activityLog.upsert({
          where: { id: log.id },
          update: data,
          create: data,
        });
        logMigrated++;
      } catch (e) {
        logErrors++;
        console.error('ActivityLog error:', e);
      }
    }
    results.activityLogs = { migrated: logMigrated, errors: logErrors };

    // 13. Migrate Notifications
    console.log('Migrating Notifications...');
    const notifications = await sourcePrisma.notification.findMany();
    let notifMigrated = 0, notifErrors = 0;
    for (const notif of notifications) {
      try {
        await prisma.notification.upsert({
          where: { id: notif.id },
          update: notif,
          create: notif,
        });
        notifMigrated++;
      } catch (e) {
        notifErrors++;
        console.error('Notification error:', e);
      }
    }
    results.notifications = { migrated: notifMigrated, errors: notifErrors };

    // 14. Migrate Invoices (handle JSON lineItems field)
    console.log('Migrating Invoices...');
    const invoices = await sourcePrisma.invoice.findMany();
    let invMigrated = 0, invErrors = 0;
    for (const invoice of invoices) {
      try {
        const data = {
          ...invoice,
          lineItems: invoice.lineItems as Prisma.InputJsonValue,
        };
        await prisma.invoice.upsert({
          where: { id: invoice.id },
          update: data,
          create: data,
        });
        invMigrated++;
      } catch (e) {
        invErrors++;
        console.error('Invoice error:', e);
      }
    }
    results.invoices = { migrated: invMigrated, errors: invErrors };

    await sourcePrisma.$disconnect();

    res.json({
      success: true,
      message: 'Migration completed',
      results,
    });
  } catch (error: any) {
    console.error('Migration failed:', error);
    await sourcePrisma.$disconnect();
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Delete user by email (cleanup utility)
router.delete('/user', async (req, res: Response) => {
  const authKey = req.headers['x-migration-key'];
  if (authKey !== 'migrate-gem-2024') {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email required' });
    return;
  }

  try {
    await prisma.user.delete({
      where: { email },
    });
    res.json({ success: true, message: `User ${email} deleted` });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Receive data via POST and insert directly (for migrations from local machine)
router.post('/import-data', async (req, res: Response) => {
  const authKey = req.headers['x-migration-key'];
  if (authKey !== 'migrate-gem-2024') {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { table, records } = req.body;
  if (!table || !records || !Array.isArray(records)) {
    res.status(400).json({ error: 'table and records[] required' });
    return;
  }

  const results = { inserted: 0, errors: 0, errorMessages: [] as string[] };

  try {
    for (const record of records) {
      try {
        // Handle JSON fields that might need special treatment
        const data = { ...record };

        // Handle JSON null values for known JSON fields
        if ('extras' in data && data.extras === null) data.extras = Prisma.JsonNull;
        if ('metadata' in data && data.metadata === null) data.metadata = Prisma.JsonNull;
        if ('operatingHours' in data && data.operatingHours === null) data.operatingHours = Prisma.JsonNull;
        if ('lineItems' in data && data.lineItems === null) data.lineItems = Prisma.JsonNull;

        // Use upsert to handle existing records
        switch (table) {
          case 'User':
            await prisma.user.upsert({
              where: { id: record.id },
              update: data,
              create: data,
            });
            break;
          case 'Vehicle':
            await prisma.vehicle.upsert({
              where: { id: record.id },
              update: data,
              create: data,
            });
            break;
          case 'Booking':
            await prisma.booking.upsert({
              where: { id: record.id },
              update: data,
              create: data,
            });
            break;
          case 'Payment':
            await prisma.payment.upsert({
              where: { id: record.id },
              update: data,
              create: data,
            });
            break;
          case 'Document':
            await prisma.document.upsert({
              where: { id: record.id },
              update: data,
              create: data,
            });
            break;
          case 'Review':
            await prisma.review.upsert({
              where: { id: record.id },
              update: data,
              create: data,
            });
            break;
          case 'MaintenanceRecord':
            await prisma.maintenanceRecord.upsert({
              where: { id: record.id },
              update: data,
              create: data,
            });
            break;
          case 'UserPreferences':
            await prisma.userPreferences.upsert({
              where: { id: record.id },
              update: data,
              create: data,
            });
            break;
          case 'CompanySettings':
            await prisma.companySettings.upsert({
              where: { id: record.id },
              update: data,
              create: data,
            });
            break;
          case 'Conversation':
            await prisma.conversation.upsert({
              where: { id: record.id },
              update: data,
              create: data,
            });
            break;
          case 'Message':
            await prisma.message.upsert({
              where: { id: record.id },
              update: data,
              create: data,
            });
            break;
          case 'ActivityLog':
            await prisma.activityLog.upsert({
              where: { id: record.id },
              update: data,
              create: data,
            });
            break;
          case 'Notification':
            await prisma.notification.upsert({
              where: { id: record.id },
              update: data,
              create: data,
            });
            break;
          case 'Invoice':
            await prisma.invoice.upsert({
              where: { id: record.id },
              update: data,
              create: data,
            });
            break;
          case 'Integration':
            await prisma.integration.upsert({
              where: { id: record.id },
              update: data,
              create: data,
            });
            break;
          default:
            throw new Error(`Unknown table: ${table}`);
        }
        results.inserted++;
      } catch (e: any) {
        results.errors++;
        results.errorMessages.push(`${record.id}: ${e.message}`);
      }
    }

    res.json({ success: true, table, results });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clear table for fresh import
router.post('/clear-table', async (req, res: Response) => {
  const authKey = req.headers['x-migration-key'];
  if (authKey !== 'migrate-gem-2024') {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { table } = req.body;
  if (!table) {
    res.status(400).json({ error: 'table required' });
    return;
  }

  try {
    // Use raw query to truncate
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE public."${table}" CASCADE`);
    res.json({ success: true, message: `Table ${table} cleared` });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Set user as admin (one-time setup)
router.post('/make-admin', async (req, res: Response) => {
  const authKey = req.headers['x-migration-key'];
  if (authKey !== 'migrate-gem-2024') {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email required' });
    return;
  }

  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
    });
    res.json({ success: true, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
