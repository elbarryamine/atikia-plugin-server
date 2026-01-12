import { Request, Response, NextFunction } from "express";
import { db } from "../database";
import { pluginApiKeys } from "../database/schemas/pluginApiKeys";
import { eq } from "drizzle-orm";

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const apiKeyAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract API key from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Missing or invalid Authorization header" });
    }

    const apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Find API key in database
    const apiKeyRecord = await db.query.pluginApiKeys.findFirst({
      where: eq(pluginApiKeys.apiKey, apiKey),
    });

    if (!apiKeyRecord) {
      return res.status(401).json({ error: "Invalid API key" });
    }

    // Attach user ID to request
    req.userId = apiKeyRecord.userId;
    next();
  } catch (error) {
    console.error("API key authentication error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
