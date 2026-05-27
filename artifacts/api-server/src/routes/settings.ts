import { Router, Request, Response } from "express"; // Tipagens do Express adicionadas
import { getAuth, clerkClient } from "@clerk/express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const PIX_DISCOUNT_KEY = "pix_discount_percent";

async function ensurePixDiscountDefault() {
  const existing = await db.query.settingsTable.findFirst({
    where: eq(settingsTable.key, PIX_DISCOUNT_KEY),
  });
  if (!existing) {
    await db
      .insert(settingsTable)
      .values({ key: PIX_DISCOUNT_KEY, value: "5" });
  }
}

// GET /api/settings/pix-discount — public
router.get("/settings/pix-discount", async (req: Request, res: Response) => {
  try {
    await ensurePixDiscountDefault();
    const row = await db.query.settingsTable.findFirst({
      where: eq(settingsTable.key, PIX_DISCOUNT_KEY),
    });

    // Usando coalescência nula para garantir que o 0 passe direto e não vire 5
    const percent =
      row?.value !== undefined && row?.value !== null ? Number(row.value) : 5;
    res.json({ percent });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Mirror the same pattern as orders.ts requireAdmin:
// if ADMIN_EMAIL is not set, any authenticated user is treated as admin (fail-open).
// if ADMIN_EMAIL is set, only that email or Clerk-role=admin may proceed.
async function requireAdmin(
  req: any,
  res: any,
  userId: string,
): Promise<boolean> {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) return true;

    const user = await clerkClient.users.getUser(userId);
    if (user.publicMetadata?.role === "admin") return true;

    const emails = user.emailAddresses.map((e) =>
      e.emailAddress.toLowerCase(),
    );
    if (emails.includes(adminEmail.toLowerCase())) return true;

    res.status(403).json({ error: "Admin access required" });
    return false;
  } catch {
    res.status(500).json({ error: "Admin authorization check failed" });
    return false;
  }
}

// PUT /api/admin/settings/pix-discount — admin only
router.put(
  "/admin/settings/pix-discount",
  async (req: Request, res: Response) => {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    if (!(await requireAdmin(req, res, userId))) return;

    try {
      const { percent } = req.body;
      const value = Number(percent);

      // Validação estrita: aceita o 0 perfeitamente
      if (isNaN(value) || value < 0 || value > 100) {
        return res
          .status(400)
          .json({ error: "Percent must be a number between 0 and 100" });
      }

      await db
        .insert(settingsTable)
        .values({ key: PIX_DISCOUNT_KEY, value: String(value) })
        .onConflictDoUpdate({
          target: settingsTable.key,
          set: { value: String(value) },
        });

      return res.json({ percent: value });
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
