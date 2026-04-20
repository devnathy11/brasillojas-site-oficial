import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { reviewsTable, ordersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { clerkClient } from "@clerk/express";

const router = Router();

// GET /api/products/:productId/reviews
router.get("/products/:productId/reviews", async (req, res) => {
  try {
    const productId = parseInt(req.params.productId, 10);
    const reviews = await db.select().from(reviewsTable)
      .where(eq(reviewsTable.productId, productId))
      .orderBy(reviewsTable.createdAt);

    res.json(reviews.map((r) => ({
      id: r.id,
      productId: r.productId,
      userId: r.userId,
      userName: r.userName,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    })));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/reviews
router.post("/reviews", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { productId, rating, comment } = req.body;

    let userName = "Usuário";
    try {
      const user = await clerkClient().users.getUser(userId);
      userName = user.fullName ?? user.firstName ?? "Usuário";
    } catch {}

    const [review] = await db.insert(reviewsTable).values({
      productId,
      userId,
      userName,
      rating,
      comment,
    }).returning();

    res.status(201).json({
      id: review.id,
      productId: review.productId,
      userId: review.userId,
      userName: review.userName,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
