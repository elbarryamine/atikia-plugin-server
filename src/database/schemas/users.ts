import { timestamp, pgTable, varchar, uuid, pgEnum, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRole = pgEnum('role', ['particular', 'agent', 'admin']);

// Define table
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    // auth fields
    auth0Id: varchar('auth0_id').notNull().unique(), // Already indexed by unique constraint
    role: userRole('role').notNull().default('particular'),
    // info fields
    contactEmail: varchar('contact_email').notNull(),
    firstName: varchar('first_name'),
    lastName: varchar('last_name'),
    phoneNumber: varchar('phone_number'),
    communicationMethods: varchar('communication_methods').array(),
    profilePictureUrl: varchar('profile_picture_url'),

    // timestamps fields
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [index('users_role_idx').on(t.role), index('users_contact_email_idx').on(t.contactEmail)],
);

// Define relations for the table (properties relation defined in properties.ts to avoid circular dependency)
export const userRelations = relations(users, () => ({}));

// Type definitions for insertion and selection
export type TypeInsertUser = typeof users.$inferInsert;
export type TypeSelectUser = typeof users.$inferSelect;
