import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { couponsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function mapCoupon(c: typeof couponsTable.$inferSelect) {
  return {
    id: c.id,
    code: c.code,
    discountType: c.discountType,
    discountValue: Number(c.discountValue),
    minOrderAmount: c.minOrderAmount ? Number(c.minOrderAmount) : null,
    maxUses: c.maxUses,
    usedCount: c.usedCount,
    expiresAt: c.expiresAt?.toISOString() ?? null,
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString(),
  };
}

// GET /api/coupons (admin)
router.get("/coupons", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const coupons = await db.select().from(couponsTable).orderBy(couponsTable.createdAt);
    res.json(coupons.map(mapCoupon));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/coupons/validate/:code
router.get("/coupons/validate/:code", async (req, res) => {
  try {
    const coupon = await db.query.couponsTable.findFirst({ where: eq(couponsTable.code, req.params.code.toUpperCase()) });
    if (!coupon || !coupon.isActive) {
      return res.json({ valid: false, message: "Cupom inválido ou inativo" });
    }
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return res.json({ valid: false, message: "Cupom expirado" });
    }
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return res.json({ valid: false, message: "Cupom esgotado" });
    }
    res.json({ valid: true, coupon: mapCoupon(coupon) });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/coupons (admin)
router.post("/coupons", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const [coupon] = await db.insert(couponsTable).values({
      code: req.body.code.toUpperCase(),
      discountType: req.body.discountType,
      discountValue: req.body.discountValue,
      minOrderAmount: req.body.minOrderAmount ?? null,
      maxUses: req.body.maxUses ?? null,
      expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : null,
      isActive: req.body.isActive ?? true,
    }).returning();

    res.status(201).json(mapCoupon(coupon));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/coupons/:id (admin)
router.put("/coupons/:id", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const id = parseInt(req.params.id, 10);
    const [coupon] = await db.update(couponsTable).set({
      code: req.body.code?.toUpperCase(),
      discountType: req.body.discountType,
      discountValue: req.body.discountValue,
      minOrderAmount: req.body.minOrderAmount ?? null,
      maxUses: req.body.maxUses ?? null,
      expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : null,
      isActive: req.body.isActive,
    }).where(eq(couponsTable.id, id)).returning();
    if (!coupon) return res.status(404).json({ error: "Coupon not found" });
    res.json(mapCoupon(coupon));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/coupons/:id (admin)
router.delete("/coupons/:id", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const id = parseInt(req.params.id, 10);
    await db.delete(couponsTable).where(eq(couponsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
