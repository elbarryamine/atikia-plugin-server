import { Router } from "express";
import { apiKeyAuth, AuthenticatedRequest } from "../middleware/apiKeyAuth";
import { db } from "../database";
import { properties } from "../database/schemas/properties";
import { googleAddresses } from "../database/schemas/googleAddresses";
import { eq, and } from "drizzle-orm";
import { StorageService } from "../services/storage.service";
import { AZURE_STORAGE_CONTAINERS } from "../constants/storage.constants";

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

        // Validate required fields
        if (!propertyData.latitude || !propertyData.longitude) {
          throw new Error("latitude and longitude are required");
        }

        // Get or create google address
        let googleAddressId: string;
        const latStr = propertyData.latitude.toString();
        const lngStr = propertyData.longitude.toString();

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
          const defaultAddress =
            propertyData.fullAddress ||
            `${propertyData.latitude}, ${propertyData.longitude}`;
          const [newAddress] = await db
            .insert(googleAddresses)
            .values({
              latitude: latStr,
              longitude: lngStr,
              googleAddressJson: {
                address: defaultAddress,
                formattedAddress: defaultAddress,
                placeId: "",
                latitude: propertyData.latitude,
                longitude: propertyData.longitude,
                components: {},
              } as any,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();
          googleAddressId = newAddress.id;
        }

        // Prepare property data with required fields
        const fullAddress =
          propertyData.fullAddress ||
          `${propertyData.latitude}, ${propertyData.longitude}`;
        const compactAddress = propertyData.compactAddress || fullAddress;

        // Handle cover image if coverImageId is provided
        let coverFilename: string | undefined;
        let coverFileUrl: string | undefined;
        let coverContentType: string | undefined;

        if (propertyData.coverImageId) {
          try {
            // Get content type from temp file before moving
            coverContentType = await storageService.getFileContentType(
              propertyData.coverImageId
            );

            // Move file from temp to properties-images container
            const finalCoverFilename = `property-${Date.now()}-cover.jpg`;
            const coverUrl = await storageService.moveFileFromTemp(
              propertyData.coverImageId,
              AZURE_STORAGE_CONTAINERS.PROPERTIES_IMAGES,
              finalCoverFilename
            );

            coverFilename = finalCoverFilename;
            coverFileUrl = coverUrl;
          } catch (error: any) {
            // Log error but don't fail the entire property creation
            console.error(
              `Failed to process cover image for property ${i}:`,
              error.message
            );
            // Continue without cover image - property will be created without it
            // You may want to throw an error here if cover image is required
          }
        }

        // Insert property with user ID
        await db.insert(properties).values({
          ownerId: userId,
          status: "under_review",
          description: propertyData.description,
          type: propertyData.type,
          transactionType: propertyData.transactionType,
          propertyStyle: propertyData.propertyStyle,
          propertyUsage: propertyData.propertyUsage,
          isFurnished: propertyData.isFurnished ?? false,
          finishingQuality: propertyData.finishingQuality,
          sunLightLevel: propertyData.sunLightLevel,
          yearBuilt: propertyData.yearBuilt,
          price: propertyData.price,
          isNegotiable: propertyData.isNegotiable ?? true,
          propertyRentContractMonths: propertyData.propertyRentContractMonths,
          propertyRentDepositMonths: propertyData.propertyRentDepositMonths,
          fullAddress,
          compactAddress,
          googleAddressId,
          latitude: propertyData.latitude,
          longitude: propertyData.longitude,
          floorNumber: propertyData.floorNumber,
          totalFloor: propertyData.totalFloor,
          totalWaterClosets: propertyData.totalWaterClosets,
          totalBathrooms: propertyData.totalBathrooms,
          totalBedrooms: propertyData.totalBedrooms,
          totalSalons: propertyData.totalSalons,
          totalKitchens: propertyData.totalKitchens,
          areaSize: propertyData.areaSize,
          buildingSize: propertyData.buildingSize,
          coverFilename,
          coverFileUrl,
          coverContentType,
          galleryImages: propertyData.galleryImages,
          youtubeVideoUrl: propertyData.youtubeVideoUrl,
          matterPortUrl: propertyData.matterPortUrl,
          floorPlanUrl: propertyData.floorPlanUrl,
          visitDays: propertyData.visitDays,
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
