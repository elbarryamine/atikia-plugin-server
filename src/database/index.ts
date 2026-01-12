import { config } from '../config/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as properties from '../../backend/src/database/schemas/properties';

export const db = drizzle(config.DATABASE_URL, {
  schema: {
    ...properties,
  },
});
