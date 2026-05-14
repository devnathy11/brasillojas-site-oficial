import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { reviewsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
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
    req.log.error({ err }, "GET /products/:productId/reviews failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/reviews
router.post("/reviews", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { productId, rating, comment } = req.body;

    if (!productId || !rating) {
      return res.status(422).json({ error: "productId e rating são obrigatórios" });
    }

    // Fetch Clerk user info
    let userName = "Usuário";
    let userEmail = "";
    try {
      const clerkUser = await clerkClient().users.getUser(userId);
      userName = clerkUser.fullName ?? clerkUser.firstName ?? "Usuário";
      userEmail = clerkUser.emailAddresses[0]?.emailAddress ?? "";
    } catch {}

    // Ensure the user exists in our DB (required by FK constraint on reviewsTable)
    const existing = await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });
    if (!existing) {
      await db
        .insert(usersTable)
        .values({
          id: userId,
          name: userName,
          email: userEmail || `${userId}@placeholder.brasillojas`,
          phone: null,
          address: null,
        })
        .onConflictDoUpdate({
          target: usersTable.id,
          set: { updatedAt: new Date() },
        });
    }

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
    req.log.error({ err }, "POST /reviews failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
