import { Router } from "express";
import { db } from "@workspace/db";
import { categoriesTable, productsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

// GET /api/categories
router.get("/categories", async (req, res) => {
  try {
    const categories = await db.select().from(categoriesTable).orderBy(categoriesTable.name);
    const counts = await db
      .select({ categoryId: productsTable.categoryId, count: sql<number>`count(*)::int` })
      .from(productsTable)
      .where(eq(productsTable.isActive, true))
      .groupBy(productsTable.categoryId);

    const countMap = new Map(counts.map((c) => [c.categoryId, c.count]));

    res.json(categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      imageUrl: c.imageUrl,
      productCount: countMap.get(c.id) ?? 0,
      createdAt: c.createdAt.toISOString(),
    })));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/categories (admin)
router.post("/categories", async (req, res) => {
  try {
    const { getAuth } = await import("@clerk/express");
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const [category] = await db.insert(categoriesTable).values({
      name: req.body.name,
      slug: req.body.slug,
      imageUrl: req.body.imageUrl ?? null,
    }).returning();

    res.status(201).json({ ...category, productCount: 0, createdAt: category.createdAt.toISOString() });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
