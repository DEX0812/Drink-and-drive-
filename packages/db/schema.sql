-- Create Enum Types
CREATE TYPE "Role" AS ENUM ('RIDER', 'DRIVER', 'ADMIN');
CREATE TYPE "Transmission" AS ENUM ('MANUAL', 'AUTO');
CREATE TYPE "RideType" AS ENUM ('HIRING', 'RIDE_HAILING');
CREATE TYPE "RideStatus" AS ENUM ('REQUESTED', 'ACCEPTED', 'ONGOING', 'COMPLETED', 'CANCELLED');
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED');

-- Create Users Table
CREATE TABLE "User" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" TEXT UNIQUE NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" DEFAULT 'RIDER',
    "createdAt" TIMESTAMP DEFAULT now(),
    "updatedAt" TIMESTAMP DEFAULT now()
);

-- Create Driver Profiles Table
CREATE TABLE "DriverProfile" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "driverId" UUID UNIQUE NOT NULL REFERENCES "User"("id"),
    "licenseNumber" TEXT UNIQUE NOT NULL,
    "experienceYears" INT DEFAULT 0,
    "manualCertified" BOOLEAN DEFAULT false,
    "status" "VerificationStatus" DEFAULT 'PENDING',
    "onboardingDocs" TEXT[],
    "lastLocationLat" DOUBLE PRECISION,
    "lastLocationLng" DOUBLE PRECISION,
    "isOnline" BOOLEAN DEFAULT false
);

-- Create Vehicles Table
CREATE TABLE "Vehicle" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "ownerId" UUID NOT NULL REFERENCES "User"("id"),
    "model" TEXT NOT NULL,
    "transmission" "Transmission" NOT NULL,
    "category" TEXT,
    "licensePlate" TEXT UNIQUE NOT NULL,
    "createdAt" TIMESTAMP DEFAULT now()
);

-- Create Rides Table
CREATE TABLE "Ride" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "riderId" UUID NOT NULL REFERENCES "User"("id"),
    "driverId" UUID REFERENCES "User"("id"),
    "type" "RideType" NOT NULL,
    "status" "RideStatus" DEFAULT 'REQUESTED',
    "pickupLat" DOUBLE PRECISION NOT NULL,
    "pickupLng" DOUBLE PRECISION NOT NULL,
    "dropoffLat" DOUBLE PRECISION NOT NULL,
    "dropoffLng" DOUBLE PRECISION NOT NULL,
    "distance" DOUBLE PRECISION,
    "price" DOUBLE PRECISION NOT NULL,
    "startTime" TIMESTAMP,
    "endTime" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT now()
);

-- Create Payments Table
CREATE TABLE "Payment" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "rideId" UUID NOT NULL REFERENCES "Ride"("id"),
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT DEFAULT 'USD',
    "status" TEXT DEFAULT 'PENDING',
    "provider" TEXT DEFAULT 'STRIPE',
    "transactionId" TEXT UNIQUE,
    "createdAt" TIMESTAMP DEFAULT now()
);
