import { Router } from "express";
import { apiKeyAuth, AuthenticatedRequest } from "../middleware/apiKeyAuth";
import { db } from "../database";
import { properties } from "../database/schemas/properties";
import { googleAddresses } from "../database/schemas/googleAddresses";
import { eq, and } from "drizzle-orm";
import { StorageService } from "../services/storage.service";
import { AZURE_STORAGE_CONTAINERS } from "../constants/storage.constants";
import { createPropertySchema } from "../validation/createPropertySchema";
import slugify from "slugify";

const router = Router();
const storageService = new StorageService();

// Apply API key authentication to all routes
router.use(apiKeyAuth);

router.post("/bulk", async (req: AuthenticatedRequest, res) => {
  try {
    const { properties: propertiesData } = req.body;
    const userId = req.userId!;

    if (!Array.isArray(propertiesData)) {
      return res.status(400).json({ error: "properties must be an array" });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ index: number; error: string }>,
    };

    // Process each property
    for (let i = 0; i < propertiesData.length; i++) {
      try {
        const propertyData = propertiesData[i];

        const parsed = createPropertySchema.safeParse(propertyData);
        if (!parsed.success) {
          const msg = parsed.error.issues
            .map((iss) => {
              const path = iss.path.length ? iss.path.join(".") : "property";
              return `${path}: ${iss.message}`;
            })
            .join("; ");
          throw new Error(msg);
        }

        const input = parsed.data;

        // Validate required fields
        // Note: latitude/longitude are already validated by schema.

        // Get or create google address
        let googleAddressId: string;
        const latStr = input.latitude.toString();
        const lngStr = input.longitude.toString();

        const existingAddress = await db.query.googleAddresses.findFirst({
          where: and(
            eq(googleAddresses.latitude, latStr),
            eq(googleAddresses.longitude, lngStr)
          ),
        });

        if (existingAddress) {
          googleAddressId = existingAddress.id;
        } else {
          // Create minimal google address entry
          const defaultAddress = `${input.latitude}, ${input.longitude}`;
          const [newAddress] = await db
            .insert(googleAddresses)
            .values({
              latitude: latStr,
              longitude: lngStr,
              googleAddressJson: {
                address: defaultAddress,
                formattedAddress: defaultAddress,
                placeId: "",
                latitude: input.latitude,
                longitude: input.longitude,
                components: {},
              } as any,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();
          googleAddressId = newAddress.id;
        }

        // Prepare property data with required fields
        const fullAddress = `${input.latitude}, ${input.longitude}`;
        const compactAddress = fullAddress;

        // Handle cover image if coverImageId is provided
        let coverFilename: string | undefined;
        let coverFileUrl: string | undefined;
        let coverContentType: string | undefined;

        // coverImageId is required by the schema
        coverContentType = await storageService.getFileContentType(
          input.coverImageId
        );
        const finalCoverFilename = `property-${Date.now()}-cover.jpg`;
        const coverUrl = await storageService.moveFileFromTemp(
          input.coverImageId,
          AZURE_STORAGE_CONTAINERS.PROPERTIES_IMAGES,
          finalCoverFilename
        );
        coverFilename = finalCoverFilename;
        coverFileUrl = coverUrl;

        // Gallery images (optional)
        let galleryImages:
          | Array<{ filename: string; url: string; contentType: string }>
          | undefined;
        if (input.galleryImageIds && input.galleryImageIds.length > 0) {
          galleryImages = [];
          for (let g = 0; g < input.galleryImageIds.length; g++) {
            const id = input.galleryImageIds[g];
            const contentType = await storageService.getFileContentType(id);
            const finalGalleryFilename = `property-${Date.now()}-gallery-${g}.jpg`;
            const url = await storageService.moveFileFromTemp(
              id,
              AZURE_STORAGE_CONTAINERS.PROPERTIES_IMAGES,
              finalGalleryFilename
            );
            galleryImages.push({
              filename: finalGalleryFilename,
              url,
              contentType,
            });
          }
        }

        // Generate slug from title (or null if no title)
        const slug = input.title
          ? slugify(input.title, { lower: true, strict: true }) +
            "-" +
            Date.now()
          : null;

        // Insert property with user ID
        await db.insert(properties).values({
          ownerId: userId,
          status: "under_review",
          title: input.title || null,
          slug,
          description: input.description,
          type: input.type,
          transactionType: input.transactionType,
          propertyStyle: input.propertyStyle,
          propertyUsage: input.propertyUsage,
          isFurnished: input.isFurnished,
          finishingQuality: input.finishingQuality,
          sunLightLevel: input.sunLightLevel,
          yearBuilt: input.yearBuilt,
          price: input.price,
          isNegotiable: input.isNegotiable ?? true,
          propertyRentContractMonths: input.propertyRentContractMonths,
          propertyRentDepositMonths: input.propertyRentDepositMonths,
          fullAddress,
          compactAddress,
          googleAddressId,
          latitude: input.latitude,
          longitude: input.longitude,
          floorNumber: input.floorNumber,
          totalFloor: input.totalFloor,
          totalWaterClosets: input.totalWaterClosets,
          totalBathrooms: input.totalBathrooms,
          totalBedrooms: input.totalBedrooms,
          totalSalons: input.totalSalons,
          totalKitchens: input.totalKitchens,
          areaSize: input.areaSize,
          buildingSize: input.buildingSize,
          coverFilename,
          coverFileUrl,
          coverContentType,
          galleryImages,
          youtubeVideoUrl: input.youtubeVideoUrl,
          matterPortUrl: input.matterPortUrl,
          // floorPlanUrl is not in main backend schema; ignored here.
          visitDays: input.visitDays,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          index: i,
          error: error.message || "Unknown error",
        });
      }
    }

    res.status(200).json(results);
  } catch (error: any) {
    console.error("Bulk property submission error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
