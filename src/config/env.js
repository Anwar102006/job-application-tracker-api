import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables based on NODE_ENV
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test' });
} else {
  dotenv.config();
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters long'),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  TRUST_PROXY: z.string().default('false'),
  DB_MAX_POOL_SIZE: z.coerce.number().default(50),
  DB_MIN_POOL_SIZE: z.coerce.number().default(5),
  DB_SERVER_SELECTION_TIMEOUT_MS: z.coerce.number().default(5000),
  DB_SOCKET_TIMEOUT_MS: z.coerce.number().default(45000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  parsed.error.issues.forEach((issue) => {
    console.error(` - ${issue.path.join('.')}: ${issue.message}`);
  });
  throw new Error('Environment configuration validation failed');
}

export const env = Object.freeze(parsed.data);
