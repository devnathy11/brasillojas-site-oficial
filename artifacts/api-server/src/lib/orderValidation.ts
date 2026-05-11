import { db } from "@workspace/db";
import { usersTable, cartItemsTable, productsTable, categoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

/**
 * Validates that the user's profile is complete enough to place an order.
 * Requires: name, email, and phone only.
 * Returns an error message string if incomplete, or null if complete.
 */
export async function validateProfileComplete(userId: string): Promise<string | null> {
  const profileRows = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const profile = profileRows[0] ?? null;

  const complete = profile && profile.name && profile.email && profile.phone;

  if (!complete) {
    return "Perfil incompleto. Preencha nome, e-mail e telefone antes de finalizar a compra.";
  }
  return null;
}

/**
 * Validates the delivery method against the category rules for the user's current cart.
 * Returns an error message string if the rules are violated, or null if valid.
 *
 * Rules:
 *   - Móveis items require a complete shippingAddress.
 *   - All other orders may optionally include a shippingAddress (collected at checkout for all orders).
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

  const hasMoveisItems = cartItems.some(({ category }) => category?.slug === "moveis");

  if (hasMoveisItems) {
    const sa = shippingAddress;
    if (!sa || !sa.street || !sa.number || !sa.neighborhood || !sa.city || !sa.state || !sa.zipCode) {
      return "Endereço de entrega obrigatório para itens da categoria Móveis. Preencha todos os campos do endereço.";
    }
  }

  return null;
}
