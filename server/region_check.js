const { PrismaClient } = require("@prisma/client");

const regions = [
  "aws-0-us-east-1",
  "aws-0-us-east-2",
  "aws-0-us-west-1",
  "aws-0-us-west-2",
  "aws-0-eu-central-1",
  "aws-0-eu-west-1",
  "aws-0-eu-west-2",
  "aws-0-sa-east-1",
  "aws-0-ap-southeast-1"
];

const checkRegion = async (region) => {
  const url = `postgresql://postgres.szvnxiozrxmsudtcsddx:Kinggodfrey.1998@${region}.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`;
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log(`[SUCCESS] Region found: ${region}`);
    process.exit(0);
  } catch (e) {
    if (e.message.includes("Tenant or user not found")) {
      console.log(`[FAIL] ${region}: Tenant not found`);
    } else {
      console.log(`[ERROR] ${region}: ${e.message.split('\n')[0]}`);
      // If it's auth failure (password), it implies Tenant Found!
      if (e.message.includes("password authentication failed")) {
         console.log(`[SUCCESS] Region found (valid tenant): ${region}`);
         process.exit(0);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
};

(async () => {
  for (const r of regions) {
    await checkRegion(r);
  }
  console.log("Done checking.");
})();
