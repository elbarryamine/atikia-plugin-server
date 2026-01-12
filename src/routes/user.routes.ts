import { Router } from "express";
import { apiKeyAuth, AuthenticatedRequest } from "../middleware/apiKeyAuth";
import { db } from "../database";
import { users } from "../database/schemas/users";
import { eq } from "drizzle-orm";

const router = Router();

// Apply API key authentication to all routes
router.use(apiKeyAuth);

router.get("/me", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;

    // Get user information
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return basic user information
    res.status(200).json({
      id: user.id,
      contactEmail: user.contactEmail,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      profilePictureUrl: user.profilePictureUrl,
    });
  } catch (error: any) {
    console.error("Get user info error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
