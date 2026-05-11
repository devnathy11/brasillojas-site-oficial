import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// GET /api/users/profile
router.get("/users/profile", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/users/profile
router.put("/users/profile", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { name, email, phone, address } = req.body;

    const missingFields: string[] = [];
    if (!name) missingFields.push("name");
    if (!email) missingFields.push("email");
    if (!phone) missingFields.push("phone");

    if (missingFields.length > 0) {
      return res.status(422).json({ error: "Campos obrigatórios faltando", fields: missingFields });
    }

    const existing = await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });

    let user;
    if (existing) {
      [user] = await db.update(usersTable).set({
        name,
        email,
        phone,
        address: address ?? existing.address,
        updatedAt: new Date(),
      }).where(eq(usersTable.id, userId)).returning();
    } else {
      [user] = await db.insert(usersTable).values({
        id: userId,
        name,
        email,
        phone,
        address: address ?? undefined,
      }).returning();
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
