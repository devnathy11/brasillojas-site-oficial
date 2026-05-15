import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// GET /api/users/profile
router.get("/users/profile", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "GET /users/profile failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/users/profile — upsert (insert or update on id conflict)
router.put("/users/profile", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const { name, email, phone, address } = req.body;

    const missingFields: string[] = [];
    if (!name) missingFields.push("name");
    if (!email) missingFields.push("email");

    if (missingFields.length > 0) {
      res.status(422).json({ error: "Campos obrigatórios faltando", fields: missingFields });
      return;
    }

    const [user] = await db
      .insert(usersTable)
      .values({
        id: userId,
        name,
        email,
        phone: phone || null,
        address: address || null,
      })
      .onConflictDoUpdate({
        target: usersTable.id,
        set: {
          name,
          email,
          phone: phone || null,
          address: address || null,
          updatedAt: new Date(),
        },
      })
      .returning();

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "PUT /users/profile failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
