-- Soft Delete Migration
-- Adds deletedAt and deletedBy fields to all soft-deletable models

-- User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
CREATE INDEX IF NOT EXISTS "User_deletedAt_idx" ON "User"("deletedAt");

-- Vehicle table
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
CREATE INDEX IF NOT EXISTS "Vehicle_deletedAt_idx" ON "Vehicle"("deletedAt");

-- Booking table
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
CREATE INDEX IF NOT EXISTS "Booking_deletedAt_idx" ON "Booking"("deletedAt");

-- Document table
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
CREATE INDEX IF NOT EXISTS "Document_deletedAt_idx" ON "Document"("deletedAt");

-- Review table
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
CREATE INDEX IF NOT EXISTS "Review_deletedAt_idx" ON "Review"("deletedAt");

-- MaintenanceRecord table
ALTER TABLE "MaintenanceRecord" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "MaintenanceRecord" ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
CREATE INDEX IF NOT EXISTS "MaintenanceRecord_deletedAt_idx" ON "MaintenanceRecord"("deletedAt");

-- Conversation table
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
CREATE INDEX IF NOT EXISTS "Conversation_deletedAt_idx" ON "Conversation"("deletedAt");

-- Invoice table
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
CREATE INDEX IF NOT EXISTS "Invoice_deletedAt_idx" ON "Invoice"("deletedAt");
