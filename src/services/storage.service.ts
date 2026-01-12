import { v4 as uuidv4 } from "uuid";
import { BlobServiceClient } from "@azure/storage-blob";
import { config } from "../config/config";
import {
  AZURE_STORAGE_CONTAINERS,
  FILE_VALIDATION,
} from "../constants/storage.constants";

export interface TempFileUploadResult {
  success: boolean;
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  tempUrl: string;
  message: string;
}

export class StorageService {
  private blobServiceClient: BlobServiceClient;

  constructor() {
    if (!config.AZURE_STORAGE_ACCOUNT_CONNECTION_STRING) {
      throw new Error("AZURE_STORAGE_ACCOUNT_CONNECTION_STRING is required");
    }
    this.blobServiceClient = BlobServiceClient.fromConnectionString(
      config.AZURE_STORAGE_ACCOUNT_CONNECTION_STRING
    );
  }

  validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new Error("No file provided");
    }

    // Check file size
    if (file.size > FILE_VALIDATION.MAX_FILE_SIZE) {
      throw new Error(
        `File size exceeds maximum allowed size of ${
          FILE_VALIDATION.MAX_FILE_SIZE / 1024 / 1024
        }MB`
      );
    }

    // Check file type
    if (!FILE_VALIDATION.ALLOWED_MIME_TYPES.includes(file.mimetype as any)) {
      throw new Error(
        `Invalid file type. Allowed types: ${FILE_VALIDATION.ALLOWED_MIME_TYPES.join(
          ", "
        )}`
      );
    }
  }

  async uploadTempFile(
    file: Express.Multer.File
  ): Promise<TempFileUploadResult> {
    // Generate unique filename with original extension
    const fileExtension = file.originalname.split(".").pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;

    // Upload to temp container
    try {
      const containerClient = this.blobServiceClient.getContainerClient(
        AZURE_STORAGE_CONTAINERS.TEMP
      );
      const blockBlobClient =
        containerClient.getBlockBlobClient(uniqueFileName);

      await blockBlobClient.upload(file.buffer, file.buffer.length, {
        blobHTTPHeaders: {
          blobContentType: file.mimetype || "application/octet-stream",
        },
      });
      const fileUrl = blockBlobClient.url;

      return {
        success: true,
        fileId: uniqueFileName,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        tempUrl: fileUrl,
        message: "File uploaded to temporary storage successfully",
      };
    } catch (error: any) {
      throw new Error(`Failed to upload temp file: ${error.message}`);
    }
  }

  async moveFileFromTemp(
    tempFileId: string,
    destinationContainer: (typeof AZURE_STORAGE_CONTAINERS)[keyof typeof AZURE_STORAGE_CONTAINERS],
    destinationFileName?: string
  ): Promise<string> {
    const finalFileName = destinationFileName || tempFileId;

    try {
      const sourceContainerClient = this.blobServiceClient.getContainerClient(
        AZURE_STORAGE_CONTAINERS.TEMP
      );
      const destinationContainerClient =
        this.blobServiceClient.getContainerClient(destinationContainer);

      const sourceBlobClient =
        sourceContainerClient.getBlockBlobClient(tempFileId);
      const destinationBlobClient =
        destinationContainerClient.getBlockBlobClient(finalFileName);

      // Copy the blob to the new location
      await destinationBlobClient.syncCopyFromURL(sourceBlobClient.url);

      // Delete the original blob
      await sourceBlobClient.delete();

      return destinationBlobClient.url;
    } catch (error: any) {
      throw new Error(`Failed to move file from temp: ${error.message}`);
    }
  }

  async getFileContentType(tempFileId: string): Promise<string> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(
        AZURE_STORAGE_CONTAINERS.TEMP
      );
      const blockBlobClient = containerClient.getBlockBlobClient(tempFileId);
      const properties = await blockBlobClient.getProperties();
      return properties.contentType || "image/jpeg";
    } catch (error: any) {
      // Default to jpeg if we can't get the content type
      return "image/jpeg";
    }
  }
}
