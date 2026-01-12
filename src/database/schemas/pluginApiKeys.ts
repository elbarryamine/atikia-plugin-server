import { timestamp, pgTable, varchar, uuid, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

// Define table
export const pluginApiKeys = pgTable(
  'plugin_api_keys',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    apiKey: varchar('api_key').notNull().unique(), // Already indexed by unique constraint
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('plugin_api_keys_user_id_idx').on(t.userId), index('plugin_api_keys_api_key_idx').on(t.apiKey)],
);

// Define relations
export const pluginApiKeysRelations = relations(pluginApiKeys, ({ one }) => ({
  user: one(users, {
    fields: [pluginApiKeys.userId],
    references: [users.id],
  }),
}));

// Type definitions
export type TypeInsertPluginApiKey = typeof pluginApiKeys.$inferInsert;
export type TypeSelectPluginApiKey = typeof pluginApiKeys.$inferSelect;
