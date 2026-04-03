import { PrismaClient } from '../generated/prisma';

const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  (global as any).prisma = prisma;
}

export default prisma;
