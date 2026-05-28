import { clerkClient } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable, cartItemsTable, productsTable, categoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

/**
 * Ensures the user row exists in the DB. If not found, auto-creates it from Clerk.
 */
async function ensureUserRow(userId: string) {
  const existing = await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });
  if (existing) return existing;

  const clerkUser = await clerkClient.users.getUser(userId);
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || "Usuário";
  const email =
    clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress
    ?? clerkUser.emailAddresses[0]?.emailAddress
    ?? "";
  const phone = clerkUser.phoneNumbers.find((p) => p.id === clerkUser.primaryPhoneNumberId)?.phoneNumber ?? null;

  const [user] = await db
    .insert(usersTable)
    .values({ id: userId, name, email, phone })
    .onConflictDoUpdate({
      target: usersTable.id,
      set: { name, email, updatedAt: new Date() },
    })
    .returning();
  return user;
}

/**
 * Validates that the user's profile is complete enough to place an order.
 * If no DB row exists yet, auto-creates it from Clerk data.
 * Requires: name and email.
 */
export async function validateProfileComplete(userId: string): Promise<string | null> {
  const profile = await ensureUserRow(userId);

  if (!profile.name || !profile.email) {
    return "Perfil incompleto. Preencha seu nome e e-mail antes de finalizar a compra.";
  }
  return null;
}

/**
 * Validates the delivery method against the category rules for the user's current cart.
 * Returns an error message string if the rules are violated, or null if valid.
 *
 * Rules:
 *   - Móveis/Eletrônicos items require a complete shippingAddress.
 *   - All other orders may optionally include a shippingAddress.
 */
export async function validateDeliveryMethod(
  userId: string,
  shippingAddress: Record<string, string> | null | undefined
): Promise<string | null> {
  const cartItems = await db
    .select({ category: categoriesTable })
    .from(cartItemsTable)
    .innerJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(cartItemsTable.userId, userId));

  const DELIVERY_SLUGS = ["moveis", "eletronicos"];
  const hasMoveisItems = cartItems.some(({ category }) => DELIVERY_SLUGS.includes(category?.slug ?? ""));

  if (hasMoveisItems) {
    const sa = shippingAddress;
    if (!sa || !sa.street || !sa.number || !sa.neighborhood || !sa.city || !sa.state || !sa.zipCode) {
      return "Endereço de entrega obrigatório para itens de grande porte (Móveis e Eletrônicos). Preencha todos os campos do endereço.";
    }
  }

  return null;
}
