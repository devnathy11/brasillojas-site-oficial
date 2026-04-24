import { Router } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { db } from "@workspace/db";
import { ordersTable, cartItemsTable, productsTable, couponsTable, usersTable } from "@workspace/db";
import { eq, desc, inArray } from "drizzle-orm";

const router = Router();

const STATUS_PROGRESSION: Record<string, string | null> = {
  criando: "processando",
  processando: "saiu_para_entrega",
  saiu_para_entrega: null,
  entregue: null,
};

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
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
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

async function requireAdmin(req: any, res: any, userId: string): Promise<boolean> {
  try {
    const user = await clerkClient.users.getUser(userId);

    if (user.publicMetadata?.role === "admin") return true;

    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      const emails = user.emailAddresses.map((e) => e.emailAddress.toLowerCase());
      if (emails.includes(adminEmail.toLowerCase())) return true;
    }

    res.status(403).json({ error: "Admin access required" });
    return false;
  } catch {
    res.status(500).json({ error: "Admin authorization check failed" });
    return false;
  }
}

// GET /api/orders/all (admin)
router.get("/orders/all", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  if (!(await requireAdmin(req, res, userId))) return;

  try {
    const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));

    const uniqueUserIds = [...new Set(orders.map((o) => o.userId))];
    const profiles =
      uniqueUserIds.length > 0
        ? await db
            .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email })
            .from(usersTable)
            .where(inArray(usersTable.id, uniqueUserIds))
        : [];

    const profileMap = new Map(profiles.map((p) => [p.id, p]));

    const result = orders.map((order) => {
      const profile = profileMap.get(order.userId);
      return {
        ...mapOrder(order),
        customerName: profile?.name ?? null,
        customerEmail: profile?.email ?? null,
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/orders/all/:id (admin — single order with customer info)
router.get("/orders/all/:id", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  if (!(await requireAdmin(req, res, userId))) return;

  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid order id" });

    const order = await db.query.ordersTable.findFirst({ where: eq(ordersTable.id, id) });
    if (!order) return res.status(404).json({ error: "Order not found" });

    const profiles = await db
      .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email })
      .from(usersTable)
      .where(eq(usersTable.id, order.userId));

    const profile = profiles[0] ?? null;

    res.json({
      ...mapOrder(order),
      customerName: profile?.name ?? null,
      customerEmail: profile?.email ?? null,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/orders/:id/status (admin only — advances status, cannot set entregue)
router.put("/orders/:id/status", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  if (!(await requireAdmin(req, res, userId))) return;

  try {
    const id = parseInt(req.params.id, 10);
    const order = await db.query.ordersTable.findFirst({ where: eq(ordersTable.id, id) });
    if (!order) return res.status(404).json({ error: "Order not found" });

    const nextStatus = STATUS_PROGRESSION[order.status];
    if (nextStatus === undefined) {
      return res.status(400).json({ error: "Status atual não pode ser avançado pelo admin" });
    }
    if (nextStatus === null) {
      return res.status(400).json({ error: "Pedido já está no status máximo permitido para o admin" });
    }

    const [updated] = await db
      .update(ordersTable)
      .set({ status: nextStatus, updatedAt: new Date() })
      .where(eq(ordersTable.id, id))
      .returning();

    res.json(mapOrder(updated));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/orders/:id/confirm-delivery (customer only)
router.put("/orders/:id/confirm-delivery", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  try {
    const id = parseInt(req.params.id, 10);
    const order = await db.query.ordersTable.findFirst({ where: eq(ordersTable.id, id) });
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.userId !== userId) return res.status(403).json({ error: "Forbidden" });
    if (order.status !== "saiu_para_entrega") {
      return res.status(400).json({ error: "Só é possível confirmar entrega quando o pedido estiver a caminho" });
    }

    const [updated] = await db
      .update(ordersTable)
      .set({ status: "entregue", updatedAt: new Date() })
      .where(eq(ordersTable.id, id))
      .returning();

    res.json(mapOrder(updated));
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
    const { shippingAddress, couponCode, paymentMethod = "pix" } = req.body;

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

    const validMethods = ["pix", "credit_card", "debit_card", "boleto"];
    const method = validMethods.includes(paymentMethod) ? paymentMethod : "pix";
    const paymentStatus =
      method === "credit_card" || method === "debit_card" ? "paid" : "pending";

    const [order] = await db.insert(ordersTable).values({
      userId,
      status: "criando",
      items,
      subtotal: subtotal.toFixed(2),
      discount: discount.toFixed(2),
      total: total.toFixed(2),
      couponCode: couponCodeApplied ?? null,
      shippingAddress,
      paymentMethod: method,
      paymentStatus,
    }).returning();

    await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, userId));

    res.status(201).json(mapOrder(order));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
