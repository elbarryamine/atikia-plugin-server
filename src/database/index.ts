import { config } from '../config/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as properties from './schemas/properties';
import * as pluginApiKeys from './schemas/pluginApiKeys';
import * as googleAddresses from './schemas/googleAddresses';
import * as users from './schemas/users';

export const db = drizzle(config.DATABASE_URL, {
  schema: {
    ...properties,
    ...pluginApiKeys,
    ...googleAddresses,
    ...users,
  },
});
