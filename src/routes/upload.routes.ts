import { Router } from "express";
import multer from "multer";
import { apiKeyAuth, AuthenticatedRequest } from "../middleware/apiKeyAuth";
import { StorageService } from "../services/storage.service";

const router = Router();
const storageService = new StorageService();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Apply API key authentication to all routes
router.use(apiKeyAuth);

router.post(
  "/temp",
  upload.single("file"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "No file provided" });
      }

      // Validate file
      storageService.validateFile(file);

      // Upload to temp storage
      const result = await storageService.uploadTempFile(file);

      res.status(200).json(result);
    } catch (error: any) {
      console.error("File upload error:", error);
      res.status(400).json({
        error: error.message || "Failed to upload file",
        success: false,
      });
    }
  }
);

export default router;
