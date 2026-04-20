import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { ordersTable, cartItemsTable, productsTable, couponsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

function requireAuth(req: any, res: any): string | null {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return userId;
}

function mapOrder(order: typeof ordersTable.$inferSelect) {
  return {
    id: order.id,
    userId: order.userId,
    status: order.status,
    items: order.items,
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    total: Number(order.total),
    couponCode: order.couponCode,
    shippingAddress: order.shippingAddress,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

// GET /api/orders
router.get("/orders", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  try {
    const orders = await db.select().from(ordersTable)
      .where(eq(ordersTable.userId, userId))
      .orderBy(desc(ordersTable.createdAt));
    res.json(orders.map(mapOrder));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/orders/all (admin)
router.get("/orders/all", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  try {
    const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
    res.json(orders.map(mapOrder));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/orders/:id
router.get("/orders/:id", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  try {
    const id = parseInt(req.params.id, 10);
    const order = await db.query.ordersTable.findFirst({ where: eq(ordersTable.id, id) });
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.userId !== userId) return res.status(403).json({ error: "Forbidden" });
    res.json(mapOrder(order));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/orders
router.post("/orders", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  try {
    const { shippingAddress, couponCode } = req.body;

    // Get cart items
    const cartItems = await db
      .select({ cartItem: cartItemsTable, product: productsTable })
      .from(cartItemsTable)
      .innerJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
      .where(eq(cartItemsTable.userId, userId));

    if (!cartItems.length) return res.status(400).json({ error: "Cart is empty" });

    const items = cartItems.map(({ cartItem, product }) => ({
      productId: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      price: Number(product.price),
      quantity: cartItem.quantity,
    }));

    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

    let discount = 0;
    let couponCodeApplied: string | undefined;

    if (couponCode) {
      const coupon = await db.query.couponsTable.findFirst({ where: eq(couponsTable.code, couponCode) });
      if (coupon && coupon.isActive) {
        if (coupon.discountType === "percentage") {
          discount = subtotal * (Number(coupon.discountValue) / 100);
        } else {
          discount = Number(coupon.discountValue);
        }
        couponCodeApplied = coupon.code;
        await db.update(couponsTable).set({ usedCount: coupon.usedCount + 1 }).where(eq(couponsTable.id, coupon.id));
      }
    }

    const total = Math.max(0, subtotal - discount);

    const [order] = await db.insert(ordersTable).values({
      userId,
      status: "pending",
      items,
      subtotal: subtotal.toFixed(2),
      discount: discount.toFixed(2),
      total: total.toFixed(2),
      couponCode: couponCodeApplied ?? null,
      shippingAddress,
    }).returning();

    // Clear cart
    await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, userId));

    res.status(201).json(mapOrder(order));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
