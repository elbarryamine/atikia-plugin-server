import dotenv from 'dotenv';

dotenv.config();

export const config = {
  DATABASE_URL: process.env.DATABASE_URL as string,
  PORT: parseInt(process.env.PORT || '4001', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
};
