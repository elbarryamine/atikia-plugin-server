import { timestamp, pgTable, uuid, jsonb, decimal, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { properties } from './properties';
import { GeocodingResult } from './geocoding-result';

// Google Address Table
export const googleAddresses = pgTable(
  'google_addresses',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    latitude: decimal('latitude', { precision: 10, scale: 8 }).notNull(),
    longitude: decimal('longitude', { precision: 11, scale: 8 }).notNull(),
    googleAddressJson: jsonb('google_address_json').$type<GeocodingResult>().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('google_addresses_latitude_longitude_idx').on(t.latitude, t.longitude),
    index('google_addresses_created_at_idx').on(t.createdAt),
  ],
);

// Define relations for google addresses
export const googleAddressesRelations = relations(googleAddresses, ({ many }) => ({
  properties: many(properties),
}));

// Type definitions for insertion and selection
export type TypeInsertGoogleAddress = typeof googleAddresses.$inferInsert;
export type TypeSelectGoogleAddress = typeof googleAddresses.$inferSelect;
