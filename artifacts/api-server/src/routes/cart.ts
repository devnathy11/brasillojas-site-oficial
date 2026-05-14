import { Router, type Request, type Response } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { cartItemsTable, productsTable, categoriesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

function requireAuth(req: Request, res: Response): string | null {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return userId;
}

// GET /api/cart
router.get("/cart", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  try {
    const items = await db
      .select({ cartItem: cartItemsTable, product: productsTable, category: categoriesTable })
      .from(cartItemsTable)
      .innerJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .where(eq(cartItemsTable.userId, userId));

    const cartItems = items.map(({ cartItem, product, category }) => ({
      productId: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      price: Number(product.price),
      originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
      quantity: cartItem.quantity,
      stock: product.stock,
      barcode: product.barcode ?? null,
      sku: product.sku ?? null,
      categorySlug: category?.slug ?? "",
      categoryName: category?.name ?? "",
    }));

    const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    res.json({ items: cartItems, subtotal, discount: 0, total: subtotal });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

async function handleAddToCart(userId: string, productId: number, quantity: number, res: Response) {
  const product = await db.query.productsTable.findFirst({ where: eq(productsTable.id, productId) });
  if (!product) return res.status(404).json({ error: "Product not found" });
  if (product.stock < quantity) return res.status(400).json({ error: "Insufficient stock" });

  const existing = await db.query.cartItemsTable.findFirst({
    where: and(eq(cartItemsTable.userId, userId), eq(cartItemsTable.productId, productId)),
  });

  if (existing) {
    await db.update(cartItemsTable)
      .set({ quantity: existing.quantity + quantity })
      .where(eq(cartItemsTable.id, existing.id));
  } else {
    await db.insert(cartItemsTable).values({ userId, productId, quantity });
  }

  res.json({ success: true });
}

// POST /api/cart — matches generated API client (addToCart)
router.post("/cart", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  try {
    const { productId, quantity = 1 } = req.body;
    await handleAddToCart(userId, productId, quantity, res);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/cart/items — legacy alias kept for backward compatibility
router.post("/cart/items", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  try {
    const { productId, quantity = 1 } = req.body;
    await handleAddToCart(userId, productId, quantity, res);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/cart/items/:productId
router.put("/cart/items/:productId", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  try {
    const productId = parseInt(req.params.productId, 10);
    const { quantity } = req.body;

    await db.update(cartItemsTable)
      .set({ quantity })
      .where(and(eq(cartItemsTable.userId, userId), eq(cartItemsTable.productId, productId)));

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/cart/items/:productId
router.delete("/cart/items/:productId", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  try {
    const productId = parseInt(req.params.productId, 10);
    await db.delete(cartItemsTable)
      .where(and(eq(cartItemsTable.userId, userId), eq(cartItemsTable.productId, productId)));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/cart/:productId — alias used by generated API client
router.delete("/cart/:productId", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  try {
    const productId = parseInt(req.params.productId, 10);
    if (isNaN(productId)) return res.status(400).json({ error: "Invalid product ID" });
    await db.delete(cartItemsTable)
      .where(and(eq(cartItemsTable.userId, userId), eq(cartItemsTable.productId, productId)));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/cart
router.delete("/cart", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  try {
    await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, userId));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
