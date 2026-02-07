
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    const errorMsg = 'DATABASE_URL environment variable is not set. Please set DATABASE_URL in your Netlify/Vercel environment variables.';
    console.error(errorMsg);
    if (process.env.NODE_ENV === 'production') {
        throw new Error(errorMsg);
    }
}

const pool = new Pool({
    connectionString,
    // Connection pool options for better reliability
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    application_name: 'storepulse',
    // Disable SSL certificate validation for Railway's self-signed proxy cert
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (error) => {
    console.error('Unexpected pg pool error:', error);
});

const adapter = new PrismaPg(pool);

const prismaClientSingleton = () => {
    return new PrismaClient({ adapter });
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientSingleton | undefined
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
