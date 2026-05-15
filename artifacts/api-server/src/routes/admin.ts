import { Router } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { db } from "@workspace/db";
import { productsTable, ordersTable, usersTable, couponsTable, cartItemsTable } from "@workspace/db";
import { sql, desc } from "drizzle-orm";

const router = Router();

// GET /api/admin/dashboard
router.get("/admin/dashboard", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const [[products], [orders], [users], [revenue], [revenueToday], [revenueWeek], [coupons], recentOrders, salesByDay] = await Promise.all([
      db.select({ total: sql<number>`count(*)::int`, active: sql<number>`sum(case when ${productsTable.isActive} then 1 else 0 end)::int`, lowStock: sql<number>`sum(case when ${productsTable.stock} < 10 and ${productsTable.isActive} then 1 else 0 end)::int` }).from(productsTable),
      db.select({ total: sql<number>`count(*)::int`, pending: sql<number>`sum(case when ${ordersTable.status} = 'pending' then 1 else 0 end)::int`, delivered: sql<number>`sum(case when ${ordersTable.status} = 'delivered' then 1 else 0 end)::int` }).from(ordersTable),
      db.select({ total: sql<number>`count(*)::int` }).from(usersTable),
      db.select({ total: sql<number>`coalesce(sum(${ordersTable.total}), 0)` }).from(ordersTable),
      db.select({ total: sql<number>`coalesce(sum(${ordersTable.total}), 0)` }).from(ordersTable).where(sql`${ordersTable.createdAt} >= now() - interval '1 day'`),
      db.select({ total: sql<number>`coalesce(sum(${ordersTable.total}), 0)` }).from(ordersTable).where(sql`${ordersTable.createdAt} >= now() - interval '7 days'`),
      db.select({ total: sql<number>`count(*)::int`, active: sql<number>`sum(case when ${couponsTable.isActive} then 1 else 0 end)::int` }).from(couponsTable),
      db.select({ id: ordersTable.id, status: ordersTable.status, total: ordersTable.total, paymentMethod: ordersTable.paymentMethod, paymentStatus: ordersTable.paymentStatus, createdAt: ordersTable.createdAt, items: ordersTable.items }).from(ordersTable).orderBy(desc(ordersTable.createdAt)).limit(8),
      db.execute<{ day: string; total: string; orders: string }>(sql`
        SELECT to_char(date_trunc('day', created_at), 'DD/MM') AS day,
               coalesce(sum(total), 0)::text AS total,
               count(*)::text AS orders
        FROM orders
        WHERE created_at >= now() - interval '7 days'
        GROUP BY date_trunc('day', created_at)
        ORDER BY date_trunc('day', created_at) ASC
      `),
    ]);

    res.json({
      products: { total: products.total, active: products.active, lowStock: products.lowStock },
      orders: { total: orders.total, pending: orders.pending, delivered: orders.delivered },
      users: { total: users.total },
      revenue: { total: Number(revenue.total), today: Number(revenueToday.total), week: Number(revenueWeek.total) },
      coupons: { total: coupons.total, active: coupons.active },
      recentOrders: recentOrders.map((o: any) => ({
        id: o.id,
        status: o.status,
        total: Number(o.total),
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        createdAt: o.createdAt.toISOString(),
        itemCount: Array.isArray(o.items) ? o.items.length : 0,
      })),
      salesByDay: (salesByDay.rows ?? salesByDay).map((r: any) => ({
        day: r.day,
        total: Number(r.total),
        orders: Number(r.orders),
      })),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/admin/reset-data — wipes all orders and cart items for testing
router.delete("/admin/reset-data", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    await db.delete(cartItemsTable);
    await db.delete(ordersTable);

    res.json({ message: "Dados zerados com sucesso. Pedidos e carrinhos removidos." });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
