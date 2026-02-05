import {
  timestamp,
  pgTable,
  uuid,
  varchar,
  integer,
  pgEnum,
  boolean,
  doublePrecision,
  index,
  json,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { googleAddresses } from "./googleAddresses";

// Enums
export const publishStatusEnum = pgEnum("publish_status_enum", [
  "under_review",
  "pause",
  "rejected",
  "published",
]);
export const propertyTypeEnum = pgEnum("property_type_enum", [
  "apartment",
  "house",
  "villa",
  "office",
  "riads",
  "garage",
  "studio",
  "duplex",
]);
export const transactionTypeEnum = pgEnum("transaction_type_enum", [
  "for_rent",
  "for_sale",
]);
export const propertyStyleEnum = pgEnum("property_style_enum", [
  "modern",
  "traditional",
]);
export const propertyUsageEnum = pgEnum("property_usage_enum", [
  "residential",
  "commercial",
]);
export const finishingQualityEnum = pgEnum("finishing_quality_enum", [
  "economic",
  "medium",
  "high",
]);
export const sunLightLevelEnum = pgEnum("sun_light_level_enum", [
  "weak",
  "medium",
  "high",
]);
export const weekDayEnum = pgEnum("week_day_enum", [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

// Define main properties table
export const properties = pgTable(
  "properties",
  {
    // ids and relationships
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    ownerId: uuid("owner_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    unitId: uuid("unit_id"), // Optional - a property can belong to a unit or not

    // Status and deletion
    status: publishStatusEnum("status").default("under_review").notNull(),
    isDeleted: boolean("is_deleted").default(false).notNull(),

    // Basic required property info
    title: varchar("title"),
    slug: varchar("slug"),
    description: varchar("description").notNull(),
    type: propertyTypeEnum("type").notNull(),
    transactionType: transactionTypeEnum("transaction_type").notNull(),
    propertyStyle: propertyStyleEnum("property_style").notNull(),
    propertyUsage: propertyUsageEnum("property_usage").notNull(),
    isFurnished: boolean("is_furnished").notNull().default(false),
    finishingQuality: finishingQualityEnum("finishing_quality").notNull(),
    sunLightLevel: sunLightLevelEnum("sun_light_level").notNull(),
    yearBuilt: integer("year_built").notNull(),

    // Pricing Related Fields
    price: integer("price").notNull(),
    isNegotiable: boolean("is_negotiable").default(true).notNull(),

    // Rent-specific fields
    propertyRentContractMonths: integer("property_rent_contract_months"),
    propertyRentDepositMonths: integer("property_rent_deposit_months"),

    // Property address and location fields
    fullAddress: varchar("full_address").notNull(),
    compactAddress: varchar("compact_address").notNull(),
    googleAddressId: uuid("google_address_id")
      .references(() => googleAddresses.id, { onDelete: "set null" })
      .notNull(),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),

    // Property floors, sizes and rooms details
    floorNumber: integer("floor_number"),
    totalFloor: integer("total_floor"),
    totalWaterClosets: integer("total_water_closets"),
    totalBathrooms: integer("total_bathrooms"),
    totalBedrooms: integer("total_bedrooms"),
    totalSalons: integer("total_salons"),
    totalKitchens: integer("total_kitchens"),
    areaSize: integer("area_size"),
    buildingSize: integer("building_size"),

    // Images (File names + URLs + content types for performance) (Media Fields)
    coverFilename: varchar("cover_filename"),
    coverFileUrl: varchar("cover_file_url"),
    coverContentType: varchar("cover_content_type"),
    galleryImages: json("gallery_images").$type<
      Array<{
        filename: string;
        url: string;
        contentType: string;
      }>
    >(),
    youtubeVideoUrl: varchar("youtube_video_url"),
    matterPortUrl: varchar("matter_port_url"),
    floorPlanUrl: varchar("floor_plan_url"),

    // property bookings visit days
    visitDays: weekDayEnum("visit_days").array(),

    // dates
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("properties_owner_id_idx").on(t.ownerId),
    index("properties_status_idx").on(t.status),
    index("properties_is_deleted_idx").on(t.isDeleted),
    index("properties_type_idx").on(t.type),
    index("properties_transaction_type_idx").on(t.transactionType),
    index("properties_price_idx").on(t.price),
    index("properties_area_size_idx").on(t.areaSize),
    index("properties_google_address_id_idx").on(t.googleAddressId),
    index("properties_latitude_longitude_idx").on(t.latitude, t.longitude),
    index("properties_total_bedrooms_idx").on(t.totalBedrooms),
    index("properties_total_bathrooms_idx").on(t.totalBathrooms),
    index("properties_created_at_idx").on(t.createdAt),
    index("properties_slug_idx").on(t.slug),
  ]
);

// Define relations for the properties table
export const propertiesRelations = relations(properties, ({ one }) => ({
  owner: one(users, { fields: [properties.ownerId], references: [users.id] }),
  googleAddress: one(googleAddresses, {
    fields: [properties.googleAddressId],
    references: [googleAddresses.id],
  }),
}));

// Type definitions for insertion and selection
export type TypeInsertProperty = typeof properties.$inferInsert;
export type TypeSelectProperty = typeof properties.$inferSelect;
