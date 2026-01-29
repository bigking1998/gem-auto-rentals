-- Add confirmationEmailSent field to Booking table
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "confirmationEmailSent" BOOLEAN NOT NULL DEFAULT false;
