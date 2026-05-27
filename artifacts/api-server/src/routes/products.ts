import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable, categoriesTable, reviewsTable, cartItemsTable } from "@workspace/db";
import { eq, like, ilike, desc, asc, and, sql } from "drizzle-orm";

const router = Router();

function mapProduct(p: typeof productsTable.$inferSelect, category?: typeof categoriesTable.$inferSelect, avgRating?: number, reviewCount?: number) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
    imageUrl: p.imageUrl,
    images: p.images ?? [],
    categoryId: p.categoryId,
    categoryName: category?.name ?? "",
    categorySlug: category?.slug ?? "",
    stock: p.stock,
    brand: p.brand ?? null,
    sku: p.sku ?? null,
    barcode: p.barcode ?? null,
    isFeatured: p.isFeatured,
    isActive: p.isActive,
    maxInstallments: p.maxInstallments ?? 1,
    specifications: p.specifications ?? null,
    rating: avgRating ?? 0,
    reviewCount: reviewCount ?? 0,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

// GET /api/products
router.get("/products", async (req, res) => {
  try {
    const { search, category, sortBy, page = 1, limit = 24 } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, parseInt(limit as string, 10) || 24);
    const offset = (pageNum - 1) * limitNum;

    // showAll=true bypasses the isActive filter — only allowed for authenticated users (admin panel)
    const { getAuth } = await import("@clerk/express");
    const { userId } = getAuth(req);
    const showAll = req.query.showAll === "true" && !!userId;
    const conditions = showAll ? [] : [eq(productsTable.isActive, true)];

    if (search) {
      conditions.push(ilike(productsTable.name, `%${search}%`));
    }

    if (category === "ofertas") {
      conditions.push(sql`${productsTable.originalPrice} IS NOT NULL AND ${productsTable.originalPrice} > ${productsTable.price}`);
    } else if (category === "novidades") {
      // Show recently created products (no DB filter, sort by newest)
    } else if (category) {
      const cat = await db.query.categoriesTable.findFirst({ where: eq(categoriesTable.slug, category) });
      if (cat) conditions.push(eq(productsTable.categoryId, cat.id));
    }

    let orderBy;
    switch (sortBy) {
      case "price_asc": orderBy = asc(productsTable.price); break;
      case "price_desc": orderBy = desc(productsTable.price); break;
      case "newest": orderBy = desc(productsTable.createdAt); break;
      default: orderBy = desc(productsTable.createdAt); break;
    }

    const where = and(...conditions);
    const [products, categories, [{ count }]] = await Promise.all([
      db.select().from(productsTable).where(where).orderBy(orderBy).limit(limitNum).offset(offset),
      db.select().from(categoriesTable),
      db.select({ count: sql<number>`count(*)::int` }).from(productsTable).where(where),
    ]);

    const catMap = new Map(categories.map((c) => [c.id, c]));
    const productIds = products.map((p) => p.id);
    const ratings = productIds.length > 0 ? await db
      .select({
        productId: reviewsTable.productId,
        avg: sql<number>`avg(${reviewsTable.rating})`,
        count: sql<number>`count(*)::int`,
      })
      .from(reviewsTable)
      .where(sql`${reviewsTable.productId} = ANY(ARRAY[${sql.join(productIds.map(id => sql`${id}`), sql`, `)}]::int[])`)
      .groupBy(reviewsTable.productId) : [];

    const ratingMap = new Map(ratings.map((r) => [r.productId, { avg: Number(r.avg), count: r.count }]));

    res.json({
      products: products.map((p) => mapProduct(p, catMap.get(p.categoryId), ratingMap.get(p.id)?.avg ?? 0, ratingMap.get(p.id)?.count ?? 0)),
      total: count,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(count / limitNum),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/products/featured
router.get("/products/featured", async (req, res) => {
  try {
    const products = await db.select().from(productsTable)
      .where(and(eq(productsTable.isFeatured, true), eq(productsTable.isActive, true)))
      .orderBy(desc(productsTable.createdAt))
      .limit(10);

    const categories = await db.select().from(categoriesTable);
    const catMap = new Map(categories.map((c) => [c.id, c]));

    res.json(products.map((p) => mapProduct(p, catMap.get(p.categoryId), 0, 0)));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/products/stats
router.get("/products/stats", async (req, res) => {
  try {
    const [[{ total }], [{ active }], [{ featured }], [{ lowStock }]] = await Promise.all([
      db.select({ total: sql<number>`count(*)::int` }).from(productsTable),
      db.select({ active: sql<number>`count(*)::int` }).from(productsTable).where(eq(productsTable.isActive, true)),
      db.select({ featured: sql<number>`count(*)::int` }).from(productsTable).where(eq(productsTable.isFeatured, true)),
      db.select({ lowStock: sql<number>`count(*)::int` }).from(productsTable).where(sql`${productsTable.stock} < 10 and ${productsTable.isActive} = true`),
    ]);
    res.json({ total, active, featured, lowStock });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/products/:id
router.get("/products/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid product ID" });

    const product = await db.query.productsTable.findFirst({ where: eq(productsTable.id, id) });
    if (!product) return res.status(404).json({ error: "Product not found" });

    const category = await db.query.categoriesTable.findFirst({ where: eq(categoriesTable.id, product.categoryId) });
    const [{ avg, count }] = await db
      .select({ avg: sql<number>`coalesce(avg(${reviewsTable.rating}), 0)`, count: sql<number>`count(*)::int` })
      .from(reviewsTable)
      .where(eq(reviewsTable.productId, id));

    res.json(mapProduct(product, category, Number(avg), count));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/products (admin)
router.post("/products", async (req, res) => {
  try {
    const { getAuth } = await import("@clerk/express");
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const [product] = await db.insert(productsTable).values({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      originalPrice: req.body.originalPrice ?? null,
      imageUrl: req.body.imageUrl,
      images: req.body.images ?? [],
      categoryId: req.body.categoryId,
      stock: req.body.stock ?? 0,
      brand: req.body.brand ?? null,
      sku: req.body.sku ?? null,
      barcode: req.body.barcode ?? null,
      isFeatured: req.body.isFeatured ?? false,
      isActive: req.body.isActive ?? true,
      maxInstallments: req.body.maxInstallments ?? 1,
      specifications: req.body.specifications ?? null,
    }).returning();

    const category = await db.query.categoriesTable.findFirst({ where: eq(categoriesTable.id, product.categoryId) });
    res.status(201).json(mapProduct(product, category, 0, 0));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/products/:id (admin)
router.put("/products/:id", async (req, res) => {
  try {
    const { getAuth } = await import("@clerk/express");
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const id = parseInt(req.params.id, 10);
    const updates: Record<string, unknown> = {};
    const allowed = ["name", "description", "price", "originalPrice", "imageUrl", "images", "categoryId", "stock", "brand", "sku", "barcode", "isFeatured", "isActive", "maxInstallments", "specifications"];
    for (const key of allowed) {
      if (key in req.body) updates[key] = req.body[key];
    }
    updates.updatedAt = new Date();

    const [product] = await db.update(productsTable).set(updates as any).where(eq(productsTable.id, id)).returning();
    if (!product) return res.status(404).json({ error: "Product not found" });

    const category = await db.query.categoriesTable.findFirst({ where: eq(categoriesTable.id, product.categoryId) });
    res.json(mapProduct(product, category, 0, 0));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/products/:id (admin)
router.delete("/products/:id", async (req, res) => {
  try {
    const { getAuth } = await import("@clerk/express");
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const id = parseInt(req.params.id, 10);
    await db.delete(cartItemsTable).where(eq(cartItemsTable.productId, id));
    await db.delete(productsTable).where(eq(productsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
