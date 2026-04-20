import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { productsTable, ordersTable, usersTable, couponsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

// GET /api/admin/dashboard
router.get("/admin/dashboard", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const [[products], [orders], [users], [revenue], [coupons]] = await Promise.all([
      db.select({ total: sql<number>`count(*)::int`, active: sql<number>`sum(case when ${productsTable.isActive} then 1 else 0 end)::int`, lowStock: sql<number>`sum(case when ${productsTable.stock} < 10 and ${productsTable.isActive} then 1 else 0 end)::int` }).from(productsTable),
      db.select({ total: sql<number>`count(*)::int`, pending: sql<number>`sum(case when ${ordersTable.status} = 'pending' then 1 else 0 end)::int`, delivered: sql<number>`sum(case when ${ordersTable.status} = 'delivered' then 1 else 0 end)::int` }).from(ordersTable),
      db.select({ total: sql<number>`count(*)::int` }).from(usersTable),
      db.select({ total: sql<number>`coalesce(sum(${ordersTable.total}), 0)` }).from(ordersTable),
      db.select({ total: sql<number>`count(*)::int`, active: sql<number>`sum(case when ${couponsTable.isActive} then 1 else 0 end)::int` }).from(couponsTable),
    ]);

    res.json({
      products: { total: products.total, active: products.active, lowStock: products.lowStock },
      orders: { total: orders.total, pending: orders.pending, delivered: orders.delivered },
      users: { total: users.total },
      revenue: { total: Number(revenue.total) },
      coupons: { total: coupons.total, active: coupons.active },
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
