import { PrismaClient } from '@prisma/client';

// Source: Supabase
const supabaseUrl = 'postgresql://postgres:Kinggodfrey.1998@db.szvnxiozrxmsudtcsddx.supabase.co:5432/postgres';

// Target: Render (external URL for local access)
const renderUrl = 'postgresql://gem_auto_rentals_db_user:rKqYooTFHnzdobGnDweXVfymX8adG0nS@dpg-d5tbrt5actks73a4ca50-a.oregon-postgres.render.com:5432/gem_auto_rentals_db';

const sourcePrisma = new PrismaClient({
  datasources: { db: { url: supabaseUrl } },
});

const targetPrisma = new PrismaClient({
  datasources: { db: { url: renderUrl } },
});

async function migrateData() {
  console.log('Starting data migration from Supabase to Render...\n');

  try {
    // 1. Migrate Users (no dependencies)
    console.log('Migrating Users...');
    const users = await sourcePrisma.user.findMany();
    for (const user of users) {
      try {
        await targetPrisma.user.create({ data: user });
        console.log(`  ✓ User: ${user.email}`);
      } catch (e: any) {
        if (e.code === 'P2002') {
          console.log(`  - User exists: ${user.email}`);
        } else {
          console.error(`  ✗ User error: ${e.message}`);
        }
      }
    }
    console.log(`Users migrated: ${users.length}\n`);

    // 2. Migrate Vehicles (no dependencies)
    console.log('Migrating Vehicles...');
    const vehicles = await sourcePrisma.vehicle.findMany();
    for (const vehicle of vehicles) {
      try {
        await targetPrisma.vehicle.create({ data: vehicle });
        console.log(`  ✓ Vehicle: ${vehicle.make} ${vehicle.model}`);
      } catch (e: any) {
        if (e.code === 'P2002') {
          console.log(`  - Vehicle exists: ${vehicle.make} ${vehicle.model}`);
        } else {
          console.error(`  ✗ Vehicle error: ${e.message}`);
        }
      }
    }
    console.log(`Vehicles migrated: ${vehicles.length}\n`);

    // 3. Migrate Bookings (depends on Users and Vehicles)
    console.log('Migrating Bookings...');
    const bookings = await sourcePrisma.booking.findMany();
    for (const booking of bookings) {
      try {
        await targetPrisma.booking.create({ data: booking });
        console.log(`  ✓ Booking: ${booking.id}`);
      } catch (e: any) {
        if (e.code === 'P2002') {
          console.log(`  - Booking exists: ${booking.id}`);
        } else {
          console.error(`  ✗ Booking error: ${e.message}`);
        }
      }
    }
    console.log(`Bookings migrated: ${bookings.length}\n`);

    // 4. Migrate Payments (depends on Bookings)
    console.log('Migrating Payments...');
    const payments = await sourcePrisma.payment.findMany();
    for (const payment of payments) {
      try {
        await targetPrisma.payment.create({ data: payment });
        console.log(`  ✓ Payment: ${payment.id}`);
      } catch (e: any) {
        if (e.code === 'P2002') {
          console.log(`  - Payment exists: ${payment.id}`);
        } else {
          console.error(`  ✗ Payment error: ${e.message}`);
        }
      }
    }
    console.log(`Payments migrated: ${payments.length}\n`);

    // 5. Migrate Documents (depends on Users)
    console.log('Migrating Documents...');
    const documents = await sourcePrisma.document.findMany();
    for (const document of documents) {
      try {
        await targetPrisma.document.create({ data: document });
        console.log(`  ✓ Document: ${document.fileName}`);
      } catch (e: any) {
        if (e.code === 'P2002') {
          console.log(`  - Document exists: ${document.fileName}`);
        } else {
          console.error(`  ✗ Document error: ${e.message}`);
        }
      }
    }
    console.log(`Documents migrated: ${documents.length}\n`);

    // 6. Migrate Reviews (depends on Users and Vehicles)
    console.log('Migrating Reviews...');
    const reviews = await sourcePrisma.review.findMany();
    for (const review of reviews) {
      try {
        await targetPrisma.review.create({ data: review });
        console.log(`  ✓ Review: ${review.id}`);
      } catch (e: any) {
        if (e.code === 'P2002') {
          console.log(`  - Review exists: ${review.id}`);
        } else {
          console.error(`  ✗ Review error: ${e.message}`);
        }
      }
    }
    console.log(`Reviews migrated: ${reviews.length}\n`);

    // 7. Migrate MaintenanceRecords (depends on Vehicles)
    console.log('Migrating MaintenanceRecords...');
    const maintenance = await sourcePrisma.maintenanceRecord.findMany();
    for (const record of maintenance) {
      try {
        await targetPrisma.maintenanceRecord.create({ data: record });
        console.log(`  ✓ Maintenance: ${record.id}`);
      } catch (e: any) {
        if (e.code === 'P2002') {
          console.log(`  - Maintenance exists: ${record.id}`);
        } else {
          console.error(`  ✗ Maintenance error: ${e.message}`);
        }
      }
    }
    console.log(`MaintenanceRecords migrated: ${maintenance.length}\n`);

    // 8. Migrate UserPreferences (depends on Users)
    console.log('Migrating UserPreferences...');
    const prefs = await sourcePrisma.userPreferences.findMany();
    for (const pref of prefs) {
      try {
        await targetPrisma.userPreferences.create({ data: pref });
        console.log(`  ✓ UserPreferences: ${pref.userId}`);
      } catch (e: any) {
        if (e.code === 'P2002') {
          console.log(`  - UserPreferences exists: ${pref.userId}`);
        } else {
          console.error(`  ✗ UserPreferences error: ${e.message}`);
        }
      }
    }
    console.log(`UserPreferences migrated: ${prefs.length}\n`);

    // 9. Migrate CompanySettings
    console.log('Migrating CompanySettings...');
    const settings = await sourcePrisma.companySettings.findMany();
    for (const setting of settings) {
      try {
        await targetPrisma.companySettings.create({ data: setting });
        console.log(`  ✓ CompanySettings: ${setting.id}`);
      } catch (e: any) {
        if (e.code === 'P2002') {
          console.log(`  - CompanySettings exists: ${setting.id}`);
        } else {
          console.error(`  ✗ CompanySettings error: ${e.message}`);
        }
      }
    }
    console.log(`CompanySettings migrated: ${settings.length}\n`);

    // 10. Migrate Conversations (depends on Users and Bookings)
    console.log('Migrating Conversations...');
    const conversations = await sourcePrisma.conversation.findMany();
    for (const conv of conversations) {
      try {
        await targetPrisma.conversation.create({ data: conv });
        console.log(`  ✓ Conversation: ${conv.id}`);
      } catch (e: any) {
        if (e.code === 'P2002') {
          console.log(`  - Conversation exists: ${conv.id}`);
        } else {
          console.error(`  ✗ Conversation error: ${e.message}`);
        }
      }
    }
    console.log(`Conversations migrated: ${conversations.length}\n`);

    // 11. Migrate Messages (depends on Conversations and Users)
    console.log('Migrating Messages...');
    const messages = await sourcePrisma.message.findMany();
    for (const msg of messages) {
      try {
        await targetPrisma.message.create({ data: msg });
        console.log(`  ✓ Message: ${msg.id}`);
      } catch (e: any) {
        if (e.code === 'P2002') {
          console.log(`  - Message exists: ${msg.id}`);
        } else {
          console.error(`  ✗ Message error: ${e.message}`);
        }
      }
    }
    console.log(`Messages migrated: ${messages.length}\n`);

    // 12. Migrate Sessions (depends on Users)
    console.log('Migrating Sessions...');
    const sessions = await sourcePrisma.session.findMany();
    for (const session of sessions) {
      try {
        await targetPrisma.session.create({ data: session });
        console.log(`  ✓ Session: ${session.id}`);
      } catch (e: any) {
        if (e.code === 'P2002') {
          console.log(`  - Session exists: ${session.id}`);
        } else {
          console.error(`  ✗ Session error: ${e.message}`);
        }
      }
    }
    console.log(`Sessions migrated: ${sessions.length}\n`);

    // 13. Migrate Notifications (depends on Users)
    console.log('Migrating Notifications...');
    const notifications = await sourcePrisma.notification.findMany();
    for (const notif of notifications) {
      try {
        await targetPrisma.notification.create({ data: notif });
        console.log(`  ✓ Notification: ${notif.id}`);
      } catch (e: any) {
        if (e.code === 'P2002') {
          console.log(`  - Notification exists: ${notif.id}`);
        } else {
          console.error(`  ✗ Notification error: ${e.message}`);
        }
      }
    }
    console.log(`Notifications migrated: ${notifications.length}\n`);

    // 14. Migrate Invoices (depends on Users and Bookings)
    console.log('Migrating Invoices...');
    const invoices = await sourcePrisma.invoice.findMany();
    for (const invoice of invoices) {
      try {
        await targetPrisma.invoice.create({ data: invoice });
        console.log(`  ✓ Invoice: ${invoice.invoiceNumber}`);
      } catch (e: any) {
        if (e.code === 'P2002') {
          console.log(`  - Invoice exists: ${invoice.invoiceNumber}`);
        } else {
          console.error(`  ✗ Invoice error: ${e.message}`);
        }
      }
    }
    console.log(`Invoices migrated: ${invoices.length}\n`);

    // 15. Migrate ActivityLogs (depends on Users)
    console.log('Migrating ActivityLogs...');
    const activityLogs = await sourcePrisma.activityLog.findMany();
    for (const log of activityLogs) {
      try {
        await targetPrisma.activityLog.create({ data: log });
        console.log(`  ✓ ActivityLog: ${log.id}`);
      } catch (e: any) {
        if (e.code === 'P2002') {
          console.log(`  - ActivityLog exists: ${log.id}`);
        } else {
          console.error(`  ✗ ActivityLog error: ${e.message}`);
        }
      }
    }
    console.log(`ActivityLogs migrated: ${activityLogs.length}\n`);

    console.log('✅ Migration complete!');

    // Verify counts
    console.log('\nVerifying target database counts:');
    const targetUsers = await targetPrisma.user.count();
    const targetVehicles = await targetPrisma.vehicle.count();
    const targetBookings = await targetPrisma.booking.count();
    console.log(`  Users: ${targetUsers}`);
    console.log(`  Vehicles: ${targetVehicles}`);
    console.log(`  Bookings: ${targetBookings}`);

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await sourcePrisma.$disconnect();
    await targetPrisma.$disconnect();
  }
}

migrateData();
