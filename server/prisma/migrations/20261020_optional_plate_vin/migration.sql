-- Allow a vehicle to exist before its plate or VIN is known.
--
-- The owner's case: the car is on the fleet and rentable, but the plate or the
-- VIN is not to hand yet. Previously both were NOT NULL and UNIQUE, so there
-- was no way to record "to be determined" — and a placeholder string could only
-- be used on ONE vehicle before the unique index rejected the next.
--
-- Postgres treats NULLs as distinct under a UNIQUE index, so any number of
-- vehicles can be NULL at the same time while real values stay unique.
--
-- Non-destructive: dropping NOT NULL never touches existing rows.
ALTER TABLE "Vehicle" ALTER COLUMN "licensePlate" DROP NOT NULL;
ALTER TABLE "Vehicle" ALTER COLUMN "vin" DROP NOT NULL;
