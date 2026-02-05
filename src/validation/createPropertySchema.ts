import { z } from "zod";

// Enum schemas (match main backend)
const propertyTypeEnum = z.enum([
  "apartment",
  "house",
  "villa",
  "office",
  "riads",
  "garage",
  "studio",
  "duplex",
]);
const transactionTypeEnum = z.enum(["for_rent", "for_sale"]);
const propertyStyleEnum = z.enum(["modern", "traditional"]);
const propertyUsageEnum = z.enum(["residential", "commercial"]);
const finishingQualityEnum = z.enum(["economic", "medium", "high"]);
const sunLightLevelEnum = z.enum(["weak", "medium", "high"]);
const weekDayEnum = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

export const createPropertySchema = z
  .object({
    // Basic required property info
    title: z.string().min(1).optional(),
    description: z
      .string()
      .min(10, { message: "Description must be at least 10 characters" }),
    type: propertyTypeEnum,
    transactionType: transactionTypeEnum,
    propertyStyle: propertyStyleEnum,
    propertyUsage: propertyUsageEnum,
    isFurnished: z.boolean(),
    finishingQuality: finishingQualityEnum,
    sunLightLevel: sunLightLevelEnum,
    yearBuilt: z
      .number()
      .min(1800, { message: "Year built must be a valid year" }),

    // Pricing
    price: z.number().min(1, { message: "Price must be greater than 0" }),
    isNegotiable: z.boolean().default(true),

    // Rent-specific fields
    propertyRentContractMonths: z.number().optional(),
    propertyRentDepositMonths: z.number().optional(),

    // Location
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),

    // Property details
    floorNumber: z.number().min(0).optional(),
    totalFloor: z.number().min(1).optional(),
    totalWaterClosets: z.number().min(0).optional(),
    totalBathrooms: z.number().min(0).optional(),
    totalBedrooms: z.number().min(0).optional(),
    totalSalons: z.number().min(0).optional(),
    totalKitchens: z.number().min(0).optional(),
    areaSize: z
      .number()
      .min(1, { message: "Area size must be provided" })
      .optional(),
    buildingSize: z
      .number()
      .min(1, { message: "Building size must be provided" })
      .optional(),

    // Media
    youtubeVideoUrl: z.string().url().optional(),
    matterPortUrl: z.string().url().optional(),

    // Images
    coverImageId: z.string().min(1),
    galleryImageIds: z.array(z.string()).optional(),

    // Visit days
    visitDays: z.array(weekDayEnum),

    // Amenities
    amenityIds: z.array(z.string().uuid()).optional(),
  })
  .superRefine((data, ctx) => {
    // Property usage validation
    if (data.propertyUsage === "residential") {
      const allowedTypes = [
        "apartment",
        "house",
        "riads",
        "villa",
        "studio",
        "duplex",
      ];
      if (!allowedTypes.includes(data.type)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "When propertyUsage is residential, only apartment, house, riads, villa, studio, and duplex are allowed",
          path: ["type"],
        });
      }
    }

    // Rent fields validation
    if (data.transactionType === "for_rent") {
      if (data.propertyRentContractMonths === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "propertyRentContractMonths is required when transactionType is for_rent",
          path: ["propertyRentContractMonths"],
        });
      }
      if (data.propertyRentDepositMonths === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "propertyRentDepositMonths is required when transactionType is for_rent",
          path: ["propertyRentDepositMonths"],
        });
      }
    }

    // Type-specific requirements
    if (data.type === "apartment") {
      if (data.floorNumber === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "floorNumber is required for apartment",
          path: ["floorNumber"],
        });
      }
      if (data.totalBedrooms === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "totalBedrooms is required for apartment",
          path: ["totalBedrooms"],
        });
      }
      if (data.totalBathrooms === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "totalBathrooms is required for apartment",
          path: ["totalBathrooms"],
        });
      }
      if (data.totalSalons === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "totalSalons is required for apartment",
          path: ["totalSalons"],
        });
      }
      if (data.totalKitchens === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "totalKitchens is required for apartment",
          path: ["totalKitchens"],
        });
      }
      if (data.buildingSize === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "buildingSize is required for apartment",
          path: ["buildingSize"],
        });
      }
    } else if (data.type === "studio") {
      if (data.floorNumber === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "floorNumber is required for studio",
          path: ["floorNumber"],
        });
      }
      if (data.totalBedrooms === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "totalBedrooms is required for studio",
          path: ["totalBedrooms"],
        });
      }
      if (data.totalBathrooms === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "totalBathrooms is required for studio",
          path: ["totalBathrooms"],
        });
      }
      if (data.totalSalons === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "totalSalons is required for studio",
          path: ["totalSalons"],
        });
      }
      if (data.totalKitchens === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "totalKitchens is required for studio",
          path: ["totalKitchens"],
        });
      }
      if (data.buildingSize === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "buildingSize is required for studio",
          path: ["buildingSize"],
        });
      }
    } else if (data.type === "duplex") {
      if (data.floorNumber === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "floorNumber is required for duplex",
          path: ["floorNumber"],
        });
      }
      if (data.totalBedrooms === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "totalBedrooms is required for duplex",
          path: ["totalBedrooms"],
        });
      }
      if (data.totalBathrooms === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "totalBathrooms is required for duplex",
          path: ["totalBathrooms"],
        });
      }
      if (data.totalSalons === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "totalSalons is required for duplex",
          path: ["totalSalons"],
        });
      }
      if (data.totalKitchens === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "totalKitchens is required for duplex",
          path: ["totalKitchens"],
        });
      }
      if (data.buildingSize === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "buildingSize is required for duplex",
          path: ["buildingSize"],
        });
      }
    } else if (["house", "riads", "villa"].includes(data.type)) {
      if (data.totalFloor === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "totalFloor is required for house/riad/villa",
          path: ["totalFloor"],
        });
      }
      if (data.totalBedrooms === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "totalBedrooms is required for house/riad/villa",
          path: ["totalBedrooms"],
        });
      }
      if (data.totalBathrooms === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "totalBathrooms is required for house/riad/villa",
          path: ["totalBathrooms"],
        });
      }
      if (data.totalSalons === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "totalSalons is required for house/riad/villa",
          path: ["totalSalons"],
        });
      }
      if (data.totalKitchens === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "totalKitchens is required for house/riad/villa",
          path: ["totalKitchens"],
        });
      }
    } else if (data.type === "office") {
      if (data.floorNumber === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "floorNumber is required for office",
          path: ["floorNumber"],
        });
      }
      if (data.totalKitchens === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "totalKitchens is required for office",
          path: ["totalKitchens"],
        });
      }
      if (data.totalWaterClosets === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "totalWaterClosets is required for office",
          path: ["totalWaterClosets"],
        });
      }
    } else if (data.type === "garage") {
      if (data.totalFloor === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "totalFloor is required for garage",
          path: ["totalFloor"],
        });
      }
      if (data.totalWaterClosets === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "totalWaterClosets is required for garage",
          path: ["totalWaterClosets"],
        });
      }
    }
  })
  .transform((data) => {
    const transformed: any = { ...data };

    // Remove rent fields when transactionType is for_sale
    if (data.transactionType === "for_sale") {
      delete transformed.propertyRentContractMonths;
      delete transformed.propertyRentDepositMonths;
    }

    // Type-specific transformations
    if (data.type === "apartment") {
      if (data.buildingSize !== undefined) {
        transformed.areaSize = data.buildingSize;
      }
      if (data.totalFloor === undefined) {
        transformed.totalFloor = 1;
      }
    } else if (data.type === "studio") {
      if (data.buildingSize !== undefined) {
        transformed.areaSize = data.buildingSize;
      }
      transformed.totalFloor = 1;
    } else if (data.type === "duplex") {
      if (data.buildingSize !== undefined) {
        transformed.areaSize = data.buildingSize;
      }
      transformed.totalFloor = 2;
    } else if (["house", "riads", "villa"].includes(data.type)) {
      if (data.floorNumber !== undefined) {
        delete transformed.floorNumber;
      }
    } else if (data.type === "office") {
      if (data.totalBedrooms !== undefined) delete transformed.totalBedrooms;
      if (data.totalBathrooms !== undefined) delete transformed.totalBathrooms;
      if (data.totalSalons !== undefined) delete transformed.totalSalons;
    } else if (data.type === "garage") {
      if (data.floorNumber !== undefined) delete transformed.floorNumber;
      if (data.totalBedrooms !== undefined) delete transformed.totalBedrooms;
      if (data.totalBathrooms !== undefined) delete transformed.totalBathrooms;
      if (data.totalSalons !== undefined) delete transformed.totalSalons;
      if (data.totalKitchens !== undefined) delete transformed.totalKitchens;
    }

    return transformed;
  });

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
