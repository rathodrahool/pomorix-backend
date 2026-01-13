import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Load environment variables
config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL as string,
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
