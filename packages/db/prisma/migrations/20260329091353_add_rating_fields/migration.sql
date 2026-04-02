-- AlterTable
ALTER TABLE "DriverProfile" ADD COLUMN     "rating" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Ride" ADD COLUMN     "rating" INTEGER;
