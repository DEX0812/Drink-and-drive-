import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding DriveSafe Platform...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Create a Demo Rider
  const rider = await prisma.user.upsert({
    where: { email: 'rider@drivesafe.com' },
    update: {},
    create: {
      email: 'rider@drivesafe.com',
      password: hashedPassword,
      name: 'Siddharth (Rider)',
      role: 'RIDER',
    },
  });

  // 2. Create a Demo Driver
  const driver = await prisma.user.upsert({
    where: { email: 'driver@drivesafe.com' },
    update: {},
    create: {
      email: 'driver@drivesafe.com',
      password: hashedPassword,
      name: 'Rajiv (Auto Expert)',
      role: 'DRIVER',
    },
  });

  // 3. Create Driver Profile (Bangalore coordinates)
  await prisma.driverProfile.upsert({
    where: { driverId: driver.id },
    update: {},
    create: {
      driverId: driver.id,
      licenseNumber: 'KA-01-2024-X9',
      experienceYears: 8,
      manualCertified: true,
      status: 'ACTIVE',
      lastLocationLat: 12.9716,
      lastLocationLng: 77.5946,
      isOnline: true,
    },
  });

  // 4. Create Vehicle
  await prisma.vehicle.upsert({
    where: { licensePlate: 'KA-03-NV-5000' },
    update: {},
    create: {
      ownerId: rider.id,
      model: 'Honda Civic 2024',
      transmission: 'MANUAL',
      category: 'SEDAN',
      licensePlate: 'KA-03-NV-5000',
    },
  });

  console.log('✅ Seeding Complete. Enjoy the DriveSafe experience.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

