import dotenv from "dotenv";
import { z } from 'zod';
import logger from './logger.js';
dotenv.config();



const envSchema = z.object({
    NODE_ENV: z.string().default('development').refine((val) => ['development', 'production'].includes(val), {
        message: 'NODE_ENV must be either "development" or "production"',
    }),
    PORT: z.coerce.number().default(3000),
    BACKEND_URL: z.string().url(),
    FRONTEND_URL: z.string().url(),
});

const parseEnv = () => {
    const result = envSchema.safeParse(process.env);

    if (!result.success) {
        logger.error('❌ Invalid environment variables:');
        logger.error(JSON.stringify(result.error.format(), null, 2));
        process.exit(1);
    }

    return result.data;
};

export const { NODE_ENV, PORT, BACKEND_URL, FRONTEND_URL } = parseEnv();
