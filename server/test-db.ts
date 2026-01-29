import { PrismaClient } from '@prisma/client';

// Current Render URL (BROKEN)
const currentRenderUrl = "postgresql://postgres.szvnxiozrxmsudtcsddx:Kinggodfrey.1998@aws-1-us-east-2.pooler.supabase.com:5432/postgres?pgbouncer=true";

// Fixed URL (remove pgbouncer=true parameter)
const fixedUrl = "postgresql://postgres.szvnxiozrxmsudtcsddx:Kinggodfrey.1998@aws-1-us-east-2.pooler.supabase.com:5432/postgres";

const directUrl = "postgresql://postgres:Kinggodfrey.1998@db.szvnxiozrxmsudtcsddx.supabase.co:5432/postgres";

async function testConnection(name, url) {
    console.log(`Testing ${name}...`);
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: url,
            },
        },
    });

    try {
        await prisma.vehicle.count();
        console.log(`✅ ${name}: SUCCESS`);
    } catch (e) {
        console.error(`❌ ${name}: FAILED`, e.message);
    } finally {
        await prisma.$disconnect();
    }
}

async function main() {
    console.log('\n=== Testing Database Connections ===\n');
    await testConnection('Direct Connection', directUrl);
    await testConnection('Current Render URL (BROKEN)', currentRenderUrl);
    await testConnection('Fixed URL (no pgbouncer param)', fixedUrl);
    console.log('\n=== Results ===');
    console.log('✅ The fix: Remove ?pgbouncer=true from DATABASE_URL on Render');
}

main();
